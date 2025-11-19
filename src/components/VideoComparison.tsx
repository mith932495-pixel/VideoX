'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Eye, EyeOff, Sliders } from 'lucide-react'

interface VideoComparisonProps {
  originalVideoUrl: string
  enhancedVideoUrl: string
  className?: string
  autoPlay?: boolean
}

export default function VideoComparison({
  originalVideoUrl,
  enhancedVideoUrl,
  className = '',
  autoPlay = false
}: VideoComparisonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showOriginal, setShowOriginal] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'toggle' | 'side-by-side'>('slider')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const originalVideoRef = useRef<HTMLVideoElement>(null)
  const enhancedVideoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Sync video playback
  const syncVideos = useCallback(() => {
    const original = originalVideoRef.current
    const enhanced = enhancedVideoRef.current

    if (!original || !enhanced) return

    if (Math.abs(original.currentTime - enhanced.currentTime) > 0.1) {
      const targetTime = Math.max(original.currentTime, enhanced.currentTime)
      original.currentTime = targetTime
      enhanced.currentTime = targetTime
    }
  }, [])

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    const original = originalVideoRef.current
    const enhanced = enhancedVideoRef.current

    if (!original || !enhanced) return

    if (isPlaying) {
      original.pause()
      enhanced.pause()
    } else {
      original.play()
      enhanced.play()
    }

    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // Handle seek
  const handleSeek = useCallback((time: number) => {
    const original = originalVideoRef.current
    const enhanced = enhancedVideoRef.current

    if (!original || !enhanced) return

    original.currentTime = time
    enhanced.currentTime = time
    setCurrentTime(time)
  }, [])

  // Handle volume
  const toggleMute = useCallback(() => {
    const original = originalVideoRef.current
    const enhanced = enhancedVideoRef.current

    if (!original || !enhanced) return

    const newMutedState = !isMuted
    original.muted = newMutedState
    enhanced.muted = newMutedState
    setIsMuted(newMutedState)
  }, [isMuted])

  // Handle slider drag
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  // Reset videos
  const resetVideos = useCallback(() => {
    handleSeek(0)
    if (isPlaying) {
      togglePlayPause()
    }
  }, [handleSeek, isPlaying, togglePlayPause])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }

    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Format time
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Setup video event listeners
  useEffect(() => {
    const original = originalVideoRef.current
    const enhanced = enhancedVideoRef.current

    if (!original || !enhanced) return

    const handleLoadedMetadata = () => {
      setDuration(original.duration)
      if (autoPlay) {
        togglePlayPause()
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(original.currentTime)
      syncVideos()
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    // Add event listeners to both videos
    [original, enhanced].forEach(video => {
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('ended', handleEnded)
      video.addEventListener('seeked', syncVideos)
    })

    return () => {
      [original, enhanced].forEach(video => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('seeked', syncVideos)
      })
    }
  }, [autoPlay, syncVideos, togglePlayPause])

  return (
    <div className={`video-comparison-container ${className}`} ref={containerRef}>
      <div className="card-cinematic overflow-hidden">
        {/* Mode Selector */}
        <div className="flex justify-center p-4 border-b border-secondary">
          <div className="inline-flex glass rounded-lg p-1">
            <button
              onClick={() => setComparisonMode('slider')}
              className={`px-4 py-2 rounded-md transition-colors ${
                comparisonMode === 'slider'
                  ? 'bg-accent-orange text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Sliders className="w-4 h-4 inline mr-2" />
              Slider
            </button>
            <button
              onClick={() => setComparisonMode('toggle')}
              className={`px-4 py-2 rounded-md transition-colors ${
                comparisonMode === 'toggle'
                  ? 'bg-accent-orange text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Toggle
            </button>
            <button
              onClick={() => setComparisonMode('side-by-side')}
              className={`px-4 py-2 rounded-md transition-colors ${
                comparisonMode === 'side-by-side'
                  ? 'bg-accent-orange text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Side-by-Side
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-secondary" ref={sliderRef}>
          <AnimatePresence mode="wait">
            {comparisonMode === 'slider' && (
              <motion.div
                key="slider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full"
              >
                {/* Original Video (Left) */}
                <video
                  ref={originalVideoRef}
                  src={originalVideoUrl}
                  className="absolute inset-0 w-full h-full object-contain"
                  muted={isMuted}
                  playsInline
                />

                {/* Enhanced Video (Right with clipping) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                >
                  <video
                    ref={enhancedVideoRef}
                    src={enhancedVideoUrl}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{
                      transform: `translateX(-${(100 - sliderPosition)}%)`,
                      width: `${100 / (sliderPosition / 100)}%`
                    }}
                    muted={isMuted}
                    playsInline
                  />
                </div>

                {/* Slider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => {
                    const handleMouseMove = (e: MouseEvent) => handleSliderMove(e.clientX)
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-gray-800" />
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-sm">
                  Original
                </div>
                <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-sm">
                  Enhanced
                </div>
              </motion.div>
            )}

            {comparisonMode === 'toggle' && (
              <motion.div
                key="toggle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full"
              >
                <AnimatePresence mode="wait">
                  {showOriginal ? (
                    <motion.video
                      key="original"
                      ref={originalVideoRef}
                      src={originalVideoUrl}
                      className="absolute inset-0 w-full h-full object-contain"
                      muted={isMuted}
                      playsInline
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  ) : (
                    <motion.video
                      key="enhanced"
                      ref={enhancedVideoRef}
                      src={enhancedVideoUrl}
                      className="absolute inset-0 w-full h-full object-contain"
                      muted={isMuted}
                      playsInline
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>

                {/* Toggle Button */}
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 btn-cinematic px-6 py-3 rounded-full text-white font-medium"
                >
                  {showOriginal ? (
                    <>
                      <Eye className="w-4 h-4 inline mr-2" />
                      Show Enhanced
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 inline mr-2" />
                      Show Original
                    </>
                  )}
                </button>

                {/* Label */}
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-sm">
                  {showOriginal ? 'Original' : 'Enhanced'}
                </div>
              </motion.div>
            )}

            {comparisonMode === 'side-by-side' && (
              <motion.div
                key="side-by-side"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full flex"
              >
                {/* Original Video */}
                <div className="relative w-1/2 border-r border-white/10">
                  <video
                    ref={originalVideoRef}
                    src={originalVideoUrl}
                    className="w-full h-full object-contain"
                    muted={isMuted}
                    playsInline
                  />
                  <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-sm">
                    Original
                  </div>
                </div>

                {/* Enhanced Video */}
                <div className="relative w-1/2">
                  <video
                    ref={enhancedVideoRef}
                    src={enhancedVideoUrl}
                    className="w-full h-full object-contain"
                    muted={isMuted}
                    playsInline
                  />
                  <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-sm">
                    Enhanced
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
        </div>

        {/* Video Controls */}
        <div className="p-4 glass">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            {/* Time */}
            <span className="text-sm text-text-secondary min-w-[100px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden cursor-pointer"
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
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Reset */}
            <button
              onClick={resetVideos}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}