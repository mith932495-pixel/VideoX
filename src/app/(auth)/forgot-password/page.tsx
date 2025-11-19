'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useTemporaryEmail } from '@/lib/temporaryEmail'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { isTempEmail } = useTemporaryEmail()

  const [formData, setFormData] = useState({
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showTempEmail, setShowTempEmail] = useState(false)
  const [tempEmailData, setTempEmailData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email)
        .single()

      if (userError || !user) {
        // For security, always show success message even if user doesn't exist
        setIsSuccess(true)
        return
      }

      // Check if user has temporary email account
      const { TemporaryEmailService } = await import('@/lib/temporaryEmail')
      const tempEmailAccount = await TemporaryEmailService.getTempEmailByUserId(user.id)

      if (tempEmailAccount) {
        setTempEmailData(tempEmailAccount)
        setShowTempEmail(true)
      } else {
        await resetPassword(formData.email)
        setIsSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTempEmailLogin = async () => {
    if (!tempEmailData) return

    try {
      // In a real app, you would navigate to a temporary email reader interface
      // For now, we'll just show the credentials
      alert(`Email: ${tempEmailData.temp_email}\nPassword: ${tempEmailData.password}\n\nPlease check this temporary email to access your account and reset your password.`)
    } catch (error) {
      console.error('Failed to login with temporary email:', error)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="particles-container">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${Math.random() * 15 + 10}s`
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-cinematic p-8 max-w-md w-full mx-auto text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold mb-4">Reset Email Sent</h2>

          <p className="text-text-secondary mb-6">
            {showTempEmail
              ? `Temporary email credentials have been retrieved for ${formData.email}.`
              : `We've sent a password reset link to ${formData.email}.`}
          </p>

          <p className="text-text-secondary mb-8">
            {showTempEmail
              ? 'Check your temporary email account below or use the credentials to login.'
              : 'Please check your email and click the link to reset your password.'}
          </p>

          {showTempEmail && tempEmailData && (
            <div className="mb-6 p-4 glass rounded-lg text-left">
              <div className="text-sm font-medium text-accent-orange mb-2">Temporary Email Credentials:</div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-text-muted">Email:</span>
                  <div className="font-mono text-sm break-all">{tempEmailData.temp_email}</div>
                </div>
                <div>
                  <span className="text-xs text-text-muted">Password:</span>
                  <div className="font-mono text-sm">{tempEmailData.password}</div>
                </div>
                <div className="text-xs text-text-muted mt-2">
                  Expires: {new Date(tempEmailData.expires_at).toLocaleDateString()} at {new Date(tempEmailData.expires_at).toLocaleTimeString()}
                </div>
              </div>

              <button
                onClick={handleTempEmailLogin}
                className="w-full glass py-2 rounded-lg font-medium hover:bg-secondary transition-colors mt-4"
              >
                Access Temp Email
              </button>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-cinematic py-3 rounded-full text-white font-medium"
            >
              Send Another Email
            </button>

            <Link href="/login" className="block w-full glass py-3 rounded-full font-medium hover:bg-secondary transition-colors text-center">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="particles-container">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 15 + 10}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent">
              VideoX
            </h1>
          </Link>
          <p className="text-text-secondary mt-2">Reset your password</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-cinematic p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-cinematic w-full pl-10 pr-4 py-3"
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Check if it's a temporary email */}
            {isTempEmail(formData.email) && (
              <div className="p-3 glass rounded-lg">
                <p className="text-sm text-accent-orange">
                  This appears to be a temporary email. We'll check if you have an account with us.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !formData.email}
              className="w-full btn-cinematic py-3 rounded-full text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </div>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/login" className="inline-flex items-center text-accent-orange hover:text-accent-gold transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>

          <div className="text-center mt-8 text-sm text-text-muted">
            <Link href="/signup" className="text-accent-orange hover:text-accent-gold transition-colors">
              Don't have an account? Sign up
            </Link>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-8 text-sm text-text-muted">
            <Link href="/privacy" className="hover:text-text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="mx-2">•</span>
            <Link href="/terms" className="hover:text-text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}