import Link from 'next/link'
import { Trophy, Presentation, Music, Wrench, Users, Award, PartyPopper, ChevronRight } from 'lucide-react'
import type { EventCategory } from '@/lib/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  presentation: Presentation,
  music: Music,
  wrench: Wrench,
  users: Users,
  award: Award,
  'party-popper': PartyPopper,
}

interface CategoryGridProps {
  categories: EventCategory[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {categories.map((category) => {
        const Icon = iconMap[category.icon || 'trophy'] || Trophy
        return (
          <Link
            key={category.id}
            href={`/events?category=${category.slug}`}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-7 w-7" />
            </div>
            <span className="text-sm font-medium text-center text-foreground group-hover:text-primary transition-colors">
              {category.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

interface CategoryListProps {
  categories: EventCategory[]
  selectedSlug?: string
}

export function CategoryList({ categories, selectedSlug }: CategoryListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/events"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !selectedSlug
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        Semua
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/events?category=${category.slug}`}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedSlug === category.slug
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  )
}
