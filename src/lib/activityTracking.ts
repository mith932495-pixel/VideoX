import { supabase } from './supabase'

interface ActivityEvent {
  user_id?: string
  activity_type: string
  activity_data?: any
  session_id?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  created_at?: string
}

interface PageViewEvent extends ActivityEvent {
  page_path: string
  view_duration?: number
  is_bounce?: boolean
}

interface FeatureUsageEvent extends ActivityEvent {
  feature_name: string
  action: string
}

interface ConversionEvent extends ActivityEvent {
  event_type: string
  event_value?: number
  event_data?: any
  source?: string
  campaign?: string
}

export class ActivityTrackingService {
  private static userId: string | undefined
  private static sessionId: string | undefined

  // Initialize tracking for user session
  static initialize(userId?: string, sessionId?: string) {
    this.userId = userId
    this.sessionId = sessionId
  }

  // Track user activity
  static async trackActivity(event: Omit<ActivityEvent, 'user_id' | 'created_at'>) {
    try {
      const activityData: ActivityEvent = {
        user_id: this.userId,
        created_at: new Date().toISOString(),
        ...event
      }

      await supabase
        .from('user_activities')
        .insert(activityData)
    } catch (error) {
      console.error('Failed to track activity:', error)
    }
  }

  // Track page view
  static async trackPageView(pagePath: string, viewDuration?: number, isBounce?: boolean) {
    try {
      await this.trackActivity({
        activity_type: 'page_view',
        activity_data: {
          page_path: pagePath,
          view_duration: viewDuration,
          is_bounce: isBounce
        }
      })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  // Track feature usage
  static async trackFeatureUsage(featureName: string, action: string, data?: any) {
    try {
      await this.trackActivity({
        activity_type: 'feature_usage',
        activity_data: {
          feature_name: featureName,
          action: action,
          ...data
        }
      })
    } catch (error) {
      console.error('Failed to track feature usage:', error)
    }
  }

  // Track conversion events
  static async trackConversion(eventType: string, eventValue?: number, eventData?: any, source?: string, campaign?: string) {
    try {
      await this.trackActivity({
        activity_type: 'conversion',
        activity_data: {
          event_type: eventType,
          event_value: eventValue,
          event_data: eventData,
          source: source,
          campaign: campaign
        }
      })
    } catch (error) {
      console.error('Failed to track conversion:', error)
    }
  }

  // Track video enhancement events
  static async trackVideoEnhancement(videoId: string, action: string, metadata?: any) {
    try {
      await this.trackActivity({
        activity_type: 'video_enhancement',
        activity_data: {
          video_id: videoId,
          action: action,
          ...metadata
        }
      })
    } catch (error) {
      console.error('Failed to track video enhancement:', error)
    }
  }

  // Track authentication events
  static async trackAuthEvent(eventType: 'login' | 'logout' | 'signup' | 'email_verification', metadata?: any) {
    try {
      await this.trackActivity({
        activity_type: 'authentication',
        activity_data: {
          event_type: eventType,
          ...metadata
        }
      })
    } catch (error) {
      console.error('Failed to track auth event:', error)
    }
  }

  // Track billing events
  static async trackBillingEvent(eventType: 'payment' | 'purchase' | 'refund', amount: number, metadata?: any) {
    try {
      await this.trackActivity({
        activity_type: 'billing',
        activity_data: {
          event_type: eventType,
          amount: amount,
          ...metadata
        }
      })
    } catch (error) {
      console.error('Failed to track billing event:', error)
    }
  }

  // Track search queries
  static async trackSearchQuery(query: string, resultsCount?: number, clickedResultId?: string) {
    try {
      await this.trackActivity({
        activity_type: 'search',
        activity_data: {
          query: query,
          results_count: resultsCount,
          clicked_result_id: clickedResultId
        }
      })
    } catch (error) {
      console.error('Failed to track search query:', error)
    }
  }

  // Track form interactions
  static async trackFormInteraction(formName: string, action: string, fieldName?: string) {
    try {
      await this.trackActivity({
        activity_type: 'form_interaction',
        activity_data: {
          form_name: formName,
          action: action,
          field_name: fieldName
        }
      })
    } catch (error) {
      console.error('Failed to track form interaction:', error)
    }
  }

  // Track API usage
  static async trackApiUsage(endpoint: string, method: string, statusCode: number, responseTime?: number) {
    try {
      await this.trackActivity({
        activity_type: 'api_usage',
        activity_data: {
          endpoint: endpoint,
          method: method,
          status_code: statusCode,
          response_time_ms: responseTime
        }
      })
    } catch (error) {
      console.error('Failed to track API usage:', error)
    }
  }

  // Get user activity summary
  static async getUserActivitySummary(userId: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get user activity summary:', error)
      return []
    }
  }

  // Get activity statistics
  static async getActivityStats(userId?: string, days: number = 7) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('user_activities')
        .gte('created_at', startDate.toISOString())

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      // Process statistics
      const stats = {
        total_activities: data.length,
        unique_users: new Set(data.map(d => d.user_id)).size,
        activity_types: data.reduce((acc: any, activity) => {
          const type = activity.activity_type
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}),
        daily_breakdown: data.reduce((acc: any, activity) => {
          const date = new Date(activity.created_at!).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {})
      }

      return stats
    } catch (error) {
      console.error('Failed to get activity statistics:', error)
      return {
        total_activities: 0,
        unique_users: 0,
        activity_types: {},
        daily_breakdown: {}
      }
    }
  }

  // Track heatmap data
  static async trackHeatmapData(pagePath: string, x: number, y: number, viewportWidth?: number, viewportHeight?: number) {
    try {
      await this.trackActivity({
        activity_type: 'heatmap',
        activity_data: {
          page_path: pagePath,
          x_coordinate: x,
          y_coordinate: y,
          viewport_width: viewportWidth,
          viewport_height: viewportHeight
        }
      })
    } catch (error) {
      console.error('Failed to track heatmap data:', error)
    }
  }

  // Track retention data
  static async trackRetention(userId: string, cohortDate: Date, dayNumber: number, isActive: boolean) {
    try {
      // This would typically be called by a background job
      const retentionData = {
        day_0_active: true,
        day_1_active: dayNumber >= 1 ? isActive : undefined,
        day_7_active: dayNumber >= 7 ? isActive : undefined,
        day_30_active: dayNumber >= 30 ? isActive : undefined,
        day_90_active: dayNumber >= 90 ? isActive : undefined
      }

      // Check if retention record exists
      const { data: existing } = await supabase
        .from('retention_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('cohort_date', cohortDate.toISOString().split('T')[0])
        .single()

      if (existing) {
        // Update existing record
        await supabase
          .from('retention_tracking')
          .update({
            day_0_active: retentionData.day_0_active,
            day_1_active: retentionData.day_1_active,
            day_7_active: retentionData.day_7_active,
            day_30_active: retentionData.day_30_active,
            day_90_active: retentionData.day_90_active,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('cohort_date', cohortDate.toISOString().split('T')[0])
      } else {
        // Create new retention record
        await supabase
          .from('retention_tracking')
          .insert({
            user_id: userId,
            cohort_date: cohortDate.toISOString().split('T')[0],
            ...retentionData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Failed to track retention:', error)
    }
  }

  // Get session analytics
  static async getSessionAnalytics(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const analytics = {
        total_activities: data.length,
        first_activity: data[data.length - 1]?.created_at,
        last_activity: data[0]?.created_at,
        session_duration: data.length > 0 ?
          new Date(data[0]!.created_at).getTime() - new Date(data[data.length - 1]!.created_at).getTime() : 0,
        pages_visited: new Set(data.map(d => d.activity_data?.page_path)).size,
        features_used: new Set(data.filter(d => d.activity_type === 'feature_usage').map(d => d.activity_data?.feature_name)).size,
        bounce_rate: data.filter(d => d.activity_type === 'page_view' && d.activity_data?.is_bounce).length / data.filter(d => d.activity_type === 'page_view').length || 0
      }

      return analytics
    } catch (error) {
      console.error('Failed to get session analytics:', error)
      return null
    }
  }

  // Clean up old activity data
  static async cleanupOldActivityData(daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      await supabase
        .from('user_activities')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
    } catch (error) {
      console.error('Failed to cleanup old activity data:', error)
    }
  }
}

// Hook for activity tracking
export function useActivityTracking() {
  const trackPageView = (pagePath: string) => {
    // Get page view duration
    const startTime = Date.now()

    return {
      endPageView: () => {
        const viewDuration = Date.now() - startTime
        ActivityTrackingService.trackPageView(pagePath, viewDuration)
      },
      markAsBounce: () => {
        ActivityTrackingService.trackPageView(pagePath, undefined, true)
      }
    }
  }

  const trackEvent = (eventType: string, data?: any) => {
    ActivityTrackingService.trackActivity({
      activity_type: eventType,
      activity_data: data
    })
  }

  const trackFeature = (featureName: string, action: string, data?: any) => {
    ActivityTrackingService.trackFeatureUsage(featureName, action, data)
  }

  const trackConversion = (eventType: string, value?: number, data?: any) => {
    ActivityTrackingService.trackConversion(eventType, value, data)
  }

  return {
    trackPageView,
    trackEvent,
    trackFeature,
    trackConversion
  }
}

// Hook for real-time activity tracking
export function useRealtimeActivity(userId: string, callback: (activities: any[]) => void) {
  useEffect(() => {
    const channel = supabase
      .channel('user_activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public' }, (payload) => {
        if (payload.new?.user_id === userId) {
          callback([payload.new])
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [userId, callback])
}

// Hook for A/B testing tracking
export function useABTesting() {
  const trackABTest = (testName: string, variant: string, converted: boolean = false) => {
    ActivityTrackingService.trackActivity({
      activity_type: 'ab_test',
      activity_data: {
        test_name: testName,
        variant: variant,
        converted: converted
      }
    })
  }

  const trackPageConversion = (pagePath: string, conversionType: string) => {
    ActivityTrackingService.trackConversion('page_conversion', undefined, {
      page_path: pagePath,
      conversion_type: conversionType
    })
  }

  return {
    trackABTest,
    trackPageConversion
  }
}