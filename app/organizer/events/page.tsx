import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, Search, Filter, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { OrganizerSidebar } from '../sidebar'
import Image from 'next/image'
import { getUser } from '@/lib/auth'

async function getEvents(organizerId: string): Promise<Event[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*)
    `)
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })
  
  return data || []
}

export default async function OrganizerEventsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/organizer/events')
  }

  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
    redirect('/')
  }

  const events = await getEvents(user.id)

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
    PENDING_APPROVAL: { label: 'Menunggu Approval', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'Disetujui', color: 'bg-blue-100 text-blue-800' },
    PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
    CLOSED: { label: 'Ditutup', color: 'bg-gray-100 text-gray-800' },
    FINISHED: { label: 'Selesai', color: 'bg-gray-100 text-gray-800' },
    CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
  }

  return (
    <div className="flex min-h-screen bg-background">
      <OrganizerSidebar user={user} />

      <div className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Event Saya</h1>
              <p className="text-muted-foreground">
                Kelola semua event yang Anda buat
              </p>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/organizer/events/create">
                <Plus className="h-4 w-4 mr-2" />
                Buat Event Baru
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari event..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Events List */}
          {events.length > 0 ? (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Event Image */}
                      <div className="md:w-48 h-32 md:h-auto bg-muted flex-shrink-0">
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
                              <DropdownMenuItem asChild>
                                <Link href={`/organizer/events/${event.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Event
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <h3 className="font-semibold text-lg text-foreground mb-2">
                          {event.title}
                        </h3>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <span>{formatDate(event.event_start)}</span>
                          <span>{event.city || 'Online'}</span>
                          <span>{formatPrice(event.price)}</span>
                          {event.capacity && <span>{event.capacity} kuota</span>}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/organizer/events/${event.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/organizer/events/${event.id}/attendees`}>
                              Peserta
                            </Link>
                          </Button>
                          {event.status === 'DRAFT' && (
                            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                              Submit untuk Review
                            </Button>
                          )}
                        </div>
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
                <h3 className="mt-4 text-lg font-medium text-foreground">Belum Ada Event</h3>
                <p className="mt-2 text-muted-foreground">
                  Mulai buat event pertama Anda sekarang!
                </p>
                <Button asChild className="mt-6">
                  <Link href="/organizer/events/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
