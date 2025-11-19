import { supabase } from './supabase'
import { ActivityTrackingService } from './activityTracking'
import { UserProfilingService } from './userProfiling'

interface Team {
  id: string
  name: string
  description: string
  avatar_url?: string
  owner_id: string
  settings: {
    allow_public_projects: boolean
    require_approval_for_new_members: boolean
    default_role: 'admin' | 'member' | 'viewer'
    storage_quota_gb: number
    billing_plan: 'free' | 'pro' | 'enterprise'
    custom_branding: boolean
    api_access: boolean
  }
  subscription: {
    plan_type: 'free' | 'pro' | 'enterprise'
    status: 'active' | 'trialing' | 'past_due' | 'canceled'
    current_period_start: string
    current_period_end: string
    member_limit: number
    storage_used: number
    billing_email: string
  }
  created_at?: string
  updated_at?: string
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: {
    can_create_projects: boolean
    can_delete_projects: boolean
    can_invite_members: boolean
    can_manage_billing: boolean
    can_view_analytics: boolean
    can_manage_settings: boolean
  }
  status: 'active' | 'pending' | 'suspended'
  invited_by?: string
  invited_at?: string
  joined_at?: string
  last_active_at?: string
  profile: {
    display_name: string
    email: string
    avatar_url?: string
    title?: string
    department?: string
  }
}

interface Project {
  id: string
  team_id: string
  name: string
  description: string
  type: 'video_production' | 'content_creation' | 'marketing' | 'research' | 'other'
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  owner_id: string
  collaborators: ProjectCollaborator[]
  settings: {
    is_public: boolean
    allow_comments: boolean
    require_review: boolean
    auto_save: boolean
    version_control: boolean
  }
  metadata: {
    tags: string[]
    category: string
    deadline?: string
    budget?: number
    estimated_hours?: number
  }
  content: {
    videos: ProjectVideo[]
    assets: ProjectAsset[]
    notes: ProjectNote[]
    tasks: ProjectTask[]
    timeline: TimelineEvent[]
  }
  created_at?: string
  updated_at?: string
}

interface ProjectCollaborator {
  user_id: string
  role: 'editor' | 'reviewer' | 'commenter' | 'viewer'
  permissions: string[]
  added_at: string
  added_by: string
}

interface ProjectVideo {
  id: string
  name: string
  description?: string
  file_url: string
  thumbnail_url?: string
  duration: number
  file_size: number
  format: string
  resolution: string
  processing_status: 'uploading' | 'processing' | 'completed' | 'failed'
  enhancement_settings: {
    target_resolution?: string
    quality_level?: string
    ai_enhancements?: string[]
    custom_filters?: any[]
  }
  versions: VideoVersion[]
  comments: VideoComment[]
  analytics: VideoAnalytics
  uploaded_by: string
  uploaded_at?: string
  created_at?: string
  updated_at?: string
}

interface VideoVersion {
  id: string
  version_number: number
  name: string
  description?: string
  file_url: string
  file_size: number
  created_by: string
  created_at: string
  changes: Array<{
    type: 'enhancement' | 'trim' | 'filter' | 'effect'
    description: string
    settings: any
  }>
}

interface VideoComment {
  id: string
  user_id: string
  timestamp: number
  text: string
  type: 'general' | 'suggestion' | 'issue' | 'approval'
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  replies: VideoComment[]
  created_at: string
}

interface VideoAnalytics {
  views: number
  downloads: number
  shares: number
  average_watch_time: number
  completion_rate: number
  engagement_score: number
  viewer_demographics: Record<string, number>
  performance_metrics: Record<string, number>
}

interface ProjectTask {
  id: string
  title: string
  description?: string
  type: 'enhancement' | 'review' | 'approval' | 'upload' | 'edit' | 'other'
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: string
  assignee_name?: string
  creator_id: string
  due_date?: string
  completed_at?: string
  estimated_hours?: number
  actual_hours?: number
  dependencies: string[]
  tags: string[]
  attachments: ProjectAsset[]
  comments: TaskComment[]
  subtasks: ProjectTask[]
  created_at?: string
  updated_at?: string
}

interface TaskComment {
  id: string
  user_id: string
  user_name: string
  text: string
  attachments: ProjectAsset[]
  created_at: string
}

interface ProjectNote {
  id: string
  title: string
  content: string
  type: 'text' | 'markdown' | 'checklist' | 'whiteboard'
  author_id: string
  author_name: string
  is_pinned: boolean
  tags: string[]
  attachments: ProjectAsset[]
  created_at?: string
  updated_at?: string
}

interface ProjectAsset {
  id: string
  name: string
  type: 'image' | 'document' | 'audio' | 'other'
  file_url: string
  file_size: number
  thumbnail_url?: string
  description?: string
  uploaded_by: string
  uploaded_at?: string
}

interface TimelineEvent {
  id: string
  type: 'task_created' | 'task_completed' | 'video_uploaded' | 'video_enhanced' | 'comment_added' | 'member_added' | 'milestone_reached'
  title: string
  description: string
  user_id: string
  user_name: string
  metadata?: Record<string, any>
  created_at: string
}

interface TeamAnalytics {
  overview: {
    total_projects: number
    active_projects: number
    total_members: number
    active_members: number
    storage_used: number
    total_videos: number
    processing_hours: number
  }
  productivity: {
    projects_completed_this_month: number
    average_project_duration: number
    task_completion_rate: number
    on_time_delivery_rate: number
    member_productivity_scores: Array<{
      user_id: string
      user_name: string
      score: number
      projects_completed: number
      tasks_completed: number
    }>
  }
  usage: {
    api_calls: number
    bandwidth_used: number
    processing_minutes: number
    storage_growth: Array<{ date: string; usage: number }>
  }
  financial: {
    current_mrr: number
    projected_mrr: number
    cost_per_project: number
    roi_score: number
  }
}

export class TeamCollaborationService {
  // Team Management
  static async createTeam(teamData: Omit<Team, 'id' | 'created_at' | 'updated_at'>, creatorId: string): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          owner_id: creatorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as team owner
      await this.addTeamMember(data.id, creatorId, 'owner', creatorId)

      // Track activity
      await ActivityTrackingService.trackActivity({
        activity_type: 'team_created',
        activity_data: {
          team_id: data.id,
          team_name: teamData.name
        },
        user_id: creatorId
      })

      return data
    } catch (error) {
      console.error('Failed to create team:', error)
      throw new Error('Unable to create team')
    }
  }

  static async inviteTeamMember(teamId: string, email: string, role: TeamMember['role'], invitedBy: string): Promise<void> {
    try {
      // Check if user exists
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (!user) {
        // Send invitation email and create pending member
        await this.sendTeamInvitation(teamId, email, role, invitedBy)
      } else {
        // Add existing user to team
        await this.addTeamMember(teamId, user.id, role, invitedBy)
      }

      // Track activity
      await ActivityTrackingService.trackActivity({
        activity_type: 'team_member_invited',
        activity_data: {
          team_id: teamId,
          email: email,
          role: role
        },
        user_id: invitedBy
      })
    } catch (error) {
      console.error('Failed to invite team member:', error)
      throw new Error('Unable to invite team member')
    }
  }

  static async addTeamMember(teamId: string, userId: string, role: TeamMember['role'], addedBy: string): Promise<TeamMember> {
    try {
      const permissions = this.getRolePermissions(role)

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          permissions: permissions,
          status: 'active',
          joined_at: new Date().toISOString()
        })
        .select(`
          *,
          users(id, email, display_name, avatar_url)
        `)
        .single()

      if (error) throw error

      const memberData: TeamMember = {
        ...data,
        profile: {
          display_name: data.users?.display_name || '',
          email: data.users?.email || '',
          avatar_url: data.users?.avatar_url
        }
      }

      return memberData
    } catch (error) {
      console.error('Failed to add team member:', error)
      throw new Error('Unable to add team member')
    }
  }

  // Project Management
  static async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>, creatorId: string): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          owner_id: creatorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Create initial timeline event
      await this.createTimelineEvent(data.id, 'project_created', 'Project created', creatorId)

      // Track activity
      await ActivityTrackingService.trackActivity({
        activity_type: 'project_created',
        activity_data: {
          project_id: data.id,
          project_name: projectData.name,
          team_id: projectData.team_id
        },
        user_id: creatorId
      })

      return data
    } catch (error) {
      console.error('Failed to create project:', error)
      throw new Error('Unable to create project')
    }
  }

  static async uploadProjectVideo(projectId: string, videoData: Omit<ProjectVideo, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectVideo> {
    try {
      // Initialize video processing
      await this.initializeVideoProcessing(videoData.file_url, videoData.enhancement_settings)

      const { data, error } = await supabase
        .from('project_videos')
        .insert({
          ...videoData,
          processing_status: 'uploading',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Create timeline event
      await this.createTimelineEvent(projectId, 'video_uploaded', `Video "${videoData.name}" uploaded`, videoData.uploaded_by)

      // Track activity
      await ActivityTrackingService.trackActivity({
        activity_type: 'video_uploaded',
        activity_data: {
          video_id: data.id,
          project_id: projectId,
          video_name: videoData.name,
          file_size: videoData.file_size
        },
        user_id: videoData.uploaded_by
      })

      return data
    } catch (error) {
      console.error('Failed to upload project video:', error)
      throw new Error('Unable to upload video')
    }
  }

  static async addVideoComment(videoId: string, commentData: Omit<VideoComment, 'id' | 'created_at' | 'replies'>): Promise<VideoComment> {
    try {
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          ...commentData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Get video info for activity tracking
      const { data: video } = await supabase
        .from('project_videos')
        .select('project_id, name')
        .eq('id', videoId)
        .single()

      // Track activity
      await ActivityTrackingService.trackActivity({
        activity_type: 'comment_added',
        activity_data: {
          video_id: videoId,
          project_id: video?.project_id,
          video_name: video?.name,
          comment_type: commentData.type
        },
        user_id: commentData.user_id
      })

      return data
    } catch (error) {
      console.error('Failed to add video comment:', error)
      throw new Error('Unable to add comment')
    }
  }

  static async createProjectTask(projectId: string, taskData: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectTask> {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Create timeline event
      await this.createTimelineEvent(projectId, 'task_created', `Task "${taskData.title}" created`, taskData.creator_id)

      // Track activity
      await ActivityTrackingService.trackActivity({
        activity_type: 'task_created',
        activity_data: {
          task_id: data.id,
          project_id: projectId,
          task_title: taskData.title,
          task_type: taskData.type,
          assignee_id: taskData.assignee_id
        },
        user_id: taskData.creator_id
      })

      return data
    } catch (error) {
      console.error('Failed to create project task:', error)
      throw new Error('Unable to create task')
    }
  }

  static async updateTaskStatus(taskId: string, status: ProjectTask['status'], userId: string): Promise<ProjectTask> {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
          ...(status === 'done' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', taskId)
        .select(`
          *,
          project_id,
          title
        `)
        .single()

      if (error) throw error

      // Create timeline event
      if (status === 'done') {
        await this.createTimelineEvent(data.project_id, 'task_completed', `Task "${data.title}" completed`, userId)
      }

      // Track activity
      await ActivityTrackingService.trackActivity({
        activity_type: 'task_updated',
        activity_data: {
          task_id: taskId,
          project_id: data.project_id,
          task_title: data.title,
          new_status: status
        },
        user_id: userId
      })

      return data
    } catch (error) {
      console.error('Failed to update task status:', error)
      throw new Error('Unable to update task status')
    }
  }

  // Analytics and Reporting
  static async getTeamAnalytics(teamId: string, dateRange?: { start: string; end: string }): Promise<TeamAnalytics> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = dateRange?.end || new Date().toISOString()

      // Get overview metrics
      const overview = await this.getTeamOverviewMetrics(teamId, startDate, endDate)

      // Get productivity metrics
      const productivity = await this.getProductivityMetrics(teamId, startDate, endDate)

      // Get usage metrics
      const usage = await this.getUsageMetrics(teamId, startDate, endDate)

      // Get financial metrics
      const financial = await this.getFinancialMetrics(teamId, startDate, endDate)

      return {
        overview,
        productivity,
        usage,
        financial
      }
    } catch (error) {
      console.error('Failed to get team analytics:', error)
      throw new Error('Unable to retrieve team analytics')
    }
  }

  static async getProjectAnalytics(projectId: string): Promise<{
    overview: {
      total_videos: number
      total_tasks: number
      completed_tasks: number
      team_size: number
      project_duration: number
      storage_used: number
    }
    timeline: TimelineEvent[]
    productivity: {
      task_completion_rate: number
      average_task_duration: number
      video_processing_efficiency: number
      collaboration_score: number
    }
    collaboration: {
      comments_per_video: number
      review_cycles_per_video: number
      member_contributions: Array<{
        user_id: string
        user_name: string
        videos_uploaded: number
        tasks_completed: number
        comments_added: number
      }>
    }
  }> {
    try {
      // Get project overview
      const overview = await this.getProjectOverviewMetrics(projectId)

      // Get project timeline
      const timeline = await this.getProjectTimeline(projectId)

      // Get productivity metrics
      const productivity = await this.getProjectProductivityMetrics(projectId)

      // Get collaboration metrics
      const collaboration = await this.getCollaborationMetrics(projectId)

      return {
        overview,
        timeline,
        productivity,
        collaboration
      }
    } catch (error) {
      console.error('Failed to get project analytics:', error)
      throw new Error('Unable to retrieve project analytics')
    }
  }

  // Real-time Collaboration
  static async subscribeToProjectUpdates(projectId: string, callback: (event: any) => void): Promise<() => void> {
    try {
      const channel = supabase
        .channel(`project_${projectId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${projectId}`
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_videos',
          filter: `project_id=eq.${projectId}`
        }, callback)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'video_comments',
          filter: `video_id=in.(select id from project_videos where project_id=eq.${projectId})`
        }, callback)
        .subscribe()

      // Return unsubscribe function
      return () => {
        channel.unsubscribe()
      }
    } catch (error) {
      console.error('Failed to subscribe to project updates:', error)
      return () => {}
    }
  }

  // Search and Discovery
  static async searchTeamContent(teamId: string, query: string, filters?: {
    type?: 'project' | 'video' | 'task' | 'note'
    date_range?: { start: string; end: string }
    assignee_id?: string
    tags?: string[]
  }): Promise<{
    projects: Project[]
    videos: ProjectVideo[]
    tasks: ProjectTask[]
    notes: ProjectNote[]
  }> {
    try {
      // Search projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .ilike('name', `%${query}%`)
        .or(`description.ilike.%${query}%`)

      // Search videos
      const { data: videos } = await supabase
        .from('project_videos')
        .select(`
          *,
          projects!inner(team_id)
        `)
        .eq('projects.team_id', teamId)
        .ilike('name', `%${query}%`)

      // Search tasks
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select(`
          *,
          projects!inner(team_id)
        `)
        .eq('projects.team_id', teamId)
        .ilike('title', `%${query}%`)
        .or(`description.ilike.%${query}%`)

      // Search notes
      const { data: notes } = await supabase
        .from('project_notes')
        .select(`
          *,
          projects!inner(team_id)
        `)
        .eq('projects.team_id', teamId)
        .ilike('title', `%${query}%`)
        .or(`content.ilike.%${query}%`)

      return {
        projects: projects || [],
        videos: videos || [],
        tasks: tasks || [],
        notes: notes || []
      }
    } catch (error) {
      console.error('Failed to search team content:', error)
      return {
        projects: [],
        videos: [],
        tasks: [],
        notes: []
      }
    }
  }

  // Helper methods
  private static getRolePermissions(role: TeamMember['role']): TeamMember['permissions'] {
    const permissions = {
      owner: {
        can_create_projects: true,
        can_delete_projects: true,
        can_invite_members: true,
        can_manage_billing: true,
        can_view_analytics: true,
        can_manage_settings: true
      },
      admin: {
        can_create_projects: true,
        can_delete_projects: true,
        can_invite_members: true,
        can_manage_billing: false,
        can_view_analytics: true,
        can_manage_settings: true
      },
      member: {
        can_create_projects: true,
        can_delete_projects: false,
        can_invite_members: false,
        can_manage_billing: false,
        can_view_analytics: true,
        can_manage_settings: false
      },
      viewer: {
        can_create_projects: false,
        can_delete_projects: false,
        can_invite_members: false,
        can_manage_billing: false,
        can_view_analytics: false,
        can_manage_settings: false
      }
    }

    return permissions[role] || permissions.viewer
  }

  private static async sendTeamInvitation(teamId: string, email: string, role: TeamMember['role'], invitedBy: string): Promise<void> {
    // Implementation for sending team invitation email
    console.log(`Sending invitation to ${email} for team ${teamId} with role ${role}`)
  }

  private static async initializeVideoProcessing(fileUrl: string, settings: any): Promise<void> {
    // Initialize video processing with enhancement settings
    console.log(`Initializing video processing for ${fileUrl} with settings:`, settings)
  }

  private static async createTimelineEvent(projectId: string, type: TimelineEvent['type'], description: string, userId: string, metadata?: Record<string, any>): Promise<TimelineEvent> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .single()

      const { data, error } = await supabase
        .from('timeline_events')
        .insert({
          project_id: projectId,
          type: type,
          title: description,
          description: description,
          user_id: userId,
          user_name: user?.display_name || 'Unknown User',
          metadata: metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to create timeline event:', error)
      throw error
    }
  }

  // Analytics helper methods
  private static async getTeamOverviewMetrics(teamId: string, startDate: string, endDate: string): Promise<TeamAnalytics['overview']> {
    try {
      const [
        { data: projects },
        { data: members },
        { data: videos }
      ] = await Promise.all([
        supabase.from('projects').select('id, status').eq('team_id', teamId),
        supabase.from('team_members').select('user_id').eq('team_id', teamId).eq('status', 'active'),
        supabase.from('project_videos').select('id, file_size').eq('projects.team_id', teamId)
      ])

      const totalProjects = projects?.length || 0
      const activeProjects = projects?.filter(p => p.status === 'in_progress').length || 0
      const totalMembers = members?.length || 0
      const totalVideos = videos?.length || 0
      const storageUsed = videos?.reduce((sum, v) => sum + (v.file_size || 0), 0) || 0

      return {
        total_projects: totalProjects,
        active_projects: activeProjects,
        total_members: totalMembers,
        active_members: totalMembers, // Simplified - would calculate from recent activity
        storage_used: storageUsed,
        total_videos: totalVideos,
        processing_hours: totalVideos * 2 // Mock calculation
      }
    } catch (error) {
      console.error('Failed to get team overview metrics:', error)
      return {
        total_projects: 0,
        active_projects: 0,
        total_members: 0,
        active_members: 0,
        storage_used: 0,
        total_videos: 0,
        processing_hours: 0
      }
    }
  }

  private static async getProductivityMetrics(teamId: string, startDate: string, endDate: string): Promise<TeamAnalytics['productivity']> {
    // Mock implementation - would calculate actual productivity metrics
    return {
      projects_completed_this_month: 5,
      average_project_duration: 7, // days
      task_completion_rate: 0.85,
      on_time_delivery_rate: 0.78,
      member_productivity_scores: []
    }
  }

  private static async getUsageMetrics(teamId: string, startDate: string, endDate: string): Promise<TeamAnalytics['usage']> {
    // Mock implementation - would calculate actual usage metrics
    return {
      api_calls: 15000,
      bandwidth_used: 5000000000, // bytes
      processing_minutes: 1200,
      storage_growth: []
    }
  }

  private static async getFinancialMetrics(teamId: string, startDate: string, endDate: string): Promise<TeamAnalytics['financial']> {
    // Mock implementation - would calculate actual financial metrics
    return {
      current_mrr: 299,
      projected_mrr: 399,
      cost_per_project: 50,
      roi_score: 3.2
    }
  }

  private static async getProjectOverviewMetrics(projectId: string): Promise<any> {
    // Mock implementation for project overview metrics
    return {
      total_videos: 10,
      total_tasks: 25,
      completed_tasks: 20,
      team_size: 5,
      project_duration: 14, // days
      storage_used: 5000000000 // bytes
    }
  }

  private static async getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50)

      return data || []
    } catch (error) {
      console.error('Failed to get project timeline:', error)
      return []
    }
  }

  private static async getProjectProductivityMetrics(projectId: string): Promise<any> {
    // Mock implementation for project productivity metrics
    return {
      task_completion_rate: 0.8,
      average_task_duration: 48, // hours
      video_processing_efficiency: 0.92,
      collaboration_score: 0.85
    }
  }

  private static async getCollaborationMetrics(projectId: string): Promise<any> {
    // Mock implementation for collaboration metrics
    return {
      comments_per_video: 3.5,
      review_cycles_per_video: 1.2,
      member_contributions: []
    }
  }
}

// Hook for team collaboration
export function useTeamCollaboration(teamId?: string) {
  const [team, setTeam] = useState<Team | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null)
  const [loading, setLoading] = useState(false)

  const loadTeamData = async () => {
    if (!teamId) return

    setLoading(true)
    try {
      // Load team info
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamData) {
        setTeam(teamData)
      }

      // Load projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false })

      setProjects(projectsData || [])

      // Load members
      const { data: membersData } = await supabase
        .from('team_members')
        .select(`
          *,
          users(id, email, display_name, avatar_url)
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')

      const formattedMembers = membersData?.map(member => ({
        ...member,
        profile: {
          display_name: member.users?.display_name || '',
          email: member.users?.email || '',
          avatar_url: member.users?.avatar_url
        }
      })) || []

      setMembers(formattedMembers)

      // Load analytics
      const analyticsData = await TeamCollaborationService.getTeamAnalytics(teamId)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Failed to load team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (!teamId) return

    const userId = 'current_user_id' // Mock user ID
    const newProject = await TeamCollaborationService.createProject(projectData, userId)
    setProjects(prev => [newProject, ...prev])

    return newProject
  }

  const inviteMember = async (email: string, role: TeamMember['role']) => {
    if (!teamId) return

    const userId = 'current_user_id' // Mock user ID
    await TeamCollaborationService.inviteTeamMember(teamId, email, role, userId)
    await loadTeamData() // Refresh members list
  }

  useEffect(() => {
    if (teamId) {
      loadTeamData()
    }
  }, [teamId])

  return {
    team,
    projects,
    members,
    analytics,
    loading,
    loadTeamData,
    createProject,
    inviteMember
  }
}