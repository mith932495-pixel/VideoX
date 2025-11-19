import { supabase } from './supabase'
import { ActivityTrackingService } from './activityTracking'

interface UserProfileData {
  id: string
  user_id: string
  personality_traits?: Record<string, number>
  behavior_patterns?: Record<string, any>
  preferences?: Record<string, any>
  interests?: string[]
  skill_level?: string
  engagement_score?: number
  satisfaction_score?: number
  likelihood_to_churn?: number
  predicted_lifetime_value?: number
  user_segment?: string
  acquisition_channel?: string
  device_preferences?: Record<string, number>
  time_preferences?: Record<string, number>
  feature_adoption?: Record<string, number>
  conversion_history?: any[]
  support_interactions?: number
  bug_reports?: number
  feature_requests?: number
  community_engagement?: number
  created_at?: string
  updated_at?: string
}

interface BehaviorPattern {
  session_duration_avg?: number
  pages_per_session?: number
  bounce_rate?: number
  return_visit_frequency?: number
  peak_activity_hours?: number[]
  preferred_content_types?: string[]
  feature_usage_frequency?: Record<string, number>
  navigation_patterns?: string[]
  search_patterns?: Record<string, any>
  error_encounter_rate?: number
  help_seeking_behavior?: number
  social_sharing_tendency?: number
  feedback_proclivity?: number
}

interface UserInsight {
  user_id: string
  insight_type: 'prediction' | 'recommendation' | 'alert' | 'opportunity'
  title: string
  description: string
  confidence_score: number
  action_required: boolean
  suggested_actions?: string[]
  impact_level: 'low' | 'medium' | 'high' | 'critical'
  category: 'engagement' | 'retention' | 'conversion' | 'satisfaction' | 'behavior'
  metadata?: Record<string, any>
  created_at?: string
  acknowledged_at?: string
}

interface UserJourney {
  user_id: string
  journey_stage: 'awareness' | 'consideration' | 'trial' | 'conversion' | 'retention' | 'advocacy'
  stage_entry_date: string
  stage_duration?: number
  progression_probability?: number
  blockers?: string[]
  catalysts?: string[]
  next_best_actions?: string[]
  risk_factors?: string[]
  opportunities?: string[]
  touchpoints?: string[]
  sentiment_score?: number
  conversion_probability?: number
  churn_probability?: number
}

export class UserProfilingService {
  // Create or update user profile
  static async createOrUpdateProfile(userId: string): Promise<UserProfileData> {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existingProfile) {
        return await this.updateProfile(userId)
      }

      // Analyze user behavior to build profile
      const profileData = await this.analyzeUserProfile(userId)

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create/update user profile:', error)
      throw new Error('Unable to create user profile')
    }
  }

  // Analyze user data to build comprehensive profile
  static async analyzeUserProfile(userId: string): Promise<Partial<UserProfileData>> {
    try {
      const userActivity = await ActivityTrackingService.getUserActivitySummary(userId, 90)
      const behaviorPatterns = await this.analyzeBehaviorPatterns(userId)
      const preferences = await this.analyzeUserPreferences(userId)
      const personalityTraits = await this.analyzePersonalityTraits(userId)
      const engagementScore = await this.calculateEngagementScore(userId)
      const satisfactionScore = await this.calculateSatisfactionScore(userId)
      const churnRisk = await this.calculateChurnRisk(userId)
      const predictedLTV = await this.predictLifetimeValue(userId)
      const userSegment = await this.segmentUser(userId)

      return {
        personality_traits: personalityTraits,
        behavior_patterns: behaviorPatterns,
        preferences: preferences,
        engagement_score: engagementScore,
        satisfaction_score: satisfactionScore,
        likelihood_to_churn: churnRisk,
        predicted_lifetime_value: predictedLTV,
        user_segment: userSegment,
        skill_level: await this.assessSkillLevel(userId),
        device_preferences: await this.analyzeDevicePreferences(userId),
        time_preferences: await this.analyzeTimePreferences(userId),
        feature_adoption: await this.analyzeFeatureAdoption(userId),
        acquisition_channel: await this.getAcquisitionChannel(userId)
      }
    } catch (error) {
      console.error('Failed to analyze user profile:', error)
      return {}
    }
  }

  // Analyze behavior patterns
  static async analyzeBehaviorPatterns(userId: string): Promise<BehaviorPattern> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })

      if (!activities || activities.length === 0) {
        return {}
      }

      // Session analysis
      const sessions = this.groupActivitiesBySessions(activities)
      const sessionDurations = sessions.map(session => {
        const start = new Date(session[0].created_at!)
        const end = new Date(session[session.length - 1].created_at!)
        return (end.getTime() - start.getTime()) / 1000 // Convert to seconds
      })

      // Activity patterns
      const pageViews = activities.filter(a => a.activity_type === 'page_view')
      const featureUsage = activities.filter(a => a.activity_type === 'feature_usage')
      const searchQueries = activities.filter(a => a.activity_type === 'search')
      const errorEvents = activities.filter(a => a.activity_type === 'error')
      const supportInteractions = activities.filter(a => a.activity_type === 'support')

      // Time analysis
      const hourCounts = new Array(24).fill(0)
      activities.forEach(activity => {
        const hour = new Date(activity.created_at!).getHours()
        hourCounts[hour]++
      })

      const peakHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => item.hour)

      // Feature usage frequency
      const featureFreq: Record<string, number> = {}
      featureUsage.forEach(usage => {
        const feature = usage.activity_data?.feature_name
        if (feature) {
          featureFreq[feature] = (featureFreq[feature] || 0) + 1
        }
      })

      return {
        session_duration_avg: sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length,
        pages_per_session: pageViews.length / sessions.length,
        bounce_rate: this.calculateBounceRate(sessions),
        return_visit_frequency: this.calculateReturnVisitFrequency(activities),
        peak_activity_hours: peakHours,
        feature_usage_frequency: featureFreq,
        error_encounter_rate: errorEvents.length / activities.length,
        help_seeking_behavior: supportInteractions.length / activities.length,
        preferred_content_types: this.extractPreferredContentTypes(pageViews),
        navigation_patterns: this.extractNavigationPatterns(pageViews),
        search_patterns: this.analyzeSearchPatterns(searchQueries)
      }
    } catch (error) {
      console.error('Failed to analyze behavior patterns:', error)
      return {}
    }
  }

  // Analyze user preferences
  static async analyzeUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

      if (!activities) return {}

      const preferences: Record<string, any> = {}

      // Video enhancement preferences
      const videoEnhancements = activities.filter(a =>
        a.activity_type === 'video_enhancement'
      )
      if (videoEnhancements.length > 0) {
        preferences.video_preferences = this.analyzeVideoPreferences(videoEnhancements)
      }

      // Content preferences
      const pageViews = activities.filter(a => a.activity_type === 'page_view')
      if (pageViews.length > 0) {
        preferences.content_preferences = this.analyzeContentPreferences(pageViews)
      }

      // Feature preferences
      const featureUsage = activities.filter(a => a.activity_type === 'feature_usage')
      if (featureUsage.length > 0) {
        preferences.feature_preferences = this.analyzeFeaturePreferences(featureUsage)
      }

      // Communication preferences
      preferences.communication_preferences = await this.analyzeCommunicationPreferences(userId)

      return preferences
    } catch (error) {
      console.error('Failed to analyze user preferences:', error)
      return {}
    }
  }

  // Analyze personality traits based on behavior
  static async analyzePersonalityTraits(userId: string): Promise<Record<string, number>> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

      if (!activities || activities.length < 10) {
        return {
          innovativeness: 0.5,
          thoroughness: 0.5,
          social_tendency: 0.5,
          quality_orientation: 0.5,
          price_sensitivity: 0.5,
          tech_savviness: 0.5
        }
      }

      const traits: Record<string, number> = {}

      // Innovativeness (early adoption of features)
      const featureUsage = activities.filter(a => a.activity_type === 'feature_usage')
      const uniqueFeatures = new Set(featureUsage.map(f => f.activity_data?.feature_name))
      traits.innovativeness = Math.min(uniqueFeatures.size / 10, 1)

      // Thoroughness (time spent on pages, help-seeking behavior)
      const pageViews = activities.filter(a => a.activity_type === 'page_view')
      const avgViewDuration = pageViews.reduce((sum, view) =>
        sum + (view.activity_data?.view_duration || 0), 0) / pageViews.length
      traits.thoroughness = Math.min(avgViewDuration / 60000, 1) // Normalize to minutes

      // Social tendency (sharing, referrals, community engagement)
      const sharingEvents = activities.filter(a =>
        a.activity_data?.action?.includes('share') ||
        a.activity_type === 'referral'
      )
      traits.social_tendency = Math.min(sharingEvents.length / activities.length * 10, 1)

      // Quality orientation (retry rates, enhancement attempts)
      const enhancementEvents = activities.filter(a => a.activity_type === 'video_enhancement')
      const retryRate = enhancementEvents.filter(e =>
        e.activity_data?.action === 'retry' ||
        e.activity_data?.action === 're_enhance'
      ).length / enhancementEvents.length
      traits.quality_orientation = Math.min(1 - retryRate, 1)

      // Price sensitivity (free tier usage, conversion timing)
      traits.price_sensitivity = await this.analyzePriceSensitivity(userId)

      // Tech savviness (error rates, help-seeking, advanced features)
      const errorEvents = activities.filter(a => a.activity_type === 'error')
      const advancedFeatures = featureUsage.filter(f =>
        f.activity_data?.feature_name?.includes('advanced') ||
        f.activity_data?.feature_name?.includes('pro')
      )
      traits.tech_savviness = Math.min(
        (1 - errorEvents.length / activities.length) * 2,
        advancedFeatures.length / 5
      )

      return traits
    } catch (error) {
      console.error('Failed to analyze personality traits:', error)
      return {}
    }
  }

  // Calculate engagement score
  static async calculateEngagementScore(userId: string): Promise<number> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (!activities || activities.length === 0) return 0

      let score = 0

      // Activity frequency (30%)
      const activityFrequency = Math.min(activities.length / 30, 1) // Normalize by days
      score += activityFrequency * 0.3

      // Session depth (25%)
      const sessions = this.groupActivitiesBySessions(activities)
      const avgSessionLength = sessions.reduce((sum, session) =>
        sum + session.length, 0) / sessions.length
      score += Math.min(avgSessionLength / 10, 1) * 0.25

      // Feature adoption (20%)
      const uniqueFeatures = new Set(
        activities
          .filter(a => a.activity_type === 'feature_usage')
          .map(a => a.activity_data?.feature_name)
      )
      score += Math.min(uniqueFeatures.size / 8, 1) * 0.2

      // Content interaction (15%)
      const pageViews = activities.filter(a => a.activity_type === 'page_view')
      const videoEnhancements = activities.filter(a => a.activity_type === 'video_enhancement')
      score += Math.min((pageViews.length + videoEnhancements.length * 2) / 20, 1) * 0.15

      // Return visits (10%)
      const uniqueDays = new Set(
        activities.map(a => new Date(a.created_at!).toDateString())
      ).size
      score += Math.min(uniqueDays / 15, 1) * 0.1

      return Math.round(score * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      console.error('Failed to calculate engagement score:', error)
      return 0
    }
  }

  // Calculate satisfaction score
  static async calculateSatisfactionScore(userId: string): Promise<number> {
    try {
      // Get feedback, ratings, and satisfaction indicators
      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: support } = await supabase
        .from('support_interactions')
        .select('*')
        .eq('user_id', userId)

      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .in('activity_type', ['conversion', 'feature_usage', 'error'])

      let score = 0.5 // Base score

      // Direct feedback ratings (40%)
      if (feedback && feedback.length > 0) {
        const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 5), 0) / feedback.length
        score += (avgRating - 5) / 10 * 0.4
      }

      // Support sentiment (20%)
      if (support && support.length > 0) {
        const positiveSupport = support.filter(s => s.sentiment === 'positive').length
        const supportScore = positiveSupport / support.length
        score += (supportScore - 0.5) * 0.4
      }

      // Behavioral indicators (30%)
      if (activities) {
        const conversions = activities.filter(a => a.activity_type === 'conversion').length
        const errors = activities.filter(a => a.activity_type === 'error').length
        const featureUsage = activities.filter(a => a.activity_type === 'feature_usage').length

        const behaviorScore = (conversions * 2 + featureUsage) / (activities.length + 1)
        score += (behaviorScore - 0.3) * 0.3
      }

      // Churn risk inverse (10%)
      const churnRisk = await this.calculateChurnRisk(userId)
      score += (1 - churnRisk) * 0.1

      return Math.max(0, Math.min(1, score)) // Clamp between 0 and 1
    } catch (error) {
      console.error('Failed to calculate satisfaction score:', error)
      return 0.5
    }
  }

  // Calculate churn risk
  static async calculateChurnRisk(userId: string): Promise<number> {
    try {
      const profile = await this.getUserProfile(userId)
      const recentActivity = await ActivityTrackingService.getUserActivitySummary(userId, 14)

      let riskScore = 0

      // Recent inactivity (30%)
      const daysSinceLastActivity = recentActivity.length > 0 ?
        Math.floor((Date.now() - new Date(recentActivity[0].created_at!).getTime()) / (1000 * 60 * 60 * 24)) :
        30
      riskScore += Math.min(daysSinceLastActivity / 14, 1) * 0.3

      // Declining engagement (25%)
      if (profile.engagement_score !== undefined) {
        riskScore += (1 - profile.engagement_score) * 0.25
      }

      // Low satisfaction (20%)
      if (profile.satisfaction_score !== undefined) {
        riskScore += (1 - profile.satisfaction_score) * 0.2
      }

      // Support issues (15%)
      const { data: recentSupport } = await supabase
        .from('support_interactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (recentSupport && recentSupport.length > 2) {
        riskScore += Math.min(recentSupport.length / 10, 1) * 0.15
      }

      // Feature adoption (10%)
      const featureAdoption = profile.feature_adoption || {}
      const adoptedFeatures = Object.values(featureAdoption).filter(usage => usage > 0).length
      riskScore += Math.max(0, 1 - adoptedFeatures / 5) * 0.1

      return Math.min(riskScore, 1) // Cap at 1 (100% risk)
    } catch (error) {
      console.error('Failed to calculate churn risk:', error)
      return 0.5
    }
  }

  // Predict lifetime value
  static async predictLifetimeValue(userId: string): Promise<number> {
    try {
      const profile = await this.getUserProfile(userId)
      const { data: billing } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      let baseLTV = 100 // Base value for all users

      // Historical spending (40%)
      if (billing && billing.length > 0) {
        const totalSpent = billing.reduce((sum, b) => sum + (b.amount || 0), 0)
        const monthlyAvg = totalSpent / Math.max(billing.length, 1)
        baseLTV += monthlyAvg * 12 // Project to yearly
      }

      // Engagement multiplier (30%)
      if (profile.engagement_score !== undefined) {
        baseLTV *= (1 + profile.engagement_score * 2)
      }

      // Satisfaction multiplier (20%)
      if (profile.satisfaction_score !== undefined) {
        baseLTV *= (1 + profile.satisfaction_score)
      }

      // Segment adjustment (10%)
      const segmentMultiplier = {
        'power_user': 2.5,
        'professional': 2.0,
        'regular': 1.0,
        'casual': 0.5,
        'at_risk': 0.3
      }[profile.user_segment || 'casual']

      baseLTV *= segmentMultiplier

      return Math.round(baseLTV * 100) / 100 // Round to 2 decimal places
    } catch (error) {
      console.error('Failed to predict lifetime value:', error)
      return 100
    }
  }

  // Segment users based on behavior and characteristics
  static async segmentUser(userId: string): Promise<string> {
    try {
      const profile = await this.getUserProfile(userId)
      const recentActivity = await ActivityTrackingService.getUserActivitySummary(userId, 30)

      const engagementScore = profile.engagement_score || 0
      const satisfactionScore = profile.satisfaction_score || 0
      const ltv = profile.predicted_lifetime_value || 0
      const churnRisk = profile.likelihood_to_churn || 0

      // Advanced power user criteria
      const featureUsage = recentActivity.filter(a => a.activity_type === 'feature_usage')
      const uniqueFeatures = new Set(featureUsage.map(f => f.activity_data?.feature_name))
      const videoEnhancements = recentActivity.filter(a => a.activity_type === 'video_enhancement')

      if (engagementScore > 0.8 &&
          satisfactionScore > 0.8 &&
          uniqueFeatures.size > 5 &&
          videoEnhancements.length > 10) {
        return 'power_user'
      }

      // Professional user
      if (engagementScore > 0.6 &&
          satisfactionScore > 0.7 &&
          uniqueFeatures.size > 3 &&
          ltv > 200) {
        return 'professional'
      }

      // At risk user
      if (churnRisk > 0.7 ||
          engagementScore < 0.2 ||
          satisfactionScore < 0.3) {
        return 'at_risk'
      }

      // Casual user
      if (engagementScore < 0.4 ||
          uniqueFeatures.size < 2 ||
          videoEnhancements.length < 3) {
        return 'casual'
      }

      return 'regular'
    } catch (error) {
      console.error('Failed to segment user:', error)
      return 'regular'
    }
  }

  // Generate user insights and recommendations
  static async generateUserInsights(userId: string): Promise<UserInsight[]> {
    try {
      const profile = await this.getUserProfile(userId)
      const insights: UserInsight[] = []

      // Churn risk alerts
      if (profile.likelihood_to_churn && profile.likelihood_to_churn > 0.7) {
        insights.push({
          user_id: userId,
          insight_type: 'alert',
          title: 'High Churn Risk Detected',
          description: `User shows ${Math.round(profile.likelihood_to_churn * 100)}% probability of churning based on declining engagement and activity patterns.`,
          confidence_score: profile.likelihood_to_churn,
          action_required: true,
          suggested_actions: [
            'Send personalized re-engagement campaign',
            'Offer special discount or credits',
            'Schedule proactive support outreach'
          ],
          impact_level: 'critical',
          category: 'retention'
        })
      }

      // Upsell opportunities
      if (profile.predicted_lifetime_value && profile.predicted_lifetime_value > 300) {
        insights.push({
          user_id: userId,
          insight_type: 'opportunity',
          title: 'High-Value Upsell Opportunity',
          description: 'User behavior patterns suggest readiness for premium features or enterprise plan.',
          confidence_score: 0.8,
          action_required: true,
          suggested_actions: [
            'Show premium feature highlights',
            'Send targeted upgrade campaign',
            'Offer enterprise plan demo'
          ],
          impact_level: 'high',
          category: 'conversion'
        })
      }

      // Feature adoption recommendations
      const lowAdoptionFeatures = Object.entries(profile.feature_adoption || {})
        .filter(([_, usage]) => usage < 0.2)
        .map(([feature]) => feature)

      if (lowAdoptionFeatures.length > 0) {
        insights.push({
          user_id: userId,
          insight_type: 'recommendation',
          title: 'Underutilized Features Detected',
          description: `User hasn't discovered ${lowAdoptionFeatures.length} valuable features that could enhance their experience.`,
          confidence_score: 0.7,
          action_required: false,
          suggested_actions: [
            'Send feature discovery tutorials',
            'Highlight features in relevant contexts',
            'Provide in-app guided tours'
          ],
          impact_level: 'medium',
          category: 'engagement',
          metadata: { features: lowAdoptionFeatures }
        })
      }

      return insights
    } catch (error) {
      console.error('Failed to generate user insights:', error)
      return []
    }
  }

  // Get complete user profile
  static async getUserProfile(userId: string): Promise<UserProfileData> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get user profile:', error)
      return {} as UserProfileData
    }
  }

  // Update profile with latest data
  static async updateProfile(userId: string): Promise<UserProfileData> {
    try {
      const profileData = await this.analyzeUserProfile(userId)

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update user profile:', error)
      throw new Error('Unable to update user profile')
    }
  }

  // Helper methods for behavior analysis
  private static groupActivitiesBySessions(activities: any[]): any[][] {
    const sessions: any[][] = []
    let currentSession: any[] = []

    activities.forEach((activity, index) => {
      if (index === 0) {
        currentSession.push(activity)
      } else {
        const timeDiff = new Date(activity.created_at!).getTime() -
                        new Date(activities[index - 1].created_at!).getTime()

        if (timeDiff > 30 * 60 * 1000) { // 30 minutes session timeout
          sessions.push(currentSession)
          currentSession = [activity]
        } else {
          currentSession.push(activity)
        }
      }
    })

    if (currentSession.length > 0) {
      sessions.push(currentSession)
    }

    return sessions
  }

  private static calculateBounceRate(sessions: any[][]): number {
    const bouncedSessions = sessions.filter(session =>
      session.filter(a => a.activity_type === 'page_view').length <= 1
    ).length
    return bouncedSessions / sessions.length
  }

  private static calculateReturnVisitFrequency(activities: any[]): number {
    const uniqueDays = new Set(
      activities.map(a => new Date(a.created_at!).toDateString())
    ).size
    const totalDays = Math.ceil((Date.now() - new Date(activities[activities.length - 1]!.created_at!).getTime()) / (1000 * 60 * 60 * 24))
    return uniqueDays / Math.max(totalDays, 1)
  }

  private static extractPreferredContentTypes(pageViews: any[]): string[] {
    const paths = pageViews.map(pv => pv.activity_data?.page_path)
    const pathCounts: Record<string, number> = {}

    paths.forEach(path => {
      if (path) {
        const type = path.split('/')[1] || 'home'
        pathCounts[type] = (pathCounts[type] || 0) + 1
      }
    })

    return Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type)
  }

  private static extractNavigationPatterns(pageViews: any[]): string[] {
    const patterns: string[] = []

    for (let i = 1; i < pageViews.length; i++) {
      const from = pageViews[i - 1].activity_data?.page_path
      const to = pageViews[i].activity_data?.page_path

      if (from && to) {
        patterns.push(`${from} → ${to}`)
      }
    }

    const patternCounts: Record<string, number> = {}
    patterns.forEach(pattern => {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1
    })

    return Object.entries(patternCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pattern]) => pattern)
  }

  private static analyzeSearchPatterns(searchQueries: any[]): Record<string, any> {
    if (searchQueries.length === 0) return {}

    const queries = searchQueries.map(sq => sq.activity_data?.query).filter(Boolean)
    const avgQueryLength = queries.reduce((sum, query) => sum + query.length, 0) / queries.length
    const uniqueQueries = new Set(queries).size

    return {
      total_searches: searchQueries.length,
      unique_searches: uniqueQueries,
      avg_query_length: avgQueryLength,
      search_frequency: searchQueries.length / 30 // per day
    }
  }

  private static analyzeVideoPreferences(videoEnhancements: any[]): Record<string, any> {
    const preferences: Record<string, any> = {}

    const resolutions = videoEnhancements.map(ve => ve.activity_data?.target_resolution).filter(Boolean)
    const qualityLevels = videoEnhancements.map(ve => ve.activity_data?.quality_level).filter(Boolean)

    if (resolutions.length > 0) {
      preferences.preferred_resolutions = this.getTopFrequent(resolutions, 3)
    }

    if (qualityLevels.length > 0) {
      preferences.preferred_quality = this.getMostFrequent(qualityLevels)
    }

    return preferences
  }

  private static analyzeContentPreferences(pageViews: any[]): Record<string, any> {
    const preferences: Record<string, any> = {}

    const contentTypes = this.extractPreferredContentTypes(pageViews)
    preferences.preferred_sections = contentTypes

    return preferences
  }

  private static analyzeFeaturePreferences(featureUsage: any[]): Record<string, any> {
    const preferences: Record<string, any> = {}

    const features = featureUsage.map(fu => fu.activity_data?.feature_name).filter(Boolean)
    preferences.most_used_features = this.getTopFrequent(features, 5)

    return preferences
  }

  private static async analyzeCommunicationPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const { data: preferences } = await supabase
        .from('user_communication_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      return preferences || {}
    } catch (error) {
      return {}
    }
  }

  private static async analyzePriceSensitivity(userId: string): Promise<number> {
    try {
      const { data: billing } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!billing || billing.length === 0) return 0.7

      const avgAmount = billing.reduce((sum, b) => sum + (b.amount || 0), 0) / billing.length
      return Math.max(0, Math.min(1, 1 - (avgAmount / 100))) // Inverse relationship
    } catch (error) {
      return 0.5
    }
  }

  private static async assessSkillLevel(userId: string): Promise<string> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .in('activity_type', ['feature_usage', 'video_enhancement'])
        .limit(50)

      if (!activities || activities.length < 5) return 'beginner'

      const advancedFeatures = activities.filter(a =>
        a.activity_data?.feature_name?.includes('advanced') ||
        a.activity_data?.feature_name?.includes('pro') ||
        a.activity_data?.action?.includes('custom')
      ).length

      const successRate = activities.filter(a =>
        a.activity_data?.status === 'success'
      ).length / activities.length

      if (advancedFeatures > 10 && successRate > 0.8) return 'expert'
      if (advancedFeatures > 5 && successRate > 0.6) return 'intermediate'
      if (activities.length > 20) return 'intermediate'

      return 'beginner'
    } catch (error) {
      return 'beginner'
    }
  }

  private static async analyzeDevicePreferences(userId: string): Promise<Record<string, number>> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('user_agent')
        .eq('user_id', userId)
        .limit(100)

      if (!activities) return {}

      const deviceCounts: Record<string, number> = {}

      activities.forEach(activity => {
        const userAgent = activity.user_agent
        if (userAgent) {
          let device = 'desktop'
          if (/Mobile|Android|iPhone/.test(userAgent)) device = 'mobile'
          else if (/Tablet|iPad/.test(userAgent)) device = 'tablet'

          deviceCounts[device] = (deviceCounts[device] || 0) + 1
        }
      })

      const total = Object.values(deviceCounts).reduce((sum, count) => sum + count, 0)
      Object.keys(deviceCounts).forEach(device => {
        deviceCounts[device] = deviceCounts[device] / total
      })

      return deviceCounts
    } catch (error) {
      return {}
    }
  }

  private static async analyzeTimePreferences(userId: string): Promise<Record<string, number>> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('created_at')
        .eq('user_id', userId)
        .limit(200)

      if (!activities) return {}

      const hourCounts: Record<string, number> = {}
      const dayCounts: Record<string, number> = {}

      activities.forEach(activity => {
        const date = new Date(activity.created_at!)
        const hour = date.getHours()
        const day = date.getDay()

        hourCounts[hour] = (hourCounts[hour] || 0) + 1
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })

      return {
        peak_hours: hourCounts,
        peak_days: dayCounts
      }
    } catch (error) {
      return {}
    }
  }

  private static async analyzeFeatureAdoption(userId: string): Promise<Record<string, number>> {
    try {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'feature_usage')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

      if (!activities) return {}

      const featureCounts: Record<string, number> = {}
      const allFeatures = ['enhance_video', 'trim_video', 'add_subtitles', 'color_correction', 'noise_reduction', 'upscaling', 'motion_stabilization', 'audio_enhancement']

      // Initialize all features with 0
      allFeatures.forEach(feature => {
        featureCounts[feature] = 0
      })

      activities.forEach(activity => {
        const feature = activity.activity_data?.feature_name
        if (feature && allFeatures.includes(feature)) {
          featureCounts[feature] = (featureCounts[feature] || 0) + 1
        }
      })

      // Normalize to adoption rate (0-1)
      const maxCount = Math.max(...Object.values(featureCounts))
      Object.keys(featureCounts).forEach(feature => {
        featureCounts[feature] = featureCounts[feature] / Math.max(maxCount, 1)
      })

      return featureCounts
    } catch (error) {
      return {}
    }
  }

  private static async getAcquisitionChannel(userId: string): Promise<string> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('created_at, referral_code, utm_source, utm_medium, utm_campaign')
        .eq('id', userId)
        .single()

      if (user?.referral_code) return 'referral'
      if (user?.utm_source) return user.utm_source

      return 'organic'
    } catch (error) {
      return 'organic'
    }
  }

  private static getTopFrequent(items: string[], limit: number): string[] {
    const counts: Record<string, number> = {}
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item)
  }

  private static getMostFrequent(items: string[]): string {
    const counts: Record<string, number> = {}
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || ''
  }
}

// Hook for user profiling
export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [insights, setInsights] = useState<UserInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const updatedProfile = await UserProfilingService.createOrUpdateProfile(userId)
      setProfile(updatedProfile)

      const userInsights = await UserProfilingService.generateUserInsights(userId)
      setInsights(userInsights)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const getProfile = async () => {
    if (!userId) return

    try {
      const userProfile = await UserProfilingService.getUserProfile(userId)
      setProfile(userProfile)

      const userInsights = await UserProfilingService.generateUserInsights(userId)
      setInsights(userInsights)
    } catch (err: any) {
      setError(err.message || 'Failed to get profile')
    }
  }

  useEffect(() => {
    if (userId) {
      getProfile()
    }
  }, [userId])

  return {
    profile,
    insights,
    loading,
    error,
    updateProfile,
    getProfile
  }
}