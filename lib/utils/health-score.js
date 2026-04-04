/**
 * Calculate company health score based on multiple factors
 * Range: 0-100
 */
export function calculateHealthScore(company, lastCall, lastOutcome, upcomingAppointments, openProposals, daysSinceContact) {
  let score = 50 // Base score

  // Recent contact bonus
  if (daysSinceContact <= 7) {
    score += 20
  } else if (daysSinceContact <= 14) {
    score += 15
  } else if (daysSinceContact <= 30) {
    score += 10
  } else if (daysSinceContact > 45) {
    score -= 15
  }

  // Open proposal bonus
  if (openProposals > 0) {
    score += 20
  }

  // Last outcome impact
  const positiveOutcomes = ['Very Interested', 'Interested', 'Proposal Requested', 'Proposal Sent', 'Negotiating', 'Closed Won']
  const negativeOutcomes = ['Not Interested', 'Closed Lost']
  
  if (lastOutcome && positiveOutcomes.includes(lastOutcome)) {
    score += 15
  } else if (lastOutcome && negativeOutcomes.includes(lastOutcome)) {
    score -= 10
  }

  // Upcoming appointment bonus
  if (upcomingAppointments > 0) {
    score += 10
  }

  // Account tier impact
  if (company.account_tier === 'Hot') {
    score += 5
  } else if (company.account_tier === 'Cold') {
    score -= 5
  }

  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score))
}

export function getHealthScoreColor(score) {
  if (score >= 70) return 'green'
  if (score >= 40) return 'amber'
  return 'red'
}

export function getHealthScoreBadge(score) {
  if (score >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (score >= 40) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}
