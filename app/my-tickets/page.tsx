import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Ticket, QrCode, Download } from 'lucide-react'
import { Header } from '@/components/navigation/header'
import { Footer } from '@/components/navigation/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Ticket as TicketType } from '@/lib/types'

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

async function getMyTickets(userId: string): Promise<TicketType[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(
        id, title, slug, banner_image, venue, city, event_start, event_end
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return data || []
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  UNPAID: { label: 'Belum Bayar', variant: 'destructive' },
  PAID: { label: 'Aktif', variant: 'default' },
  CANCELLED: { label: 'Dibatalkan', variant: 'secondary' },
  CHECKED_IN: { label: 'Check-in', variant: 'outline' },
  REFUNDED: { label: 'Refund', variant: 'secondary' },
}

export default async function MyTicketsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/my-tickets')
  }

  const tickets = await getMyTickets(user.id)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Tiket Saya</h1>
            <p className="mt-2 text-muted-foreground">
              Kelola semua tiket event Anda
            </p>
          </div>

          {tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Event Image */}
                      <div className="sm:w-48 h-32 sm:h-auto bg-muted flex-shrink-0">
                        {ticket.event?.banner_image ? (
                          <img
                            src={ticket.event.banner_image}
                            alt={ticket.event.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <Ticket className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Ticket Info */}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <Badge variant={statusLabels[ticket.status]?.variant || 'default'}>
                            {statusLabels[ticket.status]?.label || ticket.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ticket.ticket_number}
                          </span>
                        </div>

                        <h3 className="font-semibold text-lg text-foreground mb-2">
                          {ticket.event?.title || 'Event'}
                        </h3>

                        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                          {ticket.event?.event_start && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span>
                                {formatDate(ticket.event.event_start)} - {formatTime(ticket.event.event_start)}
                              </span>
                            </div>
                          )}
                          {ticket.event?.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-accent" />
                              <span>{ticket.event.venue}, {ticket.event.city}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ticket.status === 'PAID' && (
                            <>
                              <Button size="sm" asChild>
                                <Link href={`/my-tickets/${ticket.id}`}>
                                  <QrCode className="h-4 w-4 mr-1" />
                                  Lihat QR Code
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </>
                          )}
                          {ticket.status === 'UNPAID' && (
                            <Button size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                              <Link href={`/checkout/${ticket.id}`}>
                                Bayar Sekarang
                              </Link>
                            </Button>
                          )}
                          {ticket.event?.slug && (
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/events/${ticket.event.slug}`}>
                                Detail Event
                              </Link>
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
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Belum Ada Tiket</h3>
                <p className="mt-2 text-muted-foreground">
                  Anda belum memiliki tiket. Jelajahi event dan daftarkan diri Anda!
                </p>
                <Button asChild className="mt-6">
                  <Link href="/events">Jelajahi Event</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
