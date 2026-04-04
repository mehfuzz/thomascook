import { format, parseISO, formatDistanceToNow, differenceInDays, isAfter, isBefore, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr)
  } catch (error) {
    return ''
  }
}

export function formatDateTime(date, formatStr = 'MMM dd, yyyy hh:mm a') {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr)
  } catch (error) {
    return ''
  }
}

export function getRelativeTime(date) {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    return ''
  }
}

export function getDaysUntil(date) {
  if (!date) return null
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return differenceInDays(dateObj, new Date())
  } catch (error) {
    return null
  }
}

export function isPastDue(date) {
  if (!date) return false
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isBefore(dateObj, new Date()) && !isToday(dateObj)
  } catch (error) {
    return false
  }
}

export function isUpcoming(date, daysAhead = 7) {
  if (!date) return false
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const futureDate = addDays(new Date(), daysAhead)
    return isAfter(dateObj, new Date()) && isBefore(dateObj, futureDate)
  } catch (error) {
    return false
  }
}

export function getTodayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getThisWeekRange() {
  const today = new Date()
  return {
    start: format(startOfWeek(today), 'yyyy-MM-dd'),
    end: format(endOfWeek(today), 'yyyy-MM-dd')
  }
}

export function getThisMonthRange() {
  const today = new Date()
  return {
    start: format(startOfMonth(today), 'yyyy-MM-dd'),
    end: format(endOfMonth(today), 'yyyy-MM-dd')
  }
}
