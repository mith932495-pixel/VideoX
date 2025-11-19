import { supabase } from './supabase'

interface TemporaryEmailData {
  id: string
  user_id: string
  temp_email: string
  password: string
  expires_at: Date
  created_at: Date
}

export class TemporaryEmailService {
  // Generate random temporary email
  static generateTempEmail(): string {
    const prefixes = ['user', 'video', 'enhance', 'creator', 'pro', 'cinema', 'studio', 'film', 'movie', 'pixel']
    const domains = ['maildrop.cc', 'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'yopmail.com']

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = Math.random().toString(36).substring(2, 8)
    const domain = domains[Math.floor(Math.random() * domains.length)]

    return `${prefix}${suffix}@${domain}`
  }

  // Generate secure random password
  static generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  // Create temporary email account
  static async createTemporaryEmail(userId: string): Promise<TemporaryEmailData> {
    try {
      const tempEmail = this.generateTempEmail()
      const password = this.generateSecurePassword()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Store in database
      const { data, error } = await supabase
        .from('temporary_email_accounts')
        .insert({
          user_id: userId,
          temp_email: tempEmail,
          password: password,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create temporary email:', error)
      throw new Error('Unable to create temporary email account')
    }
  }

  // Send verification email to temporary email
  static async sendVerificationEmail(tempEmail: string, verificationToken: string): Promise<void> {
    try {
      // For demo purposes, we'll just log the token
      // In production, you'd use a service like EmailJS, SendGrid, or a temporary email service API
      console.log(`Verification token for ${tempEmail}: ${verificationToken}`)

      // Simulate sending email
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: tempEmail,
          subject: 'Verify your VideoX account',
          token: verificationToken
        })
      })

      if (!response.ok) {
        // For demo, we'll continue even if email fails
        console.log('Email service not available, but account created successfully')
      }
    } catch (error) {
      console.error('Failed to send verification email:', error)
      // Don't throw error - user can still proceed
    }
  }

  // Check if temporary email is valid and not expired
  static async validateTempEmail(tempEmail: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('temporary_email_accounts')
        .select('*')
        .eq('temp_email', tempEmail)
        .eq('is_active', true)
        .single()

      if (error || !data) return false

      const now = new Date()
      const expiresAt = new Date(data.expires_at)

      return now < expiresAt
    } catch (error) {
      console.error('Failed to validate temporary email:', error)
      return false
    }
  }

  // Get temporary email by user ID
  static async getTempEmailByUserId(userId: string): Promise<TemporaryEmailData | null> {
    try {
      const { data, error } = await supabase
        .from('temporary_email_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error || !data) return null

      // Check if expired
      const now = new Date()
      const expiresAt = new Date(data.expires_at)

      if (now > expiresAt) {
        // Mark as inactive
        await supabase
          .from('temporary_email_accounts')
          .update({ is_active: false })
          .eq('user_id', userId)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to get temporary email:', error)
      return null
    }
  }

  // Delete temporary email
  static async deleteTempEmail(userId: string): Promise<void> {
    try {
      await supabase
        .from('temporary_email_accounts')
        .update({ is_active: false })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Failed to delete temporary email:', error)
      throw new Error('Unable to delete temporary email account')
    }
  }

  // Cleanup expired temporary emails
  static async cleanupExpiredEmails(): Promise<void> {
    try {
      const now = new Date().toISOString()
      await supabase
        .from('temporary_email_accounts')
        .update({ is_active: false })
        .lt('expires_at', now)
        .eq('is_active', true)
    } catch (error) {
      console.error('Failed to cleanup expired emails:', error)
    }
  }

  // Create email verification token
  static async createEmailVerification(userId: string, email: string): Promise<string> {
    try {
      const token = this.generateSecureToken()

      const { error } = await supabase
        .from('email_verifications')
        .insert({
          user_id: userId,
          email: email,
          token: token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })

      if (error) throw error
      return token
    } catch (error) {
      console.error('Failed to create email verification:', error)
      throw new Error('Unable to create email verification token')
    }
  }

  // Verify email token
  static async verifyEmailToken(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', token)
        .single()

      if (error || !data) return false

      // Check if expired
      const now = new Date()
      const expiresAt = new Date(data.expires_at)

      if (now > expiresAt) return false

      // Mark as verified
      await supabase
        .from('email_verifications')
        .update({ verified_at: now.toISOString() })
        .eq('token', token)

      // Update user verification status
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', data.user_id)

      return true
    } catch (error) {
      console.error('Failed to verify email token:', error)
      return false
    }
  }

  // Generate secure token
  static generateSecureToken(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < length; i++) {
      token += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return token
  }

  // Check if email is from temporary email provider
  static isTemporaryEmail(email: string): boolean {
    const tempEmailDomains = [
      'maildrop.cc',
      'tempmail.org',
      '10minutemail.com',
      'guerrillamail.com',
      'yopmail.com',
      'temp-mail.org',
      'throwaway.email',
      'mailinator.com',
      '10minutemail.net',
      'tempmail.plus',
      'mailinator.net',
      'guerrillamail.net',
      'fakemailgenerator.net',
      'tempmail.dev',
      'mailpoof.com'
    ]

    const domain = email.split('@')[1]
    return tempEmailDomains.includes(domain)
  }
}

// Hook for temporary email functionality
export function useTemporaryEmail() {
  const createTempEmail = async (userId: string) => {
    try {
      const tempEmail = await TemporaryEmailService.createTemporaryEmail(userId)
      return tempEmail
    } catch (error) {
      console.error('Failed to create temporary email:', error)
      throw error
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      const verified = await TemporaryEmailService.verifyEmailToken(token)
      return verified
    } catch (error) {
      console.error('Failed to verify email:', error)
      return false
    }
  }

  const validateTempEmail = async (email: string) => {
    return TemporaryEmailService.validateTempEmail(email)
  }

  const isTempEmail = (email: string) => {
    return TemporaryEmailService.isTemporaryEmail(email)
  }

  return {
    createTempEmail,
    verifyEmail,
    validateTempEmail,
    isTempEmail
  }
}