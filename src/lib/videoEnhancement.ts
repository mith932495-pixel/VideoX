interface VideoEnhancementOptions {
  resolution: '1080p' | '4K' | '8K'
  qualityPreset: 'cinema' | 'animation' | 'documentary' | 'custom'
  aiEnhancement: boolean
  colorGrading: boolean
  noiseReduction: boolean
  customStrength?: number // 0.1 - 1.0
}

interface EnhancementJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  estimatedTime?: number
  resultUrl?: string
  error?: string
  createdAt: Date
}

interface ProcessingProgress {
  progress: number
  stage: 'uploading' | 'processing' | 'enhancing' | 'finalizing' | 'completed' | 'failed'
  message: string
  estimatedTimeRemaining?: number
}

export class VideoEnhancer {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_FAL_API_KEY || ''
    this.baseUrl = 'https://api.fal.ai/v1'
  }

  /**
   * Upload video to cloud storage for processing
   */
  private async uploadVideo(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.url
  }

  /**
   * Submit video enhancement job to fal.ai
   */
  private async submitEnhancementJob(
    videoUrl: string,
    options: VideoEnhancementOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<string> {
    onProgress?.({
      progress: 20,
      stage: 'processing',
      message: 'Analyzing video content...'
    })

    const payload = {
      video_url: videoUrl,
      target_resolution: options.resolution,
      quality_preset: options.qualityPreset,
      ai_enhancement: options.aiEnhancement,
      color_grading: options.colorGrading,
      noise_reduction: options.noiseReduction,
      strength: options.customStrength || 0.7
    }

    const response = await fetch(`${this.baseUrl}/enhance/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Failed to submit enhancement job: ${response.statusText}`)
    }

    const result = await response.json()
    return result.request_id
  }

  /**
   * Poll job status until completion
   */
  private async pollJobStatus(
    jobId: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{ enhancedUrl: string; metadata: any }> {
    const maxPollingTime = 30 * 60 * 1000 // 30 minutes
    const pollInterval = 2000 // 2 seconds
    const startTime = Date.now()

    while (Date.now() - startTime < maxPollingTime) {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to check job status: ${response.statusText}`)
      }

      const job = await response.json()

      const progress = this.calculateProgress(job.status, job.progress)
      const stage = this.mapStage(job.status)
      const estimatedTimeRemaining = job.estimated_time_remaining

      onProgress?.({
        progress,
        stage,
        message: this.getProgressMessage(stage, job.status),
        estimatedTimeRemaining
      })

      if (job.status === 'completed' && job.output) {
        return {
          url: job.output.video_url,
          metadata: job.output.metadata
        }
      }

      if (job.status === 'failed') {
        throw new Error(`Enhancement failed: ${job.error || 'Unknown error'}`)
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Enhancement job timed out')
  }

  /**
   * Main enhancement function
   */
  async enhanceVideo(
    file: File,
    options: VideoEnhancementOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{ enhancedUrl: string; metadata: any }> {
    try {
      onProgress?.({
        progress: 5,
        stage: 'uploading',
        message: 'Uploading video for processing...'
      })

      // Upload video
      const videoUrl = await this.uploadVideo(file, (uploadProgress) => {
        onProgress?.({
          progress: 5 + (uploadProgress * 0.15), // 5-20% progress
          stage: 'uploading',
          message: `Uploading video... ${Math.round(uploadProgress)}%`
        })
      })

      onProgress?.({
        progress: 25,
        stage: 'processing',
        message: 'Submitting enhancement job...'
      })

      // Submit enhancement job
      const jobId = await this.submitEnhancementJob(videoUrl, options, onProgress)

      onProgress?.({
        progress: 30,
        stage: 'enhancing',
        message: 'Starting AI enhancement...'
      })

      // Poll for completion
      const result = await this.pollJobStatus(jobId, onProgress)

      onProgress?.({
        progress: 100,
        stage: 'completed',
        message: 'Enhancement complete!'
      })

      return result

    } catch (error) {
      onProgress?.({
        progress: 0,
        stage: 'failed',
        message: `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      throw error
    }
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(status: string, jobProgress?: number): number {
    switch (status) {
      case 'pending':
        return 30
      case 'processing':
        return 30 + (jobProgress || 0) * 0.5 // 30-80%
      case 'enhancing':
        return 80 + (jobProgress || 0) * 0.15 // 80-95%
      case 'finalizing':
        return 95
      case 'completed':
        return 100
      case 'failed':
        return 0
      default:
        return 30
    }
  }

  /**
   * Map fal.ai status to our status
   */
  private mapStage(status: string): ProcessingProgress['stage'] {
    switch (status) {
      case 'pending':
        return 'processing'
      case 'processing':
        return 'processing'
      case 'enhancing':
        return 'enhancing'
      case 'finalizing':
        return 'finalizing'
      case 'completed':
        return 'completed'
      case 'failed':
        return 'failed'
      default:
        return 'processing'
    }
  }

  /**
   * Get user-friendly progress message
   */
  private getProgressMessage(stage: ProcessingProgress['stage'], status: string): string {
    switch (stage) {
      case 'processing':
        switch (status) {
          case 'pending':
            return 'Initializing AI models...'
          case 'processing':
            return 'Analyzing video content...'
          default:
            return 'Processing video...'
        }
      case 'enhancing':
        return 'Applying AI enhancement...'
      case 'finalizing':
        return 'Finalizing enhanced video...'
      case 'completed':
        return 'Enhancement complete!'
      case 'failed':
        return 'Enhancement failed'
      default:
        return 'Processing...'
    }
  }

  /**
   * Get estimated processing time
   */
  getEstimatedProcessingTime(
    fileDuration: number,
    targetResolution: string,
    qualityPreset: string
  ): number {
    const resolutionMultiplier = {
      '1080p': 1,
      '4K': 4,
      '8K': 8
    }[targetResolution] || 1

    const qualityMultiplier = {
      'cinema': 1.5,
      'animation': 1.2,
      'documentary': 1.0,
      'custom': 1.3
    }[qualityPreset] || 1

    // Base processing time: 2x video duration
    return Math.ceil(fileDuration * 2 * resolutionMultiplier * qualityMultiplier)
  }

  /**
   * Get cost information
   */
  getCostInfo(targetResolution: string): {
    credits: number
    estimatedCost: number // in USD
  } {
    const creditCost = {
      '1080p': 1,
      '4K': 3,
      '8K': 5
    }[targetResolution] || 1

    const estimatedCost = creditCost * 0.10 // $0.10 per credit

    return {
      credits: creditCost,
      estimatedCost
    }
  }

  /**
   * Cancel an enhancement job
   */
  async cancelJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to cancel job: ${response.statusText}`)
    }
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<EnhancementJob> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Key ${this.apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get job details: ${response.statusText}`)
    }

    const job = await response.json()

    return {
      id: job.request_id,
      status: job.status,
      progress: this.calculateProgress(job.status, job.progress),
      estimatedTime: job.estimated_time_remaining,
      resultUrl: job.output?.video_url,
      error: job.error,
      createdAt: new Date(job.created_at)
    }
  }
}

// Singleton instance
export const videoEnhancer = new VideoEnhancer()

// Utility functions
export function getOptimalSettings(
  videoMetadata: {
    duration: number
    resolution: string
    fileType: string
  },
  targetResolution: '1080p' | '4K' | '8K',
  qualityPreset: 'cinema' | 'animation' | 'documentary' | 'custom'
): VideoEnhancementOptions {
  return {
    resolution: targetResolution,
    qualityPreset,
    aiEnhancement: true,
    colorGrading: qualityPreset === 'cinema',
    noiseReduction: videoMetadata.duration > 300, // 5 minutes+
    customStrength: qualityPreset === 'custom' ? 0.7 : undefined
  }
}

export function validateEnhancementRequest(
  file: File,
  userCredits: number,
  targetResolution: string
): { isValid: boolean; error?: string } {
  const { credits } = videoEnhancer.getCostInfo(targetResolution)

  if (userCredits < credits) {
    return {
      isValid: false,
      error: `Insufficient credits. Need ${credits} credits, you have ${userCredits}.`
    }
  }

  const maxSize = {
    '1080p': 2 * 1024 * 1024 * 1024, // 2GB
    '4K': 8 * 1024 * 1024 * 1024,    // 8GB
    '8K': 20 * 1024 * 1024 * 1024    // 20GB
  }[targetResolution] || 2 * 1024 * 1024 * 1024

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large for ${targetResolution} enhancement. Maximum size: ${(maxSize / 1024 / 1024 / 1024).toFixed(1)}GB`
    }
  }

  return { isValid: true }
}