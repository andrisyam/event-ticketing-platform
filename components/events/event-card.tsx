import Link from 'next/link'
import { Calendar, MapPin, Users, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@/lib/types'

interface EventCardProps {
  event: Event
  variant?: 'default' | 'featured'
}

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short',
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
      maximumFractionDigits: 0,
    }).format(price)
  }

  const isFeatured = variant === 'featured' || event.is_featured

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isFeatured ? 'border-accent' : ''}`}>
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {event.banner_image ? (
            <img
              src={event.banner_image}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Calendar className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          {/* Featured Badge */}
          {isFeatured && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
          {/* Price Badge */}
          <Badge
            variant={event.price === 0 ? 'secondary' : 'default'}
            className="absolute top-3 right-3"
          >
            {formatPrice(event.price)}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Category */}
          {event.category && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Tag className="h-3 w-3" />
              <span>{event.category.name}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Date & Location */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>{formatDate(event.event_start)}</span>
            </div>
            {event.city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 text-accent" />
                <span className="truncate">{event.city}</span>
              </div>
            )}
            {event.capacity && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{event.capacity} kuota</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
