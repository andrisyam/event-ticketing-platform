import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Calendar, Users, Ticket, Shield, BarChart3,
  TrendingUp, CheckCircle, XCircle, Clock, ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Event } from '@/lib/types'
import { AdminSidebar } from './sidebar'

async function getUser(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

async function getAdminStats() {
  const supabase = await createClient()
  
  // Get total users
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get total events
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })

  // Get pending events
  const { count: pendingCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING_APPROVAL')

  // Get total tickets sold
  const { count: ticketCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('status', ['PAID', 'CHECKED_IN'])

  // Get total revenue
  const { data: tickets } = await supabase
    .from('tickets')
    .select('price')
    .in('status', ['PAID', 'CHECKED_IN'])
  
  const revenue = tickets?.reduce((sum, t) => sum + Number(t.price), 0) || 0

  return {
    users: userCount || 0,
    events: eventCount || 0,
    pending: pendingCount || 0,
    tickets: ticketCount || 0,
    revenue,
  }
}

async function getPendingEvents(): Promise<Event[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      organizer:profiles(id, full_name, email)
    `)
    .eq('status', 'PENDING_APPROVAL')
    .order('created_at', { ascending: true })
    .limit(5)
  
  return data || []
}

async function getRecentUsers(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  return data || []
}

export default async function AdminDashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/admin')
  }

  if (user.role !== 'ADMIN') {
    redirect('/')
  }

  const [stats, pendingEvents, recentUsers] = await Promise.all([
    getAdminStats(),
    getPendingEvents(),
    getRecentUsers(),
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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar user={user} />

      <div className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Kelola platform Nusa EventHub
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total User</p>
                    <p className="text-2xl font-bold text-foreground">{stats.users}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Event</p>
                    <p className="text-2xl font-bold text-foreground">{stats.events}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={stats.pending > 0 ? 'border-yellow-300' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                    <Clock className="h-5 w-5" />
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Ticket className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(stats.revenue)}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Events */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Event Menunggu Review</CardTitle>
                  <CardDescription>Event yang perlu disetujui</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/events?status=pending">
                    Lihat Semua
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pendingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {pendingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            by {event.organizer?.full_name || 'Unknown'} • {formatDate(event.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500/50" />
                    <p className="mt-2 text-muted-foreground">Tidak ada event yang pending</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Terbaru</CardTitle>
                  <CardDescription>Pendaftaran user terbaru</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/users">
                    Lihat Semua
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentUsers.length > 0 ? (
                  <div className="space-y-4">
                    {recentUsers.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{profile.full_name || 'User'}</h4>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                          </div>
                        </div>
                        <Badge variant={profile.role === 'ADMIN' ? 'default' : profile.role === 'ORGANIZER' ? 'secondary' : 'outline'}>
                          {profile.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">Belum ada user</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
