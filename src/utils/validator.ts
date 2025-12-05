/**
 * Input validation utilities
 * Provides validation functions for URLs, numbers, etc.
 */

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate GitHub URL
 */
export function isValidGitHubUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  const pattern = /^https?:\/\/(www\.)?github\.com\/.+/
  return pattern.test(url)
}

/**
 * Validate Google Scholar URL
 */
export function isValidScholarUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  const pattern = /^https?:\/\/(www\.)?scholar\.google\.com\/citations\?user=.+/
  return pattern.test(url)
}

/**
 * Validate LinkedIn URL
 */
export function isValidLinkedInUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  const pattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/
  return pattern.test(url)
}

/**
 * Validate Twitter URL
 */
export function isValidTwitterUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  const pattern = /^https?:\/\/(www\.)?(twitter|x)\.com\/.+/
  return pattern.test(url)
}

/**
 * Validate HuggingFace URL
 */
export function isValidHuggingFaceUrl(url: string): boolean {
  if (!isValidUrl(url)) return false
  const pattern = /^https?:\/\/(www\.)?huggingface\.co\/.+/
  return pattern.test(url)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

/**
 * Validate number in range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Validate required field
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return pattern.test(uuid)
}

/**
 * Validate weight value (typically 0.8 - 2.0 range for multipliers)
 */
export function isValidWeight(value: number): boolean {
  return isInRange(value, 0.1, 5.0)
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(value: number): boolean {
  return isInRange(value, 0, 100)
}

/**
 * Validate social URLs object
 * At least one URL must be provided
 */
export function validateSocialUrls(socialUrls: Record<string, string>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const urls = Object.entries(socialUrls).filter(([, url]) => url && url.trim().length > 0)

  if (urls.length === 0) {
    errors.push('至少需要提供一个社交链接')
    return { valid: false, errors }
  }

  for (const [platform, url] of urls) {
    switch (platform) {
      case 'github':
        if (!isValidGitHubUrl(url)) {
          errors.push('GitHub URL 格式不正确')
        }
        break
      case 'scholar':
        if (!isValidScholarUrl(url)) {
          errors.push('Google Scholar URL 格式不正确')
        }
        break
      case 'linkedin':
        if (!isValidLinkedInUrl(url)) {
          errors.push('LinkedIn URL 格式不正确')
        }
        break
      case 'twitter':
        if (!isValidTwitterUrl(url)) {
          errors.push('Twitter/X URL 格式不正确')
        }
        break
      case 'huggingface':
        if (!isValidHuggingFaceUrl(url)) {
          errors.push('HuggingFace URL 格式不正确')
        }
        break
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate weight configuration
 * Check all weight parameters are in valid range
 */
export function validateWeightConfig(config: Record<string, any>): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!config.name || config.name.trim().length === 0) {
    errors.push('权重配置名称不能为空')
  }

  // Weight parameter ranges
  const parameterRanges: Record<string, { min: number; max: number }> = {
    // Relationship weights: 0-2.0 (0 means exclude, 2.0 means double weight)
    relationship_family: { min: 0, max: 2 },
    relationship_partner: { min: 0, max: 2 },
    relationship_friend: { min: 0, max: 2 },
    relationship_colleague: { min: 0, max: 2 },
    relationship_mentor: { min: 0, max: 2 },
    relationship_other: { min: 0, max: 2 },
    // Achievement weights: 0-2.0
    achievement_career: { min: 0, max: 2 },
    achievement_education: { min: 0, max: 2 },
    achievement_personal: { min: 0, max: 2 },
    achievement_social: { min: 0, max: 2 },
    achievement_creative: { min: 0, max: 2 },
    achievement_sports: { min: 0, max: 2 },
    achievement_other: { min: 0, max: 2 },
    // Topology weights: 0-2.0
    topology_centrality: { min: 0, max: 2 },
    topology_clustering: { min: 0, max: 2 },
    topology_betweenness: { min: 0, max: 2 },
    topology_closeness: { min: 0, max: 2 },
    // Influence weights: 0-2.0
    influence_direct: { min: 0, max: 2 },
    influence_indirect: { min: 0, max: 2 },
    influence_decay: { min: 0, max: 1 }, // Decay must be 0-1
    // Time weights: 0-2.0
    time_recency: { min: 0, max: 2 },
    time_duration: { min: 0, max: 2 },
    time_frequency: { min: 0, max: 2 },
    // Score weights: 0-2.0
    score_importance: { min: 0, max: 2 },
    score_impact: { min: 0, max: 2 },
    score_uniqueness: { min: 0, max: 2 },
  }

  // Validate each parameter
  for (const [key, range] of Object.entries(parameterRanges)) {
    const value = config[key]
    if (value === undefined || value === null) {
      errors.push(`缺少权重参数: ${key}`)
      continue
    }
    if (typeof value !== 'number') {
      errors.push(`权重参数 ${key} 必须是数字`)
      continue
    }
    if (!isInRange(value, range.min, range.max)) {
      errors.push(`权重参数 ${key} 超出范围 [${range.min}, ${range.max}]: ${value}`)
    }
  }

  // Check warnings: all weights set to 0
  const allZero = Object.keys(parameterRanges).every((key) => config[key] === 0)
  if (allZero) {
    warnings.push('所有权重参数都设置为0，可能导致无法生成有意义的网络')
  }

  // Check warnings: relationship weights highly unbalanced
  const relationshipWeights = [
    config.relationship_family,
    config.relationship_partner,
    config.relationship_friend,
    config.relationship_colleague,
    config.relationship_mentor,
    config.relationship_other,
  ].filter((w) => typeof w === 'number')

  if (relationshipWeights.length > 0) {
    const max = Math.max(...relationshipWeights)
    const min = Math.min(...relationshipWeights.filter((w) => w > 0))
    if (max / min > 10) {
      warnings.push('关系权重差异过大（最大/最小 > 10），可能导致某些关系被忽略')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
