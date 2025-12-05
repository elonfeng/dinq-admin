/**
 * Monitor metrics types
 * Represents system monitoring data from /tool/common/api/queue/status
 */

export interface MonitorMetrics {
  // Current real-time metrics
  current: {
    active_tasks: number // Number of currently active tasks
    queued_tasks: number // Number of queued tasks
    total_in_flight: number // Total in-flight tasks
    memory_mb: number // Memory usage in MB
    cpu_percent: number // CPU usage percentage
  }

  // 7-day statistics
  stats_7d: {
    success: number // Number of successful tasks
    failure: number // Number of failed tasks
    partial_failure: number // Number of partially failed tasks
  }

  // 7-day peak metrics
  peaks_7d: {
    max_concurrent_tasks: number // Maximum concurrent tasks
    max_concurrent_time: string // Time of max concurrent (ISO 8601)
    max_memory_mb: number // Maximum memory usage in MB
    max_memory_time: string // Time of max memory (ISO 8601)
    max_cpu_percent: number // Maximum CPU usage percentage
    max_cpu_time: string // Time of max CPU (ISO 8601)
    tracking_since: string // Start tracking time (ISO 8601)
  }

  timestamp: string // Data timestamp (ISO 8601)
}

export interface MonitorRefreshConfig {
  enabled: boolean // Whether auto-refresh is enabled
  interval: number // Refresh interval in milliseconds (default: 5000)
  retryOnError: boolean // Whether to retry on error
}
