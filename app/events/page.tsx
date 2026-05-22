import { Suspense } from 'react'
import { Search, SlidersHorizontal, Calendar } from 'lucide-react'
import { Header } from '@/components/navigation/header'
import { Footer } from '@/components/navigation/footer'
import { EventCard } from '@/components/events/event-card'
import { CategoryList } from '@/components/events/category-grid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Event, EventCategory, Profile } from '@/lib/types'
import { getUser } from '@/lib/auth'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    city?: string
    featured?: string
    page?: string
  }>
}

async function getCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_categories')
    .select('*')
    .order('name')
  return data || []
}

async function getEvents(params: {
  q?: string
  category?: string
  city?: string
  featured?: string
  page?: string
}): Promise<{ events: Event[]; total: number }> {
  const supabase = await createClient()
  const pageSize = 12
  const page = parseInt(params.page || '1')
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('events')
    .select(`
      *,
      category:event_categories(*)
    `, { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .gte('event_start', new Date().toISOString())
    .order('event_start', { ascending: true })

  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  if (params.category) {
    const { data: cat } = await supabase
      .from('event_categories')
      .select('id')
      .eq('slug', params.category)
      .single()
    if (cat) {
      query = query.eq('category_id', cat.id)
    }
  }

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }

  if (params.featured === 'true') {
    query = query.eq('is_featured', true)
  }

  const { data, count } = await query.range(offset, offset + pageSize - 1)
  
  return {
    events: data || [],
    total: count || 0,
  }
}

async function EventsContent({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  const params = await searchParams
  const [categories, { events, total }] = await Promise.all([
    getCategories(),
    getEvents(params),
  ])

  const pageSize = 12
  const currentPage = parseInt(params.page || '1')
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              name="q"
              placeholder="Cari event..."
              defaultValue={params.q}
              className="pl-10"
            />
          </div>
          <Input
            type="text"
            name="city"
            placeholder="Kota"
            defaultValue={params.city}
            className="sm:w-40"
          />
          <Button type="submit">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </form>

        <CategoryList categories={categories} selectedSlug={params.category} />
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Menampilkan {events.length} dari {total} event
          {params.q && ` untuk "${params.q}"`}
          {params.category && ` dalam kategori`}
        </p>
      </div>

      {/* Event Grid */}
      {events.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <a
                  key={page}
                  href={`/events?${new URLSearchParams({
                    ...params,
                    page: page.toString(),
                  }).toString()}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {page}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-xl">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Tidak Ada Event</h3>
          <p className="mt-2 text-muted-foreground">
            {params.q || params.category || params.city
              ? 'Coba ubah filter pencarian Anda'
              : 'Belum ada event yang tersedia saat ini'}
          </p>
        </div>
      )}
    </>
  )
}

export default async function EventsPage(props: PageProps) {
  const user = await getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Semua Event</h1>
            <p className="mt-2 text-muted-foreground">
              Temukan event menarik di seluruh Indonesia
            </p>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/5]" />
              ))}
            </div>
          }>
            <EventsContent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  )
}
