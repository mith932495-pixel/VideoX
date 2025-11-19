import { supabase, CreditPurchase, User } from './supabase'

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number // in USD
  popular?: boolean
  bonus?: number
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 9,
    popular: true
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 50,
    price: 39,
    bonus: 5
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 100,
    price: 69,
    bonus: 15
  }
]

export interface EnhancementCost {
  resolution: '1080p' | '4K' | '8K'
  credits: number
  estimatedCost: number
}

export const ENHANCEMENT_COSTS: Record<string, Omit<EnhancementCost, 'resolution'>> = {
  '1080p': {
    credits: 1,
    estimatedCost: 0.10
  },
  '4K': {
    credits: 3,
    estimatedCost: 0.30
  },
  '8K': {
    credits: 5,
    estimatedCost: 0.50
  }
}

export class CreditsManager {
  /**
   * Get user's current credit balance
   */
  static async getUserCredits(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data?.credits || 0
    } catch (error) {
      console.error('Failed to get user credits:', error)
      throw new Error('Unable to fetch credit balance')
    }
  }

  /**
   * Add credits to user account
   */
  static async addCredits(
    userId: string,
    credits: number,
    source: 'purchase' | 'bonus' | 'refund' = 'purchase',
    referenceId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('add_user_credits', {
        user_uuid: userId,
        credits_to_add: credits,
        source: source,
        reference_id: referenceId
      })

      if (error) throw error
    } catch (error) {
      console.error('Failed to add credits:', error)
      throw new Error('Unable to add credits to account')
    }
  }

  /**
   * Deduct credits for enhancement
   */
  static async deductCredits(
    userId: string,
    credits: number,
    videoId: string,
    resolution: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('deduct_user_credits', {
        user_uuid: userId,
        credits_to_deduct: credits
      })

      if (error) throw error

      const success = data === true

      if (success) {
        // Record credit usage
        await this.recordCreditUsage(userId, credits, videoId, resolution)
      }

      return success
    } catch (error) {
      console.error('Failed to deduct credits:', error)
      throw new Error('Unable to deduct credits')
    }
  }

  /**
   * Record credit usage for analytics
   */
  private static async recordCreditUsage(
    userId: string,
    credits: number,
    videoId: string,
    resolution: string
  ): Promise<void> {
    try {
      await supabase.from('credit_usage').insert({
        user_id: userId,
        credits_used: credits,
        video_id: videoId,
        resolution: resolution,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      // Log error but don't throw as this is not critical
      console.error('Failed to record credit usage:', error)
    }
  }

  /**
   * Check if user has sufficient credits
   */
  static async hasSufficientCredits(userId: string, requiredCredits: number): Promise<boolean> {
    try {
      const currentCredits = await this.getUserCredits(userId)
      return currentCredits >= requiredCredits
    } catch (error) {
      console.error('Failed to check credits:', error)
      return false
    }
  }

  /**
   * Get credit usage history
   */
  static async getCreditUsageHistory(
    userId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string
    credits_used: number
    video_id: string
    resolution: string
    created_at: string
  }>> {
    try {
      const { data, error } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get credit usage history:', error)
      throw new Error('Unable to fetch credit usage history')
    }
  }

  /**
   * Get credit purchase history
   */
  static async getCreditPurchaseHistory(
    userId: string,
    limit: number = 50
  ): Promise<CreditPurchase[]> {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get credit purchase history:', error)
      throw new Error('Unable to fetch credit purchase history')
    }
  }

  /**
   * Get cost for enhancement
   */
  static getEnhancementCost(resolution: '1080p' | '4K' | '8K'): EnhancementCost {
    const cost = ENHANCEMENT_COSTS[resolution]
    return {
      resolution,
      ...cost
    }
  }

  /**
   * Calculate total credits needed for multiple enhancements
   */
  static calculateBulkCost(
    enhancements: Array<{ resolution: '1080p' | '4K' | '8K' }>
  ): { totalCredits: number; estimatedCost: number; breakdown: EnhancementCost[] } {
    const breakdown = enhancements.map(enhancement =>
      this.getEnhancementCost(enhancement.resolution)
    )

    const totalCredits = breakdown.reduce((sum, cost) => sum + cost.credits, 0)
    const estimatedCost = breakdown.reduce((sum, cost) => sum + cost.estimatedCost, 0)

    return {
      totalCredits,
      estimatedCost,
      breakdown
    }
  }

  /**
   * Get user credit statistics
   */
  static async getUserCreditStats(userId: string): Promise<{
    currentBalance: number
    totalEarned: number
    totalSpent: number
    totalVideosEnhanced: number
    favoriteResolution: string
  }> {
    try {
      // Get current balance
      const { data: userData } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single()

      const currentBalance = userData?.credits || 0

      // Get total credits purchased
      const { data: purchases } = await supabase
        .from('credit_purchases')
        .select('credits_added')
        .eq('user_id', userId)
        .eq('status', 'completed')

      const totalEarned = purchases?.reduce((sum, p) => sum + p.credits_added, 0) || 0

      // Get total credits spent
      const { data: usage } = await supabase
        .from('credit_usage')
        .select('credits_used, resolution')
        .eq('user_id', userId)

      const totalSpent = usage?.reduce((sum, u) => sum + u.credits_used, 0) || 0
      const totalVideosEnhanced = usage?.length || 0

      // Find favorite resolution
      const resolutionCounts = usage?.reduce((acc, u) => {
        acc[u.resolution] = (acc[u.resolution] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const favoriteResolution = Object.entries(resolutionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'

      return {
        currentBalance,
        totalEarned,
        totalSpent,
        totalVideosEnhanced,
        favoriteResolution
      }
    } catch (error) {
      console.error('Failed to get user credit stats:', error)
      throw new Error('Unable to fetch credit statistics')
    }
  }

  /**
   * Apply bonus credits for promotions
   */
  static async applyBonusCredits(
    userId: string,
    bonusType: 'signup' | 'referral' | 'promotion',
    bonusAmount?: number
  ): Promise<void> {
    const bonuses = {
      signup: 3,
      referral: 5,
      promotion: bonusAmount || 10
    }

    const credits = bonuses[bonusType]
    if (credits > 0) {
      await this.addCredits(userId, credits, 'bonus')
    }
  }

  /**
   * Refund credits for failed enhancement
   */
  static async refundCredits(
    userId: string,
    credits: number,
    videoId: string,
    reason: string
  ): Promise<void> {
    try {
      await this.addCredits(userId, credits, 'refund', videoId)

      // Record refund
      await supabase.from('credit_refunds').insert({
        user_id: userId,
        credits_refunded: credits,
        video_id: videoId,
        reason: reason,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to refund credits:', error)
      throw new Error('Unable to refund credits')
    }
  }

  /**
   * Check for credit expiration (if applicable)
   */
  static async checkExpiration(userId: string): Promise<{
    expiredCredits: number
    expiringSoonCredits: number
    nextExpirationDate?: string
  }> {
    try {
      // This would be implemented based on your credit expiration policy
      // For now, return no expiration
      return {
        expiredCredits: 0,
        expiringSoonCredits: 0
      }
    } catch (error) {
      console.error('Failed to check credit expiration:', error)
      return {
        expiredCredits: 0,
        expiringSoonCredits: 0
      }
    }
  }
}

// Utility functions
export function formatCredits(credits: number): string {
  return credits.toLocaleString()
}

export function getCreditPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
}

export function calculateSavings(packageId: string): number {
  const pkg = getCreditPackageById(packageId)
  if (!pkg) return 0

  const standardPrice = pkg.credits * 0.10 // $0.10 per credit standard price
  const savings = standardPrice - pkg.price
  return Math.max(0, savings)
}