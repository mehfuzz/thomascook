/**
 * Format currency in Indian numbering system
 */
export function formatCurrency(amount, showSymbol = true) {
  if (amount === null || amount === undefined) return showSymbol ? '₹0' : '0'
  
  const num = parseFloat(amount)
  if (isNaN(num)) return showSymbol ? '₹0' : '0'

  // Convert to Indian numbering system
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  })

  return showSymbol ? `₹${formatted}` : formatted
}

export function formatCurrencyLakhs(amount) {
  if (amount === null || amount === undefined) return '₹0 L'
  
  const num = parseFloat(amount)
  if (isNaN(num)) return '₹0 L'

  const lakhs = num / 100000
  return `₹${lakhs.toFixed(2)} L`
}

export function formatCurrencyCrores(amount) {
  if (amount === null || amount === undefined) return '₹0 Cr'
  
  const num = parseFloat(amount)
  if (isNaN(num)) return '₹0 Cr'

  const crores = num / 10000000
  return `₹${crores.toFixed(2)} Cr`
}
