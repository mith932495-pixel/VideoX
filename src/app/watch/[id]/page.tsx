'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Maximize2, Settings, Download, Share2, ArrowLeft, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import VideoComparison from '@/components/VideoComparison'
import { useAuth } from '@/lib/auth'

interface VideoData {
  id: string
  original_url: string
  enhanced_url: string
  thumbnail_url: string
  resolution: string
  status: 'processing' | 'completed' | 'failed'
  progress?: number
  created_at: string
  duration: number
  file_size: number
  credits_used: number
  input_resolution: string
  quality_preset: string
}

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const videoId = params.id as string

  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [showSettings, setShowSettings] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    fetchVideo()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockVideo: VideoData = {
        id: videoId,
        original_url: '/videos/sample1.mp4',
        enhanced_url: '/videos/sample1_enhanced.mp4',
        thumbnail_url: '/thumbnails/sample1.jpg',
        resolution: '4K',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        duration: 180,
        file_size: 800000000,
        credits_used: 3,
        input_resolution: '720p',
        quality_preset: 'cinema'
      }
      setVideo(mockVideo)
    } catch (err) {
      setError('Failed to load video')
      console.error('Failed to fetch video:', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return

    const newMutedState = !isMuted
    videoRef.current.muted = newMutedState
    setIsMuted(newMutedState)
  }

  const handleSeek = (time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = async () => {
    if (!video) return

    try {
      const response = await fetch(video.enhanced_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enhanced_video_${video.id}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShare = async () => {
    if (!video) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Enhanced Video',
          text: 'Check out this enhanced video!',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        // Show toast notification
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-text-secondary mb-6">Please sign in to view enhanced videos</p>
          <Link href="/login" className="btn-cinematic px-6 py-3 rounded-full text-white font-medium">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent-orange" />
          <p className="text-text-secondary">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Video Not Found</h1>
          <p className="text-text-secondary mb-6">{error || 'This video could not be found'}</p>
          <Link href="/dashboard" className="btn-cinematic px-6 py-3 rounded-full text-white font-medium">
            Back to Dashboard
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
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold">Enhanced Video</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`p-2 rounded-lg transition-colors ${
                  showComparison ? 'bg-accent-orange text-white' : 'hover:bg-secondary'
                }`}
              >
                <Eye className="w-5 h-5" />
              </button>

              <button
                onClick={handleShare}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleDownload}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {showComparison ? (
          <motion.div
            key="comparison"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-6 py-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Before & After Comparison</h2>
              <p className="text-text-secondary">
                Compare the original video with the enhanced version
              </p>
            </div>

            <VideoComparison
              originalVideoUrl={video.original_url}
              enhancedVideoUrl={video.enhanced_url}
            />
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Video Player */}
            <div className="relative aspect-video bg-secondary">
              <video
                ref={videoRef}
                src={video.enhanced_url}
                className="w-full h-full object-contain"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlayPause}
              />

              {/* Center Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlayPause}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>

                  {/* Time */}
                  <span className="text-sm text-white">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  {/* Progress Bar */}
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                       onClick={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect()
                         const x = e.clientX - rect.left
                         const percentage = x / rect.width
                         handleSeek(percentage * duration)
                       }}>
                    <div
                      className="h-full bg-gradient-to-r from-accent-orange to-accent-gold transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Settings */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5 text-white" />
                    </button>

                    {showSettings && (
                      <div className="absolute bottom-12 right-0 glass p-4 rounded-lg min-w-[200px]">
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Playback Speed</label>
                          <select
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                            className="w-full p-2 bg-black/50 rounded text-white"
                          >
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1x</option>
                            <option value={1.5}>1.5x</option>
                            <option value={2}>2x</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Quality</label>
                          <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value)}
                            className="w-full p-2 bg-black/50 rounded text-white"
                          >
                            <option value="auto">Auto</option>
                            <option value="1080p">1080p</option>
                            <option value="4K">4K</option>
                            <option value="8K">8K</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Maximize2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Resolution Badge */}
              <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-sm">
                {video.resolution}
              </div>

              {/* Enhancement Complete Badge */}
              {video.status === 'completed' && (
                <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Enhanced</span>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="container mx-auto px-6 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Video Details</h2>

                    <div className="card-cinematic p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-text-muted mb-1">Input Resolution</p>
                          <p className="font-semibold">{video.input_resolution}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted mb-1">Output Resolution</p>
                          <p className="font-semibold text-accent-orange">{video.resolution}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted mb-1">Duration</p>
                          <p className="font-semibold">{formatDuration(video.duration)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted mb-1">File Size</p>
                          <p className="font-semibold">{formatFileSize(video.file_size)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted mb-1">Quality Preset</p>
                          <p className="font-semibold capitalize">{video.quality_preset}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted mb-1">Credits Used</p>
                          <p className="font-semibold">{video.credits_used}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted mb-1">Enhanced Date</p>
                          <p className="font-semibold">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted mb-1">Status</p>
                          <p className="font-semibold text-green-400">Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Enhancement Summary</h3>

                    <div className="card-cinematic p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">Quality Improvement</span>
                          <span className="font-semibold text-green-400">+285%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">Resolution Upscale</span>
                          <span className="font-semibold">4x</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">AI Enhancement</span>
                          <span className="font-semibold">Applied</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">Processing Time</span>
                          <span className="font-semibold">~5 min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-4">Actions</h3>

                    <div className="space-y-3">
                      <button
                        onClick={handleDownload}
                        className="w-full btn-cinematic py-3 rounded-full text-white font-medium flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Enhanced</span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="w-full glass py-3 rounded-full font-medium hover:bg-secondary transition-colors flex items-center justify-center space-x-2"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share Video</span>
                      </button>

                      <Link
                        href="/enhance"
                        className="w-full glass py-3 rounded-full font-medium hover:bg-secondary transition-colors flex items-center justify-center space-x-2 text-center"
                      >
                        <span>Enhance Another Video</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}