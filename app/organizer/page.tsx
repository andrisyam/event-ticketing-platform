import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Calendar, Ticket, Users, BarChart3, Settings, 
  Plus, ArrowUpRight, TrendingUp, Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Event } from '@/lib/types'
import { OrganizerSidebar } from './sidebar'
import Image from 'next/image'
import { getUser } from '@/lib/auth'

async function getDashboardStats(organizerId: string) {
  const supabase = await createClient()
  
  // Get event count
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', organizerId)

  // Get ticket count
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', organizerId)

  const eventIds = events?.map(e => e.id) || []
  
  let ticketCount = 0
  let revenue = 0
  
  if (eventIds.length > 0) {
    const { count, data: tickets } = await supabase
      .from('tickets')
      .select('price', { count: 'exact' })
      .in('event_id', eventIds)
      .in('status', ['PAID', 'CHECKED_IN'])
    
    ticketCount = count || 0
    revenue = tickets?.reduce((sum, t) => sum + Number(t.price), 0) || 0
  }

  // Get registration count
  let registrationCount = 0
  if (eventIds.length > 0) {
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .in('event_id', eventIds)
    registrationCount = count || 0
  }

  return {
    events: eventCount || 0,
    tickets: ticketCount,
    registrations: registrationCount,
    revenue,
  }
}

async function getRecentEvents(organizerId: string): Promise<Event[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*)
    `)
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  return data || []
}

export default async function OrganizerDashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/organizer')
  }

  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
    redirect('/')
  }

  const [stats, recentEvents] = await Promise.all([
    getDashboardStats(user.id),
    getRecentEvents(user.id),
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    FINISHED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  return (
    <div className="flex min-h-screen bg-background">
      <OrganizerSidebar user={user} />

      <div className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Selamat datang kembali, {user.full_name || 'Organizer'}!
              </p>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/organizer/events/create">
                <Plus className="h-4 w-4 mr-2" />
                Buat Event Baru
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Event</p>
                    <p className="text-2xl font-bold text-foreground">{stats.events}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiket Terjual</p>
                    <p className="text-2xl font-bold text-foreground">{stats.tickets}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Ticket className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Peserta</p>
                    <p className="text-2xl font-bold text-foreground">{stats.registrations}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendapatan</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.revenue)}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Event Terbaru</CardTitle>
                <CardDescription>Daftar event yang baru dibuat</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/organizer/events">
                  Lihat Semua
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {event.banner_image ? (
                            <Image
                              src={event.banner_image}
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.event_start)} • {event.city || 'Online'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[event.status] || ''}>
                          {event.status === 'PENDING_APPROVAL' ? 'Menunggu' : event.status}
                        </Badge>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/organizer/events/${event.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">Belum Ada Event</h3>
                  <p className="mt-2 text-muted-foreground">
                    Mulai buat event pertama Anda sekarang!
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/organizer/events/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Event
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
