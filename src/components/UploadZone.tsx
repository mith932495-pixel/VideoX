'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Film, Clock, CheckCircle, AlertCircle, FileVideo } from 'lucide-react'

interface FileWithPreview extends File {
  preview?: string
  duration?: number
  resolution?: string
}

interface UploadZoneProps {
  onFileSelect: (file: FileWithPreview) => void
  maxFileSize?: number // in bytes
  maxDuration?: number // in seconds
  acceptedFormats?: string[]
  className?: string
}

export default function UploadZone({
  onFileSelect,
  maxFileSize = 12 * 1024 * 1024 * 1024, // 12GB for 8K videos
  maxDuration = 1200, // 20 minutes
  acceptedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
  className = ''
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{
    duration: number
    resolution: string
    size: string
  } | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return 'Invalid file format. Please upload a video file.'
    }

    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeGB = (maxFileSize / (1024 * 1024 * 1024)).toFixed(1)
      return `File size exceeds ${maxSizeGB}GB limit.`
    }

    return null
  }, [acceptedFormats, maxFileSize])

  const getFileDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(0)
      }

      video.src = URL.createObjectURL(file)
    })
  }, [])

  const getVideoResolution = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        const resolution = `${video.videoWidth}x${video.videoHeight}`
        window.URL.revokeObjectURL(video.src)
        resolve(resolution)
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        resolve('Unknown')
      }

      video.src = URL.createObjectURL(file)
    })
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get file metadata
      const [duration, resolution] = await Promise.all([
        getFileDuration(file),
        getVideoResolution(file)
      ])

      // Check duration
      if (duration > maxDuration) {
        setError(`Video duration exceeds ${Math.floor(maxDuration / 60)} minute limit.`)
        setIsUploading(false)
        return
      }

      const fileInfo = {
        duration,
        resolution,
        size: formatFileSize(file.size)
      }
      setFileInfo(fileInfo)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Add preview to file object
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
        duration,
        resolution
      }) as FileWithPreview

      // Simulate processing time
      setTimeout(() => {
        setUploadProgress(100)
        setIsUploading(false)
        clearInterval(progressInterval)
        setSelectedFile(fileWithPreview)
        onFileSelect(fileWithPreview)
      }, 2000)

    } catch (error) {
      setError('Failed to process video file. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [validateFile, getFileDuration, getVideoResolution, formatFileSize, maxDuration, onFileSelect])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    processFile(acceptedFiles[0])
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': acceptedFormats
    },
    multiple: false,
    disabled: isUploading
  })

  const handleRemoveFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview)
    }
    setSelectedFile(null)
    setFileInfo(null)
    setUploadProgress(0)
    setError(null)
  }

  return (
    <div className={`w-full ${className}`}>
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              className={`dropzone-cinematic p-12 cursor-pointer transition-all duration-300 ${
                isDragActive || dragActive ? 'drag-active scale-105' : ''
              } ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
            >
              <input {...getInputProps()} />

              <div className="text-center">
                <motion.div
                  animate={{
                    scale: isDragActive ? 1.1 : 1,
                    rotate: isDragActive ? 5 : 0
                  }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto w-20 h-20 mb-6"
                >
                  <div className="w-full h-full bg-gradient-to-br from-accent-orange to-accent-gold rounded-full flex items-center justify-center">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <h3 className="text-2xl font-bold mb-2 text-text-primary">
                  {isDragActive ? 'Drop your video here' : 'Upload your video'}
                </h3>

                <p className="text-text-secondary mb-4">
                  Drag and drop your video file here, or click to browse
                </p>

                <div className="flex flex-wrap justify-center gap-2 text-sm text-text-muted">
                  <span className="px-3 py-1 glass rounded-full">MP4, AVI, MOV, WMV</span>
                  <span className="px-3 py-1 glass rounded-full">Up to {formatFileSize(maxFileSize)}</span>
                  <span className="px-3 py-1 glass rounded-full">Max {Math.floor(maxDuration / 60)} min</span>
                </div>

                {isUploading && (
                  <div className="mt-6">
                    <div className="flex items-center justify-center mb-2">
                      <div className="animate-spin w-5 h-5 border-2 border-accent-orange border-t-transparent rounded-full mr-2" />
                      <span className="text-sm text-text-secondary">Processing video...</span>
                    </div>
                    <div className="progress-cinematic h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="progress-fill-cinematic h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="card-cinematic p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-orange to-accent-gold rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileVideo className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary truncate max-w-xs">
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {fileInfo?.size} • {fileInfo?.resolution} • {fileInfo ? formatDuration(fileInfo.duration) : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRemoveFile}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Preview */}
            <div className="aspect-video bg-secondary rounded-lg mb-4 overflow-hidden">
              {selectedFile.preview && (
                <video
                  src={selectedFile.preview}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
            </div>

            {/* File Info Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass p-3 rounded-lg text-center">
                <Film className="w-5 h-5 mx-auto mb-1 text-accent-orange" />
                <p className="text-xs text-text-muted">Resolution</p>
                <p className="text-sm font-semibold text-text-primary">{fileInfo?.resolution}</p>
              </div>

              <div className="glass p-3 rounded-lg text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-accent-orange" />
                <p className="text-xs text-text-muted">Duration</p>
                <p className="text-sm font-semibold text-text-primary">
                  {fileInfo ? formatDuration(fileInfo.duration) : ''}
                </p>
              </div>

              <div className="glass p-3 rounded-lg text-center">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-accent-orange" />
                <p className="text-xs text-text-muted">Status</p>
                <p className="text-sm font-semibold text-text-primary">Ready</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  )
}