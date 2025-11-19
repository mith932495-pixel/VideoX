'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Film, Download, Share2, Trash2, Plus, CreditCard, Settings, BarChart3, Clock, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { CreditsManager } from '@/lib/credits'
import { PaymentManager, getPackageDisplayInfo, formatCurrency } from '@/lib/payments'

interface VideoItem {
  id: string
  original_url: string
  enhanced_url?: string
  thumbnail_url?: string
  resolution: string
  status: 'processing' | 'completed' | 'failed'
  progress?: number
  created_at: string
  duration: number
  file_size: number
  credits_used: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creditStats, setCreditStats] = useState<any>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchVideos()
      fetchCreditStats()
    }
  }, [user])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockVideos: VideoItem[] = [
        {
          id: '1',
          original_url: '/videos/sample1.mp4',
          enhanced_url: '/videos/sample1_enhanced.mp4',
          thumbnail_url: '/thumbnails/sample1.jpg',
          resolution: '4K',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          duration: 180,
          file_size: 500000000,
          credits_used: 3
        },
        {
          id: '2',
          original_url: '/videos/sample2.mp4',
          resolution: '8K',
          status: 'processing',
          progress: 65,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          duration: 300,
          file_size: 1200000000,
          credits_used: 5
        }
      ]
      setVideos(mockVideos)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCreditStats = async () => {
    if (!user) return

    try {
      const stats = await CreditsManager.getUserCreditStats(user.id)
      setCreditStats(stats)
    } catch (error) {
      console.error('Failed to fetch credit stats:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePurchaseCredits = async (packageId: string) => {
    if (!user) return

    try {
      const result = await PaymentManager.createCheckoutSession({
        packageId,
        userId: user.id,
        userEmail: user.email
      })

      if (result.success && result.sessionId) {
        await PaymentManager.redirectToCheckout(result.sessionId)
      } else {
        console.error('Failed to create checkout session:', result.error)
      }
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    try {
      // Mock delete - replace with actual API call
      setVideos(prev => prev.filter(v => v.id !== videoId))
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-text-secondary mb-6">Please sign in to access your dashboard</p>
          <Link href="/login" className="btn-cinematic px-6 py-3 rounded-full text-white font-medium">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary text-text-primary">
      {/* Header */}
      <header className="glass sticky top-0 z-40 py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="flex items-center space-x-4">
              <Link
                href="/enhance"
                className="btn-cinematic px-6 py-2 rounded-full text-white font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Enhancement</span>
              </Link>

              <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Credit Balance Card */}
          <div className="card-cinematic p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-orange/20 to-transparent rounded-full -mr-16 -mt-16" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 text-accent-orange" />
                <span className="text-2xl font-bold">{user.credits}</span>
              </div>
              <p className="text-text-secondary">Credits Available</p>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="mt-3 text-accent-orange hover:text-accent-gold transition-colors text-sm font-medium"
              >
                Buy More Credits →
              </button>
            </div>
          </div>

          {/* Videos Enhanced */}
          <div className="card-cinematic p-6">
            <div className="flex items-center justify-between mb-2">
              <Film className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">{creditStats?.totalVideosEnhanced || 0}</span>
            </div>
            <p className="text-text-secondary">Videos Enhanced</p>
          </div>

          {/* Processing Time */}
          <div className="card-cinematic p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold">
                {videos.filter(v => v.status === 'processing').length}
              </span>
            </div>
            <p className="text-text-secondary">Processing</p>
          </div>

          {/* Favorite Resolution */}
          <div className="card-cinematic p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold">{creditStats?.favoriteResolution || 'None'}</span>
            </div>
            <p className="text-text-secondary">Favorite Resolution</p>
          </div>
        </motion.div>

        {/* Video Library */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <Film className="w-6 h-6 mr-2 text-accent-orange" />
              My Videos
            </h2>

            <div className="flex items-center space-x-4">
              <select className="input-cinematic px-4 py-2 rounded-lg bg-secondary border-0">
                <option>All Videos</option>
                <option>Completed</option>
                <option>Processing</option>
                <option>Failed</option>
              </select>

              <select className="input-cinematic px-4 py-2 rounded-lg bg-secondary border-0">
                <option>Recent First</option>
                <option>Oldest First</option>
                <option>Large Files First</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-accent-orange border-t-transparent rounded-full" />
            </div>
          ) : videos.length === 0 ? (
            <div className="card-cinematic p-12 text-center">
              <Film className="w-16 h-16 mx-auto mb-4 text-text-muted" />
              <h3 className="text-xl font-bold mb-2">No videos yet</h3>
              <p className="text-text-secondary mb-6">Start enhancing your videos to see them here</p>
              <Link href="/enhance" className="btn-cinematic px-6 py-3 rounded-full text-white font-medium">
                Enhance Your First Video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-cinematic overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-secondary relative overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-12 h-12 text-text-muted" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {video.status === 'completed' && (
                        <div className="glass px-2 py-1 rounded-full text-xs font-medium text-green-400">
                          Completed
                        </div>
                      )}
                      {video.status === 'processing' && (
                        <div className="glass px-2 py-1 rounded-full text-xs font-medium text-yellow-400">
                          Processing {video.progress}%
                        </div>
                      )}
                      {video.status === 'failed' && (
                        <div className="glass px-2 py-1 rounded-full text-xs font-medium text-red-400">
                          Failed
                        </div>
                      )}
                    </div>

                    {/* Play Button Overlay */}
                    {video.status === 'completed' && (
                      <Link href={`/watch/${video.id}`} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-8 border-l-accent-orange border-y-4 border-y-transparent ml-1" />
                        </div>
                      </Link>
                    )}

                    {/* Progress Bar */}
                    {video.status === 'processing' && video.progress && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                        <div
                          className="h-full bg-gradient-to-r from-accent-orange to-accent-gold transition-all duration-300"
                          style={{ width: `${video.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-accent-orange">{video.resolution}</span>
                      <span className="text-xs text-text-muted">{formatDuration(video.duration)}</span>
                    </div>

                    <div className="text-sm text-text-secondary mb-3">
                      {formatFileSize(video.file_size)} • {video.credits_used} credits
                    </div>

                    <div className="text-xs text-text-muted mb-4">
                      {new Date(video.created_at).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {video.status === 'completed' && (
                        <>
                          <Link
                            href={`/watch/${video.id}`}
                            className="flex-1 text-center py-2 glass rounded-lg hover:bg-secondary transition-colors text-sm"
                          >
                            View
                          </Link>

                          <button className="p-2 glass rounded-lg hover:bg-secondary transition-colors">
                            <Download className="w-4 h-4" />
                          </button>

                          <button className="p-2 glass rounded-lg hover:bg-secondary transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {video.status === 'failed' && (
                        <button className="flex-1 text-center py-2 glass rounded-lg hover:bg-secondary transition-colors text-sm">
                          Retry Enhancement
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-2 glass rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Purchase Credits Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-cinematic p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Purchase Credits</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {['starter', 'professional', 'enterprise'].map((packageId) => {
                const info = getPackageDisplayInfo(packageId)
                if (!info) return null

                return (
                  <div
                    key={packageId}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-accent-orange ${
                      info.popular ? 'border-accent-orange bg-accent-orange/5' : 'border-secondary'
                    }`}
                    onClick={() => handlePurchaseCredits(packageId)}
                  >
                    {info.popular && (
                      <div className="inline-block px-2 py-1 bg-accent-orange text-white text-xs rounded-full mb-2">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{info.name}</h4>
                        <p className="text-text-secondary">{info.credits} credits</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{formatCurrency(info.price)}</div>
                        {info.savings && (
                          <div className="text-xs text-green-400">
                            Save {formatCurrency(info.savings)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 p-4 glass rounded-lg">
              <h4 className="font-medium mb-2">Credits Needed for Enhancements:</h4>
              <div className="space-y-1 text-sm text-text-secondary">
                <div>1080p Enhancement: 1 credit</div>
                <div>4K Enhancement: 3 credits</div>
                <div>8K Enhancement: 5 credits</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}