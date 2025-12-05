/**
 * Data formatting utilities
 * Provides functions for formatting dates, numbers, percentages, etc.
 */

/**
 * Format date to localized string
 */
export function formatDate(date: string | Date, locale: string = 'zh-CN'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch (error) {
    console.error('Failed to format date:', error)
    return String(date)
  }
}

/**
 * Format datetime to localized string with time
 */
export function formatDateTime(date: string | Date, locale: string = 'zh-CN'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (error) {
    console.error('Failed to format datetime:', error)
    return String(date)
  }
}

/**
 * Format relative time (e.g. "2 hours ago")
 */
export function formatRelativeTime(date: string | Date, locale: string = 'zh-CN'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) {
      return locale === 'zh-CN' ? `${diffSec} 秒前` : `${diffSec} seconds ago`
    } else if (diffMin < 60) {
      return locale === 'zh-CN' ? `${diffMin} 分钟前` : `${diffMin} minutes ago`
    } else if (diffHour < 24) {
      return locale === 'zh-CN' ? `${diffHour} 小时前` : `${diffHour} hours ago`
    } else if (diffDay < 7) {
      return locale === 'zh-CN' ? `${diffDay} 天前` : `${diffDay} days ago`
    } else {
      return formatDate(d, locale)
    }
  } catch (error) {
    console.error('Failed to format relative time:', error)
    return String(date)
  }
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, decimals: number = 0): string {
  try {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  } catch (error) {
    console.error('Failed to format number:', error)
    return String(num)
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  try {
    return `${value.toFixed(decimals)}%`
  } catch (error) {
    console.error('Failed to format percentage:', error)
    return String(value)
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Format memory in MB
 */
export function formatMemory(mb: number): string {
  return `${formatNumber(mb, 1)} MB`
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}
