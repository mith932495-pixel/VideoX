'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, Download, Share2, Play, Pause, RotateCcw, Zap } from 'lucide-react'
import Link from 'next/link'
import UploadZone from '@/components/UploadZone'
import { useAuth } from '@/lib/auth'

interface FileWithPreview extends File {
  preview?: string
  duration?: number
  resolution?: string
}

interface EnhancementSettings {
  resolution: '1080p' | '4K' | '8K'
  qualityPreset: 'cinema' | 'animation' | 'documentary' | 'custom'
  aiEnhancement: boolean
  colorGrading: boolean
  noiseReduction: boolean
}

export default function EnhancePage() {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null)
  const [settings, setSettings] = useState<EnhancementSettings>({
    resolution: '1080p',
    qualityPreset: 'cinema',
    aiEnhancement: true,
    colorGrading: true,
    noiseReduction: false
  })

  const handleFileSelect = useCallback((file: FileWithPreview) => {
    setSelectedFile(file)
    setProcessedVideoUrl(null)
    setProcessingProgress(0)
  }, [])

  const getCreditCost = useCallback((resolution: string): number => {
    switch (resolution) {
      case '1080p': return 1
      case '4K': return 3
      case '8K': return 5
      default: return 1
    }
  }, [])

  const getProcessingTime = useCallback((resolution: string, duration: number): string => {
    const multiplier = {
      '1080p': 2,
      '4K': 5,
      '8K': 10
    }[resolution] || 2

    const totalMinutes = Math.ceil((duration * multiplier) / 60)
    if (totalMinutes < 1) return '< 1 minute'
    if (totalMinutes === 1) return '1 minute'
    return `${totalMinutes} minutes`
  }, [])

  const handleEnhancement = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProcessingProgress(0)

    // Simulate processing progress
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 1000)

    try {
      // Simulate API call to fal.ai
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Simulate successful processing
      setProcessedVideoUrl(selectedFile.preview || '')
      setProcessingProgress(100)

      setTimeout(() => {
        clearInterval(progressInterval)
        setIsProcessing(false)
      }, 1000)
    } catch (error) {
      console.error('Enhancement failed:', error)
      setIsProcessing(false)
      clearInterval(progressInterval)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setProcessedVideoUrl(null)
    setProcessingProgress(0)
    setIsProcessing(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-text-secondary mb-6">Please sign in to enhance videos</p>
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
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Video Enhancement</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="glass px-4 py-2 rounded-full">
                <span className="text-sm text-text-secondary">Credits:</span>
                <span className="ml-2 font-bold text-accent-orange">{user.credits}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {!selectedFile ? (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Upload className="w-6 h-6 mr-2 text-accent-orange" />
                    Upload Video
                  </h2>
                  <UploadZone onFileSelect={handleFileSelect} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Video Preview</h2>
                    <button
                      onClick={handleReset}
                      className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Upload Different</span>
                    </button>
                  </div>

                  {/* Video Display */}
                  <div className="card-cinematic p-6">
                    <div className="aspect-video bg-secondary rounded-lg overflow-hidden mb-4">
                      <video
                        src={selectedFile.preview}
                        className="w-full h-full object-contain"
                        controls
                      />
                    </div>

                    {/* Video Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="glass p-3 rounded-lg text-center">
                        <p className="text-xs text-text-muted">Original Resolution</p>
                        <p className="text-sm font-semibold">{selectedFile.resolution}</p>
                      </div>
                      <div className="glass p-3 rounded-lg text-center">
                        <p className="text-xs text-text-muted">Duration</p>
                        <p className="text-sm font-semibold">
                          {Math.floor(selectedFile.duration! / 60)}:{(selectedFile.duration! % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <div className="glass p-3 rounded-lg text-center">
                        <p className="text-xs text-text-muted">Target Resolution</p>
                        <p className="text-sm font-semibold text-accent-orange">{settings.resolution}</p>
                      </div>
                      <div className="glass p-3 rounded-lg text-center">
                        <p className="text-xs text-text-muted">Credit Cost</p>
                        <p className="text-sm font-semibold text-accent-orange">{getCreditCost(settings.resolution)}</p>
                      </div>
                    </div>

                    {/* Processing Status */}
                    {isProcessing && (
                      <div className="mt-6 p-4 glass rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Enhancing video...</span>
                          <span className="text-sm text-accent-orange">{Math.round(processingProgress)}%</span>
                        </div>
                        <div className="progress-cinematic h-3 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className="progress-fill-cinematic h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${processingProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                          This may take {getProcessingTime(settings.resolution, selectedFile.duration || 0)}
                        </p>
                      </div>
                    )}

                    {/* Processed Video */}
                    {processedVideoUrl && !isProcessing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-6 glass rounded-lg text-center"
                      >
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Enhancement Complete!</h3>
                        <p className="text-text-secondary mb-4">
                          Your video has been enhanced to {settings.resolution} quality
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button className="btn-cinematic px-6 py-3 rounded-full text-white font-medium flex items-center space-x-2">
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <button className="glass px-6 py-3 rounded-full font-medium flex items-center space-x-2 hover:bg-secondary transition-colors">
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="sticky top-24"
            >
              <div className="card-cinematic p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-accent-orange" />
                  Enhancement Settings
                </h3>

                <div className="space-y-6">
                  {/* Resolution Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Output Resolution</label>
                    <div className="space-y-2">
                      {['1080p', '4K', '8K'].map((resolution) => (
                        <button
                          key={resolution}
                          onClick={() => setSettings(prev => ({ ...prev, resolution: resolution as any }))}
                          className={`w-full p-3 rounded-lg border-2 transition-all ${
                            settings.resolution === resolution
                              ? 'border-accent-orange bg-accent-orange/10'
                              : 'border-secondary hover:border-accent-orange/50'
                          }`}
                          disabled={isProcessing}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{resolution}</span>
                            <span className="text-sm text-text-muted">{getCreditCost(resolution)} credits</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality Preset */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Quality Preset</label>
                    <select
                      value={settings.qualityPreset}
                      onChange={(e) => setSettings(prev => ({ ...prev, qualityPreset: e.target.value as any }))}
                      className="w-full input-cinematic px-4 py-3 rounded-lg"
                      disabled={isProcessing}
                    >
                      <option value="cinema">Cinema</option>
                      <option value="animation">Animation</option>
                      <option value="documentary">Documentary</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {/* Enhancement Options */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Enhancement Options</label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                        <span>AI Enhancement</span>
                        <input
                          type="checkbox"
                          checked={settings.aiEnhancement}
                          onChange={(e) => setSettings(prev => ({ ...prev, aiEnhancement: e.target.checked }))}
                          className="w-5 h-5 text-accent-orange rounded"
                          disabled={isProcessing}
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                        <span>Color Grading</span>
                        <input
                          type="checkbox"
                          checked={settings.colorGrading}
                          onChange={(e) => setSettings(prev => ({ ...prev, colorGrading: e.target.checked }))}
                          className="w-5 h-5 text-accent-orange rounded"
                          disabled={isProcessing}
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                        <span>Noise Reduction</span>
                        <input
                          type="checkbox"
                          checked={settings.noiseReduction}
                          onChange={(e) => setSettings(prev => ({ ...prev, noiseReduction: e.target.checked }))}
                          className="w-5 h-5 text-accent-orange rounded"
                          disabled={isProcessing}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Processing Summary */}
                  {selectedFile && !processedVideoUrl && (
                    <div className="pt-6 border-t border-secondary">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">Processing Time:</span>
                          <span className="font-medium">
                            {getProcessingTime(settings.resolution, selectedFile.duration || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">Credit Cost:</span>
                          <span className="font-medium text-accent-orange">
                            {getCreditCost(settings.resolution)} credits
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleEnhancement}
                        disabled={isProcessing || user.credits < getCreditCost(settings.resolution)}
                        className="w-full mt-6 btn-cinematic py-3 rounded-full text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>Enhancing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>Enhance Video</span>
                          </div>
                        )}
                      </button>

                      {user.credits < getCreditCost(settings.resolution) && (
                        <p className="text-sm text-red-400 text-center mt-2">
                          Insufficient credits. <Link href="/dashboard" className="text-accent-orange hover:underline">Get more credits</Link>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}