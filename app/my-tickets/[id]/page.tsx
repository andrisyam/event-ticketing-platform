import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, ArrowLeft, Download, CheckCircle } from 'lucide-react'
import { Header } from '@/components/navigation/header'
import { Footer } from '@/components/navigation/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Profile, Ticket } from '@/lib/types'
import { QRCodeDisplay } from './qr-code'
import { getUser } from '@/lib/auth'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getTicket(ticketId: string, userId: string): Promise<Ticket | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(
        id, title, slug, banner_image, venue, city, address, event_start, event_end,
        organizer:profiles(full_name, email)
      )
    `)
    .eq('id', ticketId)
    .eq('user_id', userId)
    .single()
  
  return data
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/my-tickets')
  }

  const ticket = await getTicket(id, user.id)

  if (!ticket) {
    notFound()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <Link
            href="/my-tickets"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Tiket Saya
          </Link>

          {/* E-Ticket Card */}
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-primary p-6 text-primary-foreground">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-foreground/20">
                    <span className="text-sm font-bold">N</span>
                  </div>
                  <span className="font-semibold">Nusa EventHub</span>
                </div>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                  E-Ticket
                </Badge>
              </div>
              <h2 className="text-xl font-bold">{ticket.event?.title}</h2>
            </div>

            <CardContent className="p-6">
              {/* QR Code */}
              {ticket.status === 'PAID' || ticket.status === 'CHECKED_IN' ? (
                <div className="flex flex-col items-center mb-6">
                  <QRCodeDisplay value={ticket.ticket_number} />
                  <p className="mt-3 text-sm font-mono text-muted-foreground">
                    {ticket.ticket_number}
                  </p>
                  {ticket.status === 'CHECKED_IN' && (
                    <div className="flex items-center gap-2 mt-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Sudah Check-in</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 mb-6 bg-muted rounded-lg">
                  <p className="text-muted-foreground">
                    QR Code akan muncul setelah pembayaran selesai
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute left-0 right-0 border-t border-dashed border-border" />
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted/30" />
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted/30" />
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal & Waktu</p>
                    <p className="font-medium">{formatDate(ticket.event?.event_start || '')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(ticket.event?.event_start || '')}
                      {ticket.event?.event_end && ` - ${formatTime(ticket.event.event_end)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lokasi</p>
                    <p className="font-medium">{ticket.event?.venue}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.event?.address}, {ticket.event?.city}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nama Peserta</span>
                    <span className="font-medium">{user.full_name || user.email}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Harga Tiket</span>
                    <span className="font-medium">{formatPrice(ticket.price)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Button className="flex-1" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {ticket.event?.slug && (
                  <Button className="flex-1" asChild>
                    <Link href={`/events/${ticket.event.slug}`}>
                      Detail Event
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Petunjuk Penggunaan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Tunjukkan QR Code ini saat check-in di lokasi event.</p>
              <p>2. Pastikan layar HP Anda cukup terang untuk scan.</p>
              <p>3. Tiket ini hanya berlaku untuk 1 orang.</p>
              <p>4. Harap datang 30 menit sebelum event dimulai.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
