import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface VideoPreviewOptions {
  targetResolution: string
  quality: number
  sampleDuration?: number // in seconds
}

interface ProcessingProgress {
  progress: number
  stage: 'initializing' | 'loading' | 'processing' | 'finalizing' | 'completed'
  message: string
}

export class VideoPreviewProcessor {
  private ffmpeg: FFmpeg | null = null
  private isInitialized = false

  constructor() {
    // Initialize FFmpeg instance
    this.ffmpeg = new FFmpeg()
  }

  /**
   * Initialize FFmpeg.wasm with necessary files
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Load FFmpeg core files
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

      await this.ffmpeg!.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      this.isInitialized = true
      console.log('FFmpeg.wasm initialized successfully')
    } catch (error) {
      console.error('Failed to initialize FFmpeg.wasm:', error)
      throw new Error('Failed to initialize video processing engine')
    }
  }

  /**
   * Process video for preview enhancement
   */
  async processVideoPreview(
    file: File,
    options: VideoPreviewOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{ processedBlob: Blob; previewUrl: string; metadata: any }> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    onProgress?.({
      progress: 10,
      stage: 'loading',
      message: 'Loading video file...'
    })

    try {
      // Generate unique filename
      const inputFileName = `input_${Date.now()}.${file.name.split('.').pop()}`
      const outputFileName = `output_${Date.now()}_enhanced.mp4`

      // Write input file to FFmpeg virtual file system
      await this.ffmpeg!.writeFile(inputFileName, await fetchFile(file))

      onProgress?.({
        progress: 30,
        stage: 'processing',
        message: 'Analyzing video...'
      })

      // Get video information
      const metadata = await this.getVideoMetadata(inputFileName)

      onProgress?.({
        progress: 40,
        stage: 'processing',
        message: 'Applying AI enhancement...'
      })

      // Calculate sample duration (max 10 seconds for preview)
      const sampleDuration = Math.min(options.sampleDuration || 10, metadata.duration)

      // Build FFmpeg command for preview enhancement
      const ffmpegCommand = this.buildFFmpegCommand({
        inputFileName,
        outputFileName,
        targetResolution: options.targetResolution,
        quality: options.quality,
        startTime: 0,
        duration: sampleDuration,
        originalWidth: metadata.width,
        originalHeight: metadata.height
      })

      onProgress?.({
        progress: 60,
        stage: 'processing',
        message: 'Enhancing video quality...'
      })

      // Execute FFmpeg command
      await this.ffmpeg!.exec(ffmpegCommand)

      onProgress?.({
        progress: 80,
        stage: 'finalizing',
        message: 'Finalizing enhanced video...'
      })

      // Read the processed file
      const processedData = await this.ffmpeg!.readFile(outputFileName)
      const processedBlob = new Blob([processedData as Uint8Array], { type: 'video/mp4' })
      const previewUrl = URL.createObjectURL(processedBlob)

      // Cleanup
      await this.cleanup([inputFileName, outputFileName])

      onProgress?.({
        progress: 100,
        stage: 'completed',
        message: 'Preview enhancement complete!'
      })

      return {
        processedBlob,
        previewUrl,
        metadata: {
          ...metadata,
          processedDuration: sampleDuration,
          targetResolution: options.targetResolution,
          quality: options.quality
        }
      }

    } catch (error) {
      console.error('Video preview processing failed:', error)
      throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract basic video metadata
   */
  private async getVideoMetadata(inputFileName: string): Promise<{
    duration: number
    width: number
    height: number
    fps: number
    bitrate: number
  }> {
    try {
      // Use ffprobe to get video information
      await this.ffmpeg!.exec(['-i', inputFileName, '-f', 'null', '-'])

      // For now, return placeholder values
      // In a real implementation, you'd parse ffprobe output
      return {
        duration: 30, // placeholder
        width: 1280,
        height: 720,
        fps: 30,
        bitrate: 5000000
      }
    } catch (error) {
      console.warn('Failed to extract metadata, using defaults:', error)
      return {
        duration: 30,
        width: 1280,
        height: 720,
        fps: 30,
        bitrate: 5000000
      }
    }
  }

  /**
   * Build FFmpeg command for video enhancement
   */
  private buildFFmpegCommand({
    inputFileName,
    outputFileName,
    targetResolution,
    quality,
    startTime,
    duration,
    originalWidth,
    originalHeight
  }: {
    inputFileName: string
    outputFileName: string
    targetResolution: string
    quality: number
    startTime: number
    duration: number
    originalWidth: number
    originalHeight: number
  }): string[] {
    const command = []

    // Input
    command.push('-i', inputFileName)

    // Seek to start time
    if (startTime > 0) {
      command.push('-ss', startTime.toString())
    }

    // Duration
    if (duration > 0) {
      command.push('-t', duration.toString())
    }

    // Video filters for enhancement
    const filters = []

    // Resolution scaling
    const scaleSettings = this.getScaleSettings(targetResolution, originalWidth, originalHeight)
    if (scaleSettings) {
      filters.push(`scale=${scaleSettings}`)
    }

    // Quality enhancement filters
    if (quality >= 0.8) {
      // High quality enhancement
      filters.push(
        'unsharp=5:5:1.0:5:5:0.0', // sharpen
        'eq=contrast=1.1:brightness=0.05:saturation=1.1' // color enhancement
      )
    } else if (quality >= 0.6) {
      // Medium quality enhancement
      filters.push('unsharp=3:3:0.5:3:3:0.0')
    }

    // Add noise reduction if needed
    if (quality >= 0.9) {
      filters.push('hqdn3d=4:3:6:4.5')
    }

    // Apply filters
    if (filters.length > 0) {
      command.push('-vf', filters.join(','))
    }

    // Codec settings
    command.push('-c:v', 'libx264')
    command.push('-preset', 'medium')
    command.push('-crf', (23 - (quality * 10)).toString()) // Lower CRF = higher quality
    command.push('-pix_fmt', 'yuv420p')

    // Audio settings
    command.push('-c:a', 'aac')
    command.push('-b:a', '128k')

    // Output
    command.push('-y', outputFileName)

    return command
  }

  /**
   * Calculate scaling settings for target resolution
   */
  private getScaleSettings(targetResolution: string, originalWidth: number, originalHeight: number): string | null {
    const aspectRatio = originalWidth / originalHeight

    switch (targetResolution) {
      case '1080p':
        if (aspectRatio > 16/9) {
          return '1920:-1' // Scale to 1920p width, maintain aspect ratio
        } else {
          return '-1:1080' // Scale to 1080p height, maintain aspect ratio
        }
      case '4K':
        if (aspectRatio > 16/9) {
          return '3840:-1'
        } else {
          return '-1:2160'
        }
      case '8K':
        if (aspectRatio > 16/9) {
          return '7680:-1'
        } else {
          return '-1:4320'
        }
      default:
        return null
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(fileNames: string[]): Promise<void> {
    try {
      for (const fileName of fileNames) {
        await this.ffmpeg!.deleteFile(fileName)
      }
    } catch (error) {
      console.warn('Failed to cleanup temporary files:', error)
    }
  }

  /**
   * Get estimated processing time
   */
  getEstimatedProcessingTime(
    fileDuration: number,
    targetResolution: string,
    quality: number
  ): number {
    const resolutionMultiplier = {
      '1080p': 1,
      '4K': 3,
      '8K': 6
    }[targetResolution] || 1

    const qualityMultiplier = 2 - quality // Higher quality = longer processing

    return Math.ceil(fileDuration * resolutionMultiplier * qualityMultiplier)
  }

  /**
   * Check if browser supports required features
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof Worker !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof WebAssembly !== 'undefined'
    )
  }

  /**
   * Get recommended quality settings based on device capabilities
   */
  static getRecommendedQuality(): number {
    if (typeof window === 'undefined') return 0.7

    const navigator = window.navigator as any
    const deviceMemory = navigator.deviceMemory || 4
    const hardwareConcurrency = navigator.hardwareConcurrency || 4

    // Adjust quality based on device capabilities
    if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
      return 0.9 // High quality
    } else if (deviceMemory >= 4 && hardwareConcurrency >= 4) {
      return 0.7 // Medium quality
    } else {
      return 0.5 // Lower quality for less capable devices
    }
  }
}

// Singleton instance
export const videoPreviewProcessor = new VideoPreviewProcessor()

// Utility function to check file size and format
export function validateVideoFile(file: File): {
  isValid: boolean
  error?: string
  warnings?: string[]
} {
  const maxSize = 500 * 1024 * 1024 // 500MB for preview
  const validTypes = [
    'video/mp4',
    'video/webm',
    'video/avi',
    'video/mov',
    'video/wmv'
  ]

  const warnings: string[] = []

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Please use MP4, WebM, AVI, MOV, or WMV.`
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds preview limit of 500MB.`
    }
  }

  if (file.size > 100 * 1024 * 1024) {
    warnings.push('Large file detected. Preview processing may take longer.')
  }

  return {
    isValid: true,
    warnings
  }
}