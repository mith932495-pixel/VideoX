import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
  credits: number
  created_at: string
}

export interface Video {
  id: string
  user_id: string
  original_url: string
  enhanced_url?: string
  resolution: string
  status: 'processing' | 'completed' | 'failed'
  progress?: number
  created_at: string
  processing_time?: number
  file_size: number
  duration: number
}

export interface ProcessingJob {
  id: string
  video_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  created_at: string
  updated_at: string
  error_message?: string
}

export interface CreditPurchase {
  id: string
  user_id: string
  amount: number
  credits_added: number
  stripe_payment_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}