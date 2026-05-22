import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Search, Filter, Eye, CheckCircle, XCircle, MoreVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Event } from '@/lib/types'
import { AdminSidebar } from '../sidebar'
import { EventActions } from './event-actions'
import Image from 'next/image'
import { getUser } from '@/lib/auth'

interface PageProps {
  searchParams: Promise<{
    status?: string
    q?: string
  }>
}

async function getEvents(status?: string, search?: string): Promise<Event[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      organizer:profiles(id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (status === 'pending') {
    query = query.eq('status', 'PENDING_APPROVAL')
  } else if (status) {
    query = query.eq('status', status.toUpperCase())
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data } = await query
  return data || []
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/admin/events')
  }

  if (user.role !== 'ADMIN') {
    redirect('/')
  }

  const events = await getEvents(params.status, params.q)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
    PENDING_APPROVAL: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'Disetujui', color: 'bg-blue-100 text-blue-800' },
    PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
    CLOSED: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800' },
    FINISHED: { label: 'Selesai', color: 'bg-gray-100 text-gray-800' },
    CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
  }

  const statusFilters = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'rejected', label: 'Ditolak' },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar user={user} />

      <div className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Manajemen Event</h1>
            <p className="text-muted-foreground">
              Review dan kelola semua event di platform
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Cari event..."
                  defaultValue={params.q}
                  className="pl-10"
                />
              </div>
              <select
                name="status"
                defaultValue={params.status}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <Button type="submit">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </form>
          </div>

          {/* Events List */}
          {events.length > 0 ? (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Event Image */}
                      <div className="relative md:w-48 h-32 md:h-auto bg-muted flex-shrink-0">
                        {event.banner_image ? (
                          <Image
                            src={event.banner_image}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <Calendar className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 p-4 md:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <Badge className={statusLabels[event.status]?.color || ''}>
                            {statusLabels[event.status]?.label || event.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/events/${event.slug}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat Event
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <h3 className="font-semibold text-lg text-foreground mb-1">
                          {event.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-3">
                          by {event.organizer?.full_name || 'Unknown'} ({event.organizer?.email})
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <span>{formatDate(event.event_start)}</span>
                          <span>{event.city || 'Online'}</span>
                          <span>{formatPrice(event.price)}</span>
                        </div>

                        {event.status === 'PENDING_APPROVAL' && (
                          <EventActions eventId={event.id} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Tidak Ada Event</h3>
                <p className="mt-2 text-muted-foreground">
                  {params.status || params.q
                    ? 'Tidak ada event yang sesuai dengan filter'
                    : 'Belum ada event yang dibuat'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
