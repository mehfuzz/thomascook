-- RPC Functions for Supabase
-- Run this in Supabase SQL Editor

-- ============================================
-- Function to check if user is admin
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function to get user role
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function to calculate company health score
-- ============================================
CREATE OR REPLACE FUNCTION calculate_company_health_score(company_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 50;
  days_since_contact INTEGER;
  last_outcome TEXT;
  has_open_proposal BOOLEAN;
  has_upcoming_appointment BOOLEAN;
  company_tier TEXT;
BEGIN
  -- Get company info
  SELECT account_tier INTO company_tier
  FROM public.companies
  WHERE id = company_uuid;

  -- Days since last contact
  SELECT COALESCE(
    EXTRACT(DAY FROM (CURRENT_DATE - MAX(call_date)))::INTEGER,
    999
  ) INTO days_since_contact
  FROM public.sales_calls
  WHERE company_id = company_uuid;

  -- Apply contact recency bonus/penalty
  IF days_since_contact <= 7 THEN
    score := score + 20;
  ELSIF days_since_contact <= 14 THEN
    score := score + 15;
  ELSIF days_since_contact <= 30 THEN
    score := score + 10;
  ELSIF days_since_contact > 45 THEN
    score := score - 15;
  END IF;

  -- Check for open proposals
  SELECT EXISTS(
    SELECT 1 FROM public.proposals
    WHERE company_id = company_uuid
    AND status IN ('Sent', 'Under Review', 'Revision Requested')
  ) INTO has_open_proposal;

  IF has_open_proposal THEN
    score := score + 20;
  END IF;

  -- Get last call outcome
  SELECT call_outcome INTO last_outcome
  FROM public.sales_calls
  WHERE company_id = company_uuid
  ORDER BY call_date DESC, call_time DESC
  LIMIT 1;

  -- Apply outcome impact
  IF last_outcome IN ('Very Interested', 'Interested', 'Proposal Requested', 'Proposal Sent', 'Negotiating', 'Closed Won') THEN
    score := score + 15;
  ELSIF last_outcome IN ('Not Interested', 'Closed Lost') THEN
    score := score - 10;
  END IF;

  -- Check for upcoming appointments
  SELECT EXISTS(
    SELECT 1 FROM public.appointments
    WHERE company_id = company_uuid
    AND appointment_date >= CURRENT_DATE
    AND status = 'Scheduled'
  ) INTO has_upcoming_appointment;

  IF has_upcoming_appointment THEN
    score := score + 10;
  END IF;

  -- Account tier impact
  IF company_tier = 'Hot' THEN
    score := score + 5;
  ELSIF company_tier = 'Cold' THEN
    score := score - 5;
  END IF;

  -- Ensure score stays within bounds
  score := GREATEST(0, LEAST(100, score));

  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function to update company health score
-- ============================================
CREATE OR REPLACE FUNCTION update_company_health_score(company_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER;
BEGIN
  new_score := calculate_company_health_score(company_uuid);
  
  UPDATE public.companies
  SET health_score = new_score,
      updated_at = NOW()
  WHERE id = company_uuid;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function to get dashboard stats for user
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'todayCalls', (
      SELECT COUNT(*) FROM public.sales_calls
      WHERE user_id = user_uuid AND call_date = CURRENT_DATE
    ),
    'todayMeetings', (
      SELECT COUNT(*) FROM public.appointments
      WHERE user_id = user_uuid AND appointment_date = CURRENT_DATE
    ),
    'activeCompanies', (
      SELECT COUNT(*) FROM public.companies
      WHERE user_id = user_uuid
    ),
    'openProposalsValue', (
      SELECT COALESCE(SUM(proposal_value), 0)
      FROM public.proposals
      WHERE user_id = user_uuid
      AND status IN ('Sent', 'Under Review', 'Revision Requested')
    ),
    'pendingTasks', (
      SELECT COUNT(*) FROM public.tasks
      WHERE user_id = user_uuid AND status = 'Pending'
    ),
    'overdueTasksCount', (
      SELECT COUNT(*) FROM public.tasks
      WHERE user_id = user_uuid 
      AND status = 'Pending'
      AND due_date < CURRENT_DATE
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function to get unread reminders count
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_reminders_count(user_uuid UUID DEFAULT auth.uid())
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.reminders
    WHERE user_id = user_uuid
    AND is_sent = true
    AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger to auto-update company health score
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_company_health_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update health score when sales call is added/updated
  IF TG_TABLE_NAME = 'sales_calls' THEN
    PERFORM update_company_health_score(NEW.company_id);
  END IF;
  
  -- Update health score when appointment is added/updated
  IF TG_TABLE_NAME = 'appointments' THEN
    PERFORM update_company_health_score(NEW.company_id);
  END IF;
  
  -- Update health score when proposal is added/updated
  IF TG_TABLE_NAME = 'proposals' THEN
    PERFORM update_company_health_score(NEW.company_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating health scores
DROP TRIGGER IF EXISTS update_health_score_on_sales_call ON public.sales_calls;
CREATE TRIGGER update_health_score_on_sales_call
  AFTER INSERT OR UPDATE ON public.sales_calls
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_company_health_score();

DROP TRIGGER IF EXISTS update_health_score_on_appointment ON public.appointments;
CREATE TRIGGER update_health_score_on_appointment
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_company_health_score();

DROP TRIGGER IF EXISTS update_health_score_on_proposal ON public.proposals;
CREATE TRIGGER update_health_score_on_proposal
  AFTER INSERT OR UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_company_health_score();

-- ============================================
-- Grant execute permissions to authenticated users
-- ============================================
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_company_health_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_company_health_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_reminders_count(UUID) TO authenticated;
