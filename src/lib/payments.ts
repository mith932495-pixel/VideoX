import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'
import { CreditsManager, CreditPackage } from './credits'
import type { PaymentIntent } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export interface PaymentRequest {
  packageId: string
  userId: string
  userEmail: string
}

export interface PaymentResult {
  success: boolean
  clientSecret?: string
  error?: string
}

export class PaymentManager {
  private static stripe = null as any

  /**
   * Initialize Stripe
   */
  static async initialize() {
    if (!this.stripe) {
      this.stripe = await stripePromise
    }
    return this.stripe
  }

  /**
   * Create payment intent for credit purchase
   */
  static async createPaymentIntent(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const { packageId, userId, userEmail } = request

      // Get package details
      const pkg = this.getCreditPackage(packageId)
      if (!pkg) {
        throw new Error('Invalid credit package')
      }

      // Calculate total amount (in cents)
      const totalCredits = pkg.credits + (pkg.bonus || 0)
      const amount = Math.round(pkg.price * 100) // Convert to cents

      // Create payment intent via your API
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId,
          userEmail,
          amount,
          credits: totalCredits,
          currency: 'usd'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Record pending purchase
      await this.recordPendingPurchase(userId, packageId, amount, totalCredits)

      return {
        success: true,
        clientSecret
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      }
    }
  }

  /**
   * Confirm payment using Stripe Elements
   */
  static async confirmPayment(
    clientSecret: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; paymentIntent?: PaymentIntent; error?: string }> {
    try {
      const stripe = await this.initialize()
      if (!stripe) throw new Error('Stripe not initialized')

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
      })

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        paymentIntent: paymentIntent as PaymentIntent
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      }
    }
  }

  /**
   * Process payment completion (called by webhook)
   */
  static async processPaymentCompletion(
    paymentIntentId: string,
    status: 'succeeded' | 'failed' | 'canceled'
  ): Promise<void> {
    try {
      // Find the pending purchase
      const { data: purchase, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('status', 'pending')
        .single()

      if (error || !purchase) {
        console.error('Purchase not found for payment intent:', paymentIntentId)
        return
      }

      // Update purchase status
      const updateData: any = {
        status: status === 'succeeded' ? 'completed' : 'failed',
        updated_at: new Date().toISOString()
      }

      if (status === 'succeeded') {
        // Add credits to user account
        await CreditsManager.addCredits(
          purchase.user_id,
          purchase.credits_added,
          'purchase',
          purchase.id
        )
      }

      await supabase
        .from('credit_purchases')
        .update(updateData)
        .eq('id', purchase.id)

    } catch (error) {
      console.error('Failed to process payment completion:', error)
      throw error
    }
  }

  /**
   * Record pending purchase
   */
  private static async recordPendingPurchase(
    userId: string,
    packageId: string,
    amount: number,
    credits: number
  ): Promise<void> {
    try {
      await supabase.from('credit_purchases').insert({
        user_id: userId,
        amount: amount / 100, // Convert back to dollars
        credits_added: credits,
        package_id: packageId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to record pending purchase:', error)
      throw error
    }
  }

  /**
   * Get credit package details
   */
  private static getCreditPackage(packageId: string): CreditPackage | undefined {
    const packages: Record<string, CreditPackage> = {
      starter: {
        id: 'starter',
        name: 'Starter Pack',
        credits: 10,
        price: 9,
        popular: true
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        credits: 50,
        price: 39,
        bonus: 5
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        credits: 100,
        price: 69,
        bonus: 15
      }
    }

    return packages[packageId]
  }

  /**
   * Create checkout session for Stripe Checkout
   */
  static async createCheckoutSession(request: PaymentRequest): Promise<{
    success: boolean
    sessionId?: string
    error?: string
  }> {
    try {
      const { packageId, userId, userEmail } = request

      const pkg = this.getCreditPackage(packageId)
      if (!pkg) {
        throw new Error('Invalid credit package')
      }

      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId,
          userEmail,
          priceId: this.getStripePriceId(packageId),
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Record pending purchase
      await this.recordPendingPurchase(userId, packageId, pkg.price * 100, pkg.credits + (pkg.bonus || 0))

      return {
        success: true,
        sessionId
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout initialization failed'
      }
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  static async redirectToCheckout(sessionId: string): Promise<void> {
    try {
      const stripe = await this.initialize()
      if (!stripe) throw new Error('Stripe not initialized')

      const { error } = await stripe.redirectToCheckout({
        sessionId
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Failed to redirect to checkout:', error)
      throw error
    }
  }

  /**
   * Get Stripe price ID for package
   */
  private static getStripePriceId(packageId: string): string {
    const priceIds: Record<string, string> = {
      starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!,
      professional: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL!,
      enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!
    }

    return priceIds[packageId] || priceIds.starter
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(userId: string): Promise<Array<{
    id: string
    amount: number
    credits_added: number
    status: string
    created_at: string
    package_id: string
  }>> {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get payment history:', error)
      throw new Error('Unable to fetch payment history')
    }
  }

  /**
   * Setup payment method for future use
   */
  static async setupPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; customer?: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/setup-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          paymentMethodId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to setup payment method')
      }

      const { customer } = await response.json()

      return {
        success: true,
        customer
      }
    } catch (error) {
      console.error('Failed to setup payment method:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment method setup failed'
      }
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    purchaseId: string,
    reason: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId,
          reason
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process refund')
      }

      const { refundId } = await response.json()

      return {
        success: true,
        refundId
      }
    } catch (error) {
      console.error('Failed to process refund:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed'
      }
    }
  }
}

// Utility functions
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function getPackageDisplayInfo(packageId: string): {
  name: string
  credits: number
  price: number
  savings?: number
  popular?: boolean
} | null {
  const packages = [
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

  const pkg = packages.find(p => p.id === packageId)
  if (!pkg) return null

  const totalCredits = pkg.credits + (pkg.bonus || 0)
  const standardPrice = totalCredits * 0.10
  const savings = pkg.bonus ? pkg.bonus * 0.10 : 0

  return {
    name: pkg.name,
    credits: totalCredits,
    price: pkg.price,
    savings: savings > 0 ? savings : undefined,
    popular: pkg.popular
  }
}