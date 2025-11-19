import { supabase } from './supabase'
import { ActivityTrackingService } from './activityTracking'
import { UserProfilingService } from './userProfiling'

interface SecurityEvent {
  id: string
  user_id?: string
  session_id?: string
  event_type: 'login_attempt' | 'suspicious_activity' | 'data_breach' | 'abuse' | 'fraud' | 'policy_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  location?: {
    country?: string
    city?: string
    lat?: number
    lng?: number
  }
  risk_score: number
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  created_at?: string
  resolved_at?: string
  resolved_by?: string
}

interface FraudPattern {
  id: string
  pattern_name: string
  pattern_type: 'velocity' | 'behavioral' | 'technical' | 'content' | 'financial'
  detection_rules: {
    conditions: Array<{
      field: string
      operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'regex'
      value: any
      weight?: number
    }>
    threshold: number
    time_window?: number // in minutes
  }
  risk_score: number
  auto_actions?: string[]
  description: string
  is_active: boolean
  created_at?: string
}

interface SecurityAlert {
  id: string
  user_id?: string
  alert_type: 'account_takeover' | 'fraud' | 'abuse' | 'data_leak' | 'brute_force' | 'anomalous_behavior'
  title: string
  description: string
  risk_score: number
  requires_immediate_action: boolean
  recommended_actions: string[]
  detected_patterns: string[]
  evidence: Record<string, any>
  status: 'active' | 'investigating' | 'resolved' | 'dismissed'
  created_at?: string
  acknowledged_at?: string
  acknowledged_by?: string
}

interface RiskAssessment {
  user_id: string
  overall_risk_score: number
  risk_factors: {
    account_risk: number
    behavioral_risk: number
    technical_risk: number
    transaction_risk: number
    location_risk: number
  }
  risk_trend: 'improving' | 'stable' | 'deteriorating'
  last_assessment: string
  flagged_activities: string[]
  monitoring_level: 'standard' | 'enhanced' | 'high'
  next_review_date: string
}

interface IPReputation {
  ip_address: string
  reputation_score: number
  threat_types: string[]
  first_seen: string
  last_seen: string
  is_proxy: boolean
  is_vpn: boolean
  is_tor: boolean
  country: string
  asn: string
  organization: string
  abuse_confidence: number
}

export class SecuritySystemService {
  private static riskThresholds = {
    low: 30,
    medium: 60,
    high: 80,
    critical: 95
  }

  // Initialize security monitoring for user session
  static async initializeSecuritySession(userId: string, sessionId: string, requestContext: any) {
    try {
      // Analyze initial session risk
      const riskAssessment = await this.assessSessionRisk(userId, sessionId, requestContext)

      // Track security event
      await this.trackSecurityEvent({
        user_id: userId,
        session_id: sessionId,
        event_type: 'login_attempt',
        severity: this.getSeverityFromRiskScore(riskAssessment.overall_risk_score),
        description: 'User session initialization',
        ip_address: requestContext.ip,
        user_agent: requestContext.userAgent,
        location: requestContext.location,
        risk_score: riskAssessment.overall_risk_score,
        status: 'open'
      })

      // Update user monitoring level
      await this.updateUserMonitoringLevel(userId, riskAssessment.overall_risk_score)

      // Check for immediate threats
      if (riskAssessment.overall_risk_score > this.riskThresholds.high) {
        await this.triggerHighRiskProtocol(userId, riskAssessment)
      }

      return riskAssessment
    } catch (error) {
      console.error('Failed to initialize security session:', error)
      throw new Error('Security initialization failed')
    }
  }

  // Comprehensive risk assessment
  static async assessSessionRisk(userId: string, sessionId: string, requestContext: any): Promise<RiskAssessment> {
    try {
      // Get user profile and historical data
      const userProfile = await UserProfilingService.getUserProfile(userId)
      const userActivity = await ActivityTrackingService.getUserActivitySummary(userId, 30)

      // IP reputation check
      const ipReputation = await this.checkIPReputation(requestContext.ip)

      // Behavioral analysis
      const behavioralRisk = await this.assessBehavioralRisk(userId, userActivity, userProfile)

      // Technical risk factors
      const technicalRisk = await this.assessTechnicalRisk(requestContext, userActivity)

      // Location analysis
      const locationRisk = await this.assessLocationRisk(requestContext.location, userProfile)

      // Account risk (based on user profile)
      const accountRisk = this.assessAccountRisk(userProfile)

      // Transaction risk (if applicable)
      const transactionRisk = await this.assessTransactionRisk(userId)

      // Calculate overall risk score
      const riskFactors = {
        account_risk: accountRisk,
        behavioral_risk: behavioralRisk,
        technical_risk: technicalRisk,
        location_risk: locationRisk,
        transaction_risk: transactionRisk
      }

      const overall_risk_score = this.calculateOverallRiskScore(riskFactors)
      const risk_trend = await this.calculateRiskTrend(userId, overall_risk_score)

      return {
        user_id: userId,
        overall_risk_score,
        risk_factors: riskFactors,
        risk_trend,
        last_assessment: new Date().toISOString(),
        flagged_activities: await this.identifyFlaggedActivities(userId),
        monitoring_level: this.determineMonitoringLevel(overall_risk_score),
        next_review_date: this.calculateNextReviewDate(overall_risk_score)
      }
    } catch (error) {
      console.error('Failed to assess session risk:', error)
      return {
        user_id: userId,
        overall_risk_score: 50,
        risk_factors: {
          account_risk: 50,
          behavioral_risk: 50,
          technical_risk: 50,
          location_risk: 50,
          transaction_risk: 50
        },
        risk_trend: 'stable',
        last_assessment: new Date().toISOString(),
        flagged_activities: [],
        monitoring_level: 'standard',
        next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    }
  }

  // Real-time fraud detection
  static async detectFraudPatterns(userId: string, activity: any): Promise<SecurityAlert[]> {
    try {
      const alerts: SecurityAlert[] = []
      const activePatterns = await this.getActiveFraudPatterns()

      for (const pattern of activePatterns) {
        const match = await this.evaluatePattern(pattern, userId, activity)

        if (match.detected) {
          const alert: SecurityAlert = {
            user_id: userId,
            alert_type: 'fraud',
            title: `Fraud Pattern Detected: ${pattern.pattern_name}`,
            description: match.description || `Suspicious activity matching ${pattern.pattern_name} pattern`,
            risk_score: match.confidence * 100,
            requires_immediate_action: match.confidence > 0.8,
            recommended_actions: pattern.auto_actions || [],
            detected_patterns: [pattern.pattern_name],
            evidence: match.evidence,
            status: 'active',
            created_at: new Date().toISOString()
          }

          alerts.push(alert)

          // Auto-execute actions if configured
          if (pattern.auto_actions && match.confidence > 0.9) {
            await this.executeAutoActions(pattern.auto_actions, userId, match.evidence)
          }
        }
      }

      return alerts
    } catch (error) {
      console.error('Failed to detect fraud patterns:', error)
      return []
    }
  }

  // Monitor for account takeover attempts
  static async monitorAccountTakeover(userId: string, sessionData: any): Promise<SecurityAlert[]> {
    try {
      const alerts: SecurityAlert[] = []
      const recentSessions = await this.getRecentUserSessions(userId, 24) // Last 24 hours

      // Check for multiple login attempts from different locations
      const uniqueIPs = new Set(recentSessions.map(s => s.ip_address)).size
      const uniqueLocations = new Set(recentSessions.map(s => s.location?.country)).size

      if (uniqueIPs > 5 || uniqueLocations > 3) {
        alerts.push({
          user_id: userId,
          alert_type: 'account_takeover',
          title: 'Suspicious Login Pattern Detected',
          description: `Multiple login attempts from ${uniqueIPs} different IPs and ${uniqueLocations} countries in 24 hours`,
          risk_score: 85,
          requires_immediate_action: true,
          recommended_actions: [
            'Require additional authentication',
            'Lock account temporarily',
            'Notify user of suspicious activity'
          ],
          detected_patterns: ['multiple_location_login'],
          evidence: {
            unique_ips: uniqueIPs,
            unique_locations: uniqueLocations,
            time_window: '24 hours'
          },
          status: 'active',
          created_at: new Date().toISOString()
        })
      }

      // Check for impossible travel (logins from locations that would require impossible travel times)
      if (recentSessions.length > 1) {
        const impossibleTravel = this.detectImpossibleTravel(recentSessions)
        if (impossibleTravel.detected) {
          alerts.push({
            user_id: userId,
            alert_type: 'account_takeover',
            title: 'Impossible Travel Detected',
            description: `Login from ${impossibleTravel.current_location} detected ${impossibleTravel.time_diff} minutes after login from ${impossibleTravel.previous_location}`,
            risk_score: 95,
            requires_immediate_action: true,
            recommended_actions: [
              'Immediately lock account',
              'Require password reset',
              'Verify identity with additional factors'
            ],
            detected_patterns: ['impossible_travel'],
            evidence: impossibleTravel,
            status: 'active',
            created_at: new Date().toISOString()
          })
        }
      }

      return alerts
    } catch (error) {
      console.error('Failed to monitor account takeover:', error)
      return []
    }
  }

  // Behavioral anomaly detection
  static async detectBehavioralAnomalies(userId: string, currentActivity: any): Promise<SecurityAlert[]> {
    try {
      const alerts: SecurityAlert[] = []
      const userProfile = await UserProfilingService.getUserProfile(userId)
      const historicalActivity = await ActivityTrackingService.getUserActivitySummary(userId, 90)

      // Analyze typing patterns (for login forms, search, etc.)
      if (currentActivity.typing_pattern) {
        const typingAnomaly = this.analyzeTypingPattern(currentActivity.typing_pattern, userProfile.behavior_patterns)
        if (typingAnomaly.anomaly_score > 0.7) {
          alerts.push({
            user_id: userId,
            alert_type: 'anomalous_behavior',
            title: 'Unusual Typing Pattern Detected',
            description: 'User typing patterns significantly differ from established baseline',
            risk_score: typingAnomaly.anomaly_score * 100,
            requires_immediate_action: false,
            recommended_actions: ['Require additional verification', 'Monitor session closely'],
            detected_patterns: ['typing_anomaly'],
            evidence: typingAnomaly,
            status: 'active',
            created_at: new Date().toISOString()
          })
        }
      }

      // Analyze navigation patterns
      if (currentActivity.navigation_sequence) {
        const navigationAnomaly = this.analyzeNavigationPattern(currentActivity.navigation_sequence, userProfile.behavior_patterns)
        if (navigationAnomaly.anomaly_score > 0.8) {
          alerts.push({
            user_id: userId,
            alert_type: 'anomalous_behavior',
            title: 'Unusual Navigation Pattern',
            description: 'User navigation behavior deviates significantly from normal patterns',
            risk_score: navigationAnomaly.anomaly_score * 100,
            requires_immediate_action: false,
            recommended_actions: ['Monitor session', 'Verify user identity if needed'],
            detected_patterns: ['navigation_anomaly'],
            evidence: navigationAnomaly,
            status: 'active',
            created_at: new Date().toISOString()
          })
        }
      }

      return alerts
    } catch (error) {
      console.error('Failed to detect behavioral anomalies:', error)
      return []
    }
  }

  // Rate limiting and abuse detection
  static async checkRateLimits(userId: string, action: string, context: any): Promise<{
    allowed: boolean
    remaining: number
    resetTime?: number
    reason?: string
  }> {
    try {
      const limits = await this.getActionLimits(action, userId)
      const currentUsage = await this.getCurrentUsage(userId, action, limits.window_minutes)

      if (currentUsage >= limits.max_requests) {
        // Track rate limit violation
        await this.trackSecurityEvent({
          user_id: userId,
          event_type: 'abuse',
          severity: 'medium',
          description: `Rate limit exceeded for ${action}`,
          metadata: {
            action: action,
            current_usage: currentUsage,
            limit: limits.max_requests,
            window: limits.window_minutes
          },
          risk_score: 60,
          status: 'open'
        })

        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + (limits.window_minutes * 60 * 1000),
          reason: `Rate limit exceeded for ${action}. Maximum ${limits.max_requests} requests per ${limits.window_minutes} minutes.`
        }
      }

      return {
        allowed: true,
        remaining: limits.max_requests - currentUsage
      }
    } catch (error) {
      console.error('Failed to check rate limits:', error)
      // Fail open - allow the request if rate limiting fails
      return { allowed: true, remaining: 100 }
    }
  }

  // Data leak detection
  static async scanForDataLeaks(content: any, userId: string): Promise<SecurityAlert[]> {
    try {
      const alerts: SecurityAlert[] = []

      // PII detection
      const piiPatterns = [
        { name: 'email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
        { name: 'phone', regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
        { name: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
        { name: 'credit_card', regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g }
      ]

      const contentString = JSON.stringify(content)
      const foundPII: string[] = []

      piiPatterns.forEach(pattern => {
        const matches = contentString.match(pattern.regex)
        if (matches && matches.length > 0) {
          foundPII.push(pattern.name)
        }
      })

      if (foundPII.length > 0) {
        alerts.push({
          user_id: userId,
          alert_type: 'data_leak',
          title: 'Potential PII Exposure Detected',
          description: `Content contains potential Personally Identifiable Information: ${foundPII.join(', ')}`,
          risk_score: 75,
          requires_immediate_action: true,
          recommended_actions: [
            'Review and remove sensitive information',
            'Block content if confirmed',
            'Educate user about data privacy'
          ],
          detected_patterns: ['pii_exposure'],
          evidence: {
            detected_types: foundPII,
            content_preview: contentString.substring(0, 200)
          },
          status: 'active',
          created_at: new Date().toISOString()
        })
      }

      return alerts
    } catch (error) {
      console.error('Failed to scan for data leaks:', error)
      return []
    }
  }

  // Security event tracking
  static async trackSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<SecurityEvent> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .insert({
          ...event,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to track security event:', error)
      throw new Error('Unable to track security event')
    }
  }

  // Create and manage security alerts
  static async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'created_at'>): Promise<SecurityAlert> {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .insert({
          ...alert,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send notifications for high-priority alerts
      if (alert.requires_immediate_action || alert.risk_score > this.riskThresholds.high) {
        await this.sendSecurityNotification(data)
      }

      return data
    } catch (error) {
      console.error('Failed to create security alert:', error)
      throw new Error('Unable to create security alert')
    }
  }

  // Helper methods for risk assessment
  private static async assessBehavioralRisk(userId: string, activity: any[], profile: any): Promise<number> {
    try {
      let riskScore = 0

      // Activity frequency anomalies
      const recentActivity = activity.filter(a =>
        new Date(a.created_at!) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
      const avgDailyActivity = activity.length / 30
      const todayActivity = recentActivity.length

      if (todayActivity > avgDailyActivity * 5) {
        riskScore += 30 // Spike in activity
      } else if (todayActivity < avgDailyActivity * 0.1 && avgDailyActivity > 5) {
        riskScore += 20 // Sudden drop in activity
      }

      // Feature usage anomalies
      const normalFeatures = Object.keys(profile.feature_adoption || {})
      const recentFeatures = new Set(
        recentActivity
          .filter(a => a.activity_type === 'feature_usage')
          .map(a => a.activity_data?.feature_name)
      )

      const newFeatures = [...recentFeatures].filter(f => !normalFeatures.includes(f))
      if (newFeatures.length > 3) {
        riskScore += 25 // Sudden interest in new features
      }

      // Error rate anomalies
      const errorRate = recentActivity.filter(a => a.activity_type === 'error').length / recentActivity.length
      if (errorRate > 0.1) {
        riskScore += 35 // High error rate
      }

      return Math.min(riskScore, 100)
    } catch (error) {
      console.error('Failed to assess behavioral risk:', error)
      return 50
    }
  }

  private static async assessTechnicalRisk(requestContext: any, activity: any[]): Promise<number> {
    try {
      let riskScore = 0

      // Suspicious user agent
      if (this.isSuspiciousUserAgent(requestContext.userAgent)) {
        riskScore += 40
      }

      // Bot detection
      if (this.detectBotBehavior(requestContext)) {
        riskScore += 50
      }

      // Time-based anomalies
      const currentHour = new Date().getHours()
      const userTimePreferences = activity.reduce((acc: any, a) => {
        const hour = new Date(a.created_at!).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {})

      const peakHours = Object.entries(userTimePreferences)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([hour]) => parseInt(hour))

      if (!peakHours.includes(currentHour) && (currentHour < 6 || currentHour > 22)) {
        riskScore += 15 // Unusual activity time
      }

      return Math.min(riskScore, 100)
    } catch (error) {
      console.error('Failed to assess technical risk:', error)
      return 50
    }
  }

  private static async assessLocationRisk(location: any, profile: any): Promise<number> {
    try {
      let riskScore = 0

      // High-risk countries
      const highRiskCountries = ['CN', 'RU', 'IR', 'KP', 'SY']
      if (location?.country && highRiskCountries.includes(location.country)) {
        riskScore += 30
      }

      // New location
      const usualLocations = profile.device_preferences?.locations || []
      if (location?.country && !usualLocations.includes(location.country)) {
        riskScore += 20
      }

      // VPN/Proxy detection
      if (location?.is_vpn || location?.is_proxy) {
        riskScore += 25
      }

      return Math.min(riskScore, 100)
    } catch (error) {
      console.error('Failed to assess location risk:', error)
      return 50
    }
  }

  private static assessAccountRisk(profile: any): number {
    let riskScore = 0

    // Account age
    const accountAge = Date.now() - new Date(profile.created_at || Date.now()).getTime()
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)

    if (daysSinceCreation < 1) {
      riskScore += 40 // Very new account
    } else if (daysSinceCreation < 7) {
      riskScore += 20 // New account
    }

    // Verification status
    if (!profile.is_verified) {
      riskScore += 15
    }

    // Previous security events
    if (profile.security_incidents > 0) {
      riskScore += profile.security_incidents * 10
    }

    return Math.min(riskScore, 100)
  }

  private static async assessTransactionRisk(userId: string): Promise<number> {
    try {
      const { data: billing } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!billing || billing.length === 0) {
        return 0
      }

      let riskScore = 0

      // Sudden increase in spending
      const recentAmounts = billing.slice(0, 3).map(b => b.amount || 0)
      const historicalAmounts = billing.slice(3).map(b => b.amount || 0)

      if (historicalAmounts.length > 0) {
        const recentAvg = recentAmounts.reduce((a, b) => a + b, 0) / recentAmounts.length
        const historicalAvg = historicalAmounts.reduce((a, b) => a + b, 0) / historicalAmounts.length

        if (recentAvg > historicalAvg * 3) {
          riskScore += 30
        }
      }

      // Payment method changes
      const paymentMethods = new Set(billing.map(b => b.payment_method))
      if (paymentMethods.size > 2) {
        riskScore += 20
      }

      return Math.min(riskScore, 100)
    } catch (error) {
      console.error('Failed to assess transaction risk:', error)
      return 50
    }
  }

  private static calculateOverallRiskScore(riskFactors: any): number {
    const weights = {
      account_risk: 0.25,
      behavioral_risk: 0.30,
      technical_risk: 0.20,
      location_risk: 0.15,
      transaction_risk: 0.10
    }

    return Object.entries(weights).reduce((score, [factor, weight]) => {
      return score + (riskFactors[factor] || 0) * weight
    }, 0)
  }

  private static async calculateRiskTrend(userId: string, currentScore: number): Promise<'improving' | 'stable' | 'deteriorating'> {
    try {
      const { data: assessments } = await supabase
        .from('user_risk_assessments')
        .select('overall_risk_score')
        .eq('user_id', userId)
        .order('last_assessment', { ascending: false })
        .limit(5)

      if (!assessments || assessments.length < 2) {
        return 'stable'
      }

      const previousScore = assessments[1]?.overall_risk_score || 50
      const difference = currentScore - previousScore

      if (Math.abs(difference) < 5) {
        return 'stable'
      } else if (difference < 0) {
        return 'improving'
      } else {
        return 'deteriorating'
      }
    } catch (error) {
      return 'stable'
    }
  }

  private static determineMonitoringLevel(riskScore: number): 'standard' | 'enhanced' | 'high' {
    if (riskScore > 80) return 'high'
    if (riskScore > 60) return 'enhanced'
    return 'standard'
  }

  private static calculateNextReviewDate(riskScore: number): string {
    const hours = riskScore > 80 ? 1 : riskScore > 60 ? 6 : 24
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
  }

  private static getSeverityFromRiskScore(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore > this.riskThresholds.critical) return 'critical'
    if (riskScore > this.riskThresholds.high) return 'high'
    if (riskScore > this.riskThresholds.medium) return 'medium'
    return 'low'
  }

  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /scraping/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
      /automated/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  private static detectBotBehavior(requestContext: any): boolean {
    // Simple bot detection logic
    return !requestContext.userAgent ||
           requestContext.userAgent.length < 20 ||
           this.isSuspiciousUserAgent(requestContext.userAgent)
  }

  private static async checkIPReputation(ipAddress: string): Promise<IPReputation> {
    // Mock IP reputation check - in production, integrate with services like:
    // - AbuseIPDB
    // - VirusTotal
    // - IPQualityScore
    return {
      ip_address: ipAddress,
      reputation_score: 75,
      threat_types: [],
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      is_proxy: false,
      is_vpn: false,
      is_tor: false,
      country: 'US',
      asn: 'AS12345',
      organization: 'Example ISP',
      abuse_confidence: 5
    }
  }

  private static async getActiveFraudPatterns(): Promise<FraudPattern[]> {
    try {
      const { data, error } = await supabase
        .from('fraud_patterns')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get active fraud patterns:', error)
      return []
    }
  }

  private static async evaluatePattern(pattern: FraudPattern, userId: string, activity: any): Promise<{
    detected: boolean
    confidence: number
    description?: string
    evidence?: any
  }> {
    try {
      // Mock pattern evaluation - implement actual pattern matching logic
      // This would involve checking the activity against the pattern rules

      return {
        detected: false,
        confidence: 0
      }
    } catch (error) {
      console.error('Failed to evaluate pattern:', error)
      return {
        detected: false,
        confidence: 0
      }
    }
  }

  private static async executeAutoActions(actions: string[], userId: string, evidence: any): Promise<void> {
    try {
      for (const action of actions) {
        switch (action) {
          case 'lock_account':
            await this.lockUserAccount(userId, 'Auto-lock due to suspicious activity')
            break
          case 'require_verification':
            await this.requireAdditionalVerification(userId)
            break
          case 'log_out_user':
            await this.logOutUser(userId)
            break
          case 'notify_security_team':
            await this.notifySecurityTeam(userId, evidence)
            break
        }
      }
    } catch (error) {
      console.error('Failed to execute auto actions:', error)
    }
  }

  // Additional helper methods would be implemented here
  private static async lockUserAccount(userId: string, reason: string): Promise<void> {
    // Implementation for locking user account
  }

  private static async requireAdditionalVerification(userId: string): Promise<void> {
    // Implementation for requiring additional verification
  }

  private static async logOutUser(userId: string): Promise<void> {
    // Implementation for logging out user
  }

  private static async notifySecurityTeam(userId: string, evidence: any): Promise<void> {
    // Implementation for notifying security team
  }

  private static async sendSecurityNotification(alert: SecurityAlert): Promise<void> {
    // Implementation for sending security notifications
  }

  private static async updateUserMonitoringLevel(userId: string, riskScore: number): Promise<void> {
    // Implementation for updating user monitoring level
  }

  private static async triggerHighRiskProtocol(userId: string, riskAssessment: RiskAssessment): Promise<void> {
    // Implementation for high-risk protocol
  }

  private static async identifyFlaggedActivities(userId: string): Promise<string[]> {
    // Implementation for identifying flagged activities
    return []
  }

  private static async getRecentUserSessions(userId: string, hours: number): Promise<any[]> {
    // Implementation for getting recent user sessions
    return []
  }

  private static detectImpossibleTravel(sessions: any[]): any {
    // Implementation for detecting impossible travel
    return { detected: false }
  }

  private static analyzeTypingPattern(current: any, baseline: any): any {
    // Implementation for analyzing typing patterns
    return { anomaly_score: 0 }
  }

  private static analyzeNavigationPattern(current: any, baseline: any): any {
    // Implementation for analyzing navigation patterns
    return { anomaly_score: 0 }
  }

  private static async getActionLimits(action: string, userId: string): Promise<any> {
    // Implementation for getting action limits
    return { max_requests: 100, window_minutes: 60 }
  }

  private static async getCurrentUsage(userId: string, action: string, windowMinutes: number): Promise<number> {
    // Implementation for getting current usage
    return 0
  }
}

// Hook for security monitoring
export function useSecurityMonitoring(userId?: string) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(false)

  const initializeSecurity = async (sessionId: string, requestContext: any) => {
    if (!userId) return

    setLoading(true)
    try {
      const assessment = await SecuritySystemService.initializeSecuritySession(userId, sessionId, requestContext)
      setRiskAssessment(assessment)
    } catch (error) {
      console.error('Failed to initialize security:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkForAlerts = async () => {
    if (!userId) return

    try {
      const { data } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setAlerts(data || [])
    } catch (error) {
      console.error('Failed to check for alerts:', error)
    }
  }

  useEffect(() => {
    if (userId) {
      checkForAlerts()
    }
  }, [userId])

  return {
    alerts,
    riskAssessment,
    loading,
    initializeSecurity,
    checkForAlerts
  }
}