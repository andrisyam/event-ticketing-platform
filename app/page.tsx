import Link from 'next/link'
import { ArrowRight, Calendar, Shield, Zap, Users, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/navigation/header'
import { Footer } from '@/components/navigation/footer'
import { HeroSearch } from '@/components/events/hero-search'
import { CategoryGrid } from '@/components/events/category-grid'
import { EventCard } from '@/components/events/event-card'
import { createClient } from '@/lib/supabase/server'
import type { Event, EventCategory, Profile } from '@/lib/types'
import { getUser } from '@/lib/auth'

async function getCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_categories')
    .select('*')
    .order('name')
  return data || []
}

async function getFeaturedEvents(): Promise<Event[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*)
    `)
    .eq('status', 'PUBLISHED')
    .eq('is_featured', true)
    .gte('event_start', new Date().toISOString())
    .order('event_start', { ascending: true })
    .limit(4)
  return data || []
}

async function getUpcomingEvents(): Promise<Event[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*)
    `)
    .eq('status', 'PUBLISHED')
    .gte('event_start', new Date().toISOString())
    .order('event_start', { ascending: true })
    .limit(8)
  return data || []
}

const features = [
  {
    icon: Zap,
    title: 'Pembelian Cepat',
    description: 'Proses pembelian tiket yang mudah dan cepat dalam hitungan menit.',
  },
  {
    icon: Shield,
    title: 'Pembayaran Aman',
    description: 'Transaksi aman dengan berbagai metode pembayaran terpercaya.',
  },
  {
    icon: Calendar,
    title: 'E-Ticket Instan',
    description: 'Dapatkan e-ticket dengan QR code langsung ke email Anda.',
  },
  {
    icon: Users,
    title: 'Multi-User',
    description: 'Dukung berbagai jenis pengguna: peserta, organizer, dan admin.',
  },
]

const stats = [
  { value: '10K+', label: 'Event Terselenggara' },
  { value: '500K+', label: 'Tiket Terjual' },
  { value: '1K+', label: 'Organizer Aktif' },
  { value: '50+', label: 'Kota di Indonesia' },
]

export default async function HomePage() {
  const [user, categories, featuredEvents, upcomingEvents] = await Promise.all([
    getUser(),
    getCategories(),
    getFeaturedEvents(),
    getUpcomingEvents(),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 sm:py-24">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Temukan <span className="text-primary">Event Seru</span>
                <br />
                di Seluruh <span className="text-accent">Indonesia</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
                Platform ticketing dan manajemen event terlengkap. 
                Cari event menarik, beli tiket online, dan nikmati pengalaman tak terlupakan.
              </p>
              <div className="mt-10">
                <HeroSearch />
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  E-Ticket Instan
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Pembayaran Aman
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  24/7 Support
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-muted/30 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Jelajahi Kategori
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Temukan event sesuai minat Anda
                </p>
              </div>
            </div>
            <CategoryGrid categories={categories} />
          </div>
        </section>

        {/* Featured Events Section */}
        {featuredEvents.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-accent fill-accent" />
                    <span className="text-sm font-medium text-accent">Event Pilihan</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                    Event Unggulan
                  </h2>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/events?featured=true" className="flex items-center gap-1">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="featured" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Events Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Event Mendatang
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Jangan lewatkan event-event seru berikut ini
                </p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/events" className="flex items-center gap-1">
                  Lihat Semua
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Belum Ada Event</h3>
                <p className="mt-2 text-muted-foreground">
                  Event akan segera hadir. Tetap pantau halaman ini!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Kenapa Pilih Nusa EventHub?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Platform terpercaya untuk mengelola dan menemukan event terbaik di Indonesia
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="relative rounded-xl bg-card p-6 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-6 py-12 sm:px-12 sm:py-16">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col items-center text-center lg:flex-row lg:text-left lg:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
                    Siap Menjadi Organizer?
                  </h2>
                  <p className="mt-4 text-primary-foreground/80">
                    Buat dan kelola event Anda sendiri dengan mudah. 
                    Dapatkan akses ke dashboard lengkap, analitik, dan fitur ticketing terbaik.
                  </p>
                </div>
                <div className="mt-8 lg:mt-0 lg:ml-8 flex flex-col sm:flex-row gap-4">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/auth/signup?role=organizer">
                      Daftar Sebagai Organizer
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link href="/how-it-works">
                      Pelajari Lebih Lanjut
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
