'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, Clock, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTemporaryEmail } from '@/lib/temporaryEmail'
import { supabase } from '@/lib/supabase'

function EmailVerificationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isTempEmail } = useTemporaryEmail()

  const [token, setToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'expired'>('idle')
  const [tempEmailData, setTempEmailData] = useState<any>(null)
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')

    if (tokenParam) {
      setToken(tokenParam)
      verifyToken(tokenParam)
    } else if (emailParam) {
      setEmail(emailParam)
    }

    // Cleanup expired emails on component mount
    cleanupExpiredEmails()
  }, [searchParams])

  const cleanupExpiredEmails = async () => {
    try {
      const { TemporaryEmailService } = await import('@/lib/temporaryEmail')
      TemporaryEmailService.cleanupExpiredEmails()
    } catch (error) {
      console.error('Failed to cleanup expired emails:', error)
    }
  }

  const verifyToken = async (verificationToken: string) => {
    setVerifying(true)
    setVerificationStatus('idle')

    try {
      const { TemporaryEmailService } = await import('@/lib/temporaryEmail')
      const verified = await TemporaryEmailService.verifyEmailToken(verificationToken)

      if (verified) {
        setVerificationStatus('success')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setVerificationStatus('expired')
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setVerificationStatus('error')
    } finally {
      setVerifying(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) return

    setLoading(true)
    try {
      // Get user ID from email
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (!user) {
        throw new Error('User not found')
      }

      const { TemporaryEmailService } = await import('@/lib/temporaryEmail')
      const token = await TemporaryEmailService.createEmailVerification(user.id, email)

      await TemporaryEmailService.sendVerificationEmail(email, token)
      setVerificationStatus('idle')
    } catch (error) {
      console.error('Failed to resend verification:', error)
      setVerificationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const checkTempEmail = async () => {
    if (!email) return

    setLoading(true)
    try {
      // Check if email exists in database
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (!user) {
        alert('Email not found. Please check your email address.')
        setLoading(false)
        return
      }

      // Check if user has temporary email account
      const { TemporaryEmailService } = await import('@/lib/temporaryEmail')
      const tempEmailData = await TemporaryEmailService.getTempEmailByUserId(user.id)

      if (tempEmailData) {
        setTempEmailData(tempEmailData)
        setShowPassword(true)
      } else {
        alert('No temporary email account found for this user.')
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to check temporary email:', error)
      setLoading(false)
    }
  }

  const handleManualVerification = async () => {
    if (!token.trim()) {
      alert('Please enter a verification token.')
      return
    }

    await verifyToken(token.trim())
  }

  return (
    <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
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
        {/* Email Token from URL */}
        {token ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-cinematic p-8 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              {verifying ? (
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
              ) : verificationStatus === 'success' ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : verificationStatus === 'error' ? (
                <Clock className="w-10 h-10 text-white" />
              ) : (
                <Mail className="w-10 h-10 text-white" />
              )}
            </div>

            <h2 className="text-2xl font-bold mb-4">
              {verifying ? 'Verifying...' :
               verificationStatus === 'success' ? 'Email Verified!' :
               verificationStatus === 'error' ? 'Verification Failed' :
               verificationStatus === 'expired' ? 'Link Expired' :
               'Verify Your Email'}
            </h2>

            <p className="text-text-secondary mb-6">
              {verifying ? 'Please wait while we verify your email address...' :
               verificationStatus === 'success' ? 'Your email has been successfully verified. Redirecting to dashboard...' :
               verificationStatus === 'error' ? 'Invalid or expired verification link. Please try again.' :
               verificationStatus === 'expired' ? 'This verification link has expired. Please request a new one.' :
               'We are verifying your email address...'}
            </p>

            {verificationStatus === 'error' || verificationStatus === 'expired' ? (
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full btn-cinematic py-3 rounded-full text-white font-medium"
                >
                  Try Again
                </button>
                <Link href="/login" className="block text-accent-orange hover:text-accent-gold transition-colors">
                  Back to Login
                </Link>
              </div>
            ) : verificationStatus === 'success' ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Successfully verified</span>
              </div>
            ) : null}
          </motion.div>
        ) : (
          /* Manual Verification Form */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-cinematic p-8"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-accent-orange to-accent-gold rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center">Verify Your Email</h2>
            <p className="text-text-secondary text-center mb-6">
              Enter your email address to receive a verification code
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-cinematic w-full px-4 py-3"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              {/* Check Temporary Email Button */}
              <div className="flex space-x-2">
                <button
                  onClick={checkTempEmail}
                  disabled={!email || loading}
                  className="flex-1 glass py-2 rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Check Temp Email
                </button>
                <button
                  onClick={() => setManualMode(!manualMode)}
                  className="glass px-4 py-2 rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  {manualMode ? 'Email' : 'Manual'}
                </button>
              </div>

              {/* Temporary Email Display */}
              {tempEmailData && (
                <div className="p-4 glass rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-accent-orange">Temporary Email Found</span>
                    <span className="text-xs text-text-muted">Expires: {new Date(tempEmailData.expires_at).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-text-muted">Email:</label>
                      <div className="font-mono text-sm break-all">{tempEmailData.temp_email}</div>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Password:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={tempEmailData.password}
                          readOnly
                          className="flex-1 input-cinematic px-3 py-2 font-mono text-sm"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 text-text-muted hover:text-text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Token Input */}
              {!tempEmailData && (
                <div className="space-y-4">
                  {manualMode ? (
                    <div>
                      <label htmlFor="token" className="block text-sm font-medium mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        id="token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="input-cinematic w-full px-4 py-3 font-mono"
                        placeholder="Enter your verification code"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={resendVerificationEmail}
                      disabled={!email || loading}
                      className="w-full btn-cinematic py-3 rounded-full text-white font-medium disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Send Verification Email'
                      )}
                    </button>
                  )}
                </div>
              )}

              {manualMode && (
                <button
                  onClick={handleManualVerification}
                  disabled={!token || verifying}
                  className="w-full btn-cinematic py-3 rounded-full text-white font-medium disabled:opacity-50"
                >
                  {verifying ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              )}

              {/* Status Messages */}
              {verificationStatus === 'success' && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">Email verified successfully!</span>
                  </div>
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">Invalid verification code</span>
                  </div>
                </div>
              )}

              {/* Back to Login */}
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center text-accent-orange hover:text-accent-gold transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-orange border-t-transparent rounded-full" />
      </div>
    }>
      <EmailVerificationContent />
    </Suspense>
  )
}