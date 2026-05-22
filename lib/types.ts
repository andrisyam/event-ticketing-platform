export type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN'
export type EventStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'CLOSED' | 'FINISHED' | 'CANCELLED'
export type TicketStatus = 'UNPAID' | 'PAID' | 'CANCELLED' | 'CHECKED_IN' | 'REFUNDED'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  gender: string | null
  date_of_birth: string | null
  identity_number: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface EventCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: string
}

export interface Event {
  id: string
  organizer_id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  banner_image: string | null
  venue: string | null
  city: string | null
  address: string | null
  maps_url: string | null
  capacity: number | null
  price: number
  registration_open: string | null
  registration_close: string | null
  event_start: string
  event_end: string | null
  status: EventStatus
  is_featured: boolean
  rejection_notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: EventCategory
  organizer?: Profile
  tickets_count?: number
}

export interface Ticket {
  id: string
  event_id: string
  user_id: string
  ticket_number: string
  qr_code: string | null
  status: TicketStatus
  price: number
  purchased_at: string | null
  checked_in_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  event?: Event
  user?: Profile
}

export interface Payment {
  id: string
  ticket_id: string
  user_id: string
  amount: number
  payment_method: string | null
  payment_gateway: string | null
  external_id: string | null
  status: PaymentStatus
  paid_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  ticket?: Ticket
}

export interface Registration {
  id: string
  event_id: string
  user_id: string
  ticket_id: string | null
  form_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Joined fields
  event?: Event
  ticket?: Ticket
}
