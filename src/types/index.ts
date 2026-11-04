export interface AdminProfile {
  id: string
  user_id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  slug: string
  title: string
  template_id: string
  status: 'draft' | 'published' | 'archived' | 'completed'
  bride_name: string
  groom_name: string
  bride_nick: string
  groom_nick: string
  bride_photo?: string
  groom_photo?: string
  bride_father?: string
  bride_mother?: string
  groom_father?: string
  groom_mother?: string
  bride_ig?: string
  groom_ig?: string
  akad_date?: string
  akad_time?: string
  akad_location?: string
  reception_date?: string
  reception_time?: string
  reception_location?: string
  address?: string
  maps_url?: string
  dress_code?: string
  notes?: string
  love_story?: string
  prewedding_photos?: string[]
  gallery?: string[]
  video_url?: string
  music_url?: string
  quote?: string
  cover_message?: string
  gift_bank_name?: string
  gift_account_number?: string
  gift_account_holder?: string
  gift_address?: string
  gift_recipient?: string
  gift_wa?: string
  published_at?: string
  created_at: string
  updated_at: string
  /** Runtime-only marker used by local template previews. */
  is_demo?: boolean
}

export interface EventTemplate {
  id: string
  name: string
  slug: string
  category: 'heritage' | 'premium'
  preview_image?: string
  description?: string
  demo_data?: Record<string, unknown>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  event_id: string
  name: string
  phone?: string
  email?: string
  category: 'family' | 'friend' | 'colleague' | 'other'
  group?: string
  invitation_link: string
  created_at: string
  updated_at: string
}

export interface Rsvp {
  id: string
  event_id: string
  guest_id?: string
  name: string
  attendance: 'yes' | 'no' | 'maybe'
  guest_count: number
  note?: string
  created_at: string
  updated_at: string
}

export interface Wish {
  id: string
  event_id: string
  guest_id?: string
  name: string
  message: string
  approved: boolean
  created_at: string
  updated_at: string
}

export interface Checkin {
  id: string
  event_id: string
  guest_id: string
  checked_in_at: string
}
