import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, Tag, Share2, Heart, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/navigation/header'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Event, Profile } from '@/lib/types'
import { RegisterButton } from './register-button'
import Image from 'next/image'
import { getUser } from '@/lib/auth'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getEvent(slug: string): Promise<Event | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*),
      organizer:profiles(id, full_name, email, avatar_url)
    `)
    .eq('slug', slug)
    .single()
  
  return data
}

async function getTicketCount(eventId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['PAID', 'CHECKED_IN'])
  
  return count || 0
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [user, event] = await Promise.all([
    getUser(),
    getEvent(slug),
  ])

  if (!event) {
    notFound()
  }

  const ticketsSold = await getTicketCount(event.id)
  const spotsLeft = event.capacity ? event.capacity - ticketsSold : null

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
      maximumFractionDigits: 0,
    }).format(price)
  }

  const isRegistrationOpen = () => {
    const now = new Date()
    if (event.registration_open && new Date(event.registration_open) > now) return false
    if (event.registration_close && new Date(event.registration_close) < now) return false
    if (new Date(event.event_start) < now) return false
    if (spotsLeft !== null && spotsLeft <= 0) return false
    return true
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1">
        {/* Hero Banner */}
        <div className="relative h-[300px] sm:h-[400px] bg-muted">
          {event.banner_image ? (
            <Image
              src={event.banner_image}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Calendar className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <Link
            href="/events"
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Kembali</span>
          </Link>

          {/* Share Button */}
          <button className="absolute top-4 right-4 p-2 rounded-lg bg-black/30 text-white hover:bg-black/50 transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {event.category && (
                      <Badge variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {event.category.name}
                      </Badge>
                    )}
                    {event.is_featured && (
                      <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                    )}
                    <Badge variant={event.price === 0 ? 'secondary' : 'default'}>
                      {formatPrice(event.price)}
                    </Badge>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    {event.title}
                  </h1>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tanggal</p>
                        <p className="font-medium">{formatDate(event.event_start)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Waktu</p>
                        <p className="font-medium">
                          {formatTime(event.event_start)}
                          {event.event_end && ` - ${formatTime(event.event_end)}`}
                        </p>
                      </div>
                    </div>

                    {event.venue && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lokasi</p>
                          <p className="font-medium">{event.venue}</p>
                          {event.address && (
                            <p className="text-sm text-muted-foreground">{event.address}, {event.city}</p>
                          )}
                          {event.maps_url && (
                            <a
                              href={event.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Lihat di Maps
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Tentang Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {event.description ? (
                      <div className="whitespace-pre-wrap">{event.description}</div>
                    ) : (
                      <p>Tidak ada deskripsi untuk event ini.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organizer */}
              {event.organizer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Penyelenggara</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
                        {event.organizer.full_name?.[0]?.toUpperCase() || 'O'}
                      </div>
                      <div>
                        <p className="font-medium">{event.organizer.full_name || 'Organizer'}</p>
                        <p className="text-sm text-muted-foreground">{event.organizer.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Registration Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border-primary/20">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground mb-1">Harga Tiket</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(event.price)}
                      </p>
                    </div>

                    {event.capacity && (
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Kuota</span>
                        </div>
                        <span className="font-medium">
                          {spotsLeft !== null ? (
                            spotsLeft > 0 ? `${spotsLeft} tersisa` : 'Habis'
                          ) : (
                            event.capacity
                          )}
                        </span>
                      </div>
                    )}

                    {event.registration_close && (
                      <div className="flex items-center justify-between py-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Batas Daftar</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatDate(event.registration_close)}
                        </span>
                      </div>
                    )}

                    <div className="mt-6 space-y-3">
                      <RegisterButton
                        eventId={event.id}
                        isLoggedIn={!!user}
                        isOpen={isRegistrationOpen()}
                        price={event.price}
                      />
                      <Button variant="outline" className="w-full">
                        <Heart className="h-4 w-4 mr-2" />
                        Simpan
                      </Button>
                    </div>

                    {!isRegistrationOpen() && (
                      <p className="mt-4 text-sm text-center text-muted-foreground">
                        {spotsLeft !== null && spotsLeft <= 0
                          ? 'Kuota tiket sudah habis'
                          : new Date(event.event_start) < new Date()
                          ? 'Event sudah berlangsung'
                          : 'Pendaftaran belum dibuka atau sudah ditutup'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
