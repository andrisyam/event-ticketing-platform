"use server"

import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/navigation/header"
import { Footer } from "@/components/navigation/footer"
import Link from "next/link"
import { 
  Trophy, 
  Presentation, 
  Music, 
  Wrench, 
  Users, 
  Award, 
  PartyPopper,
  Calendar 
} from "lucide-react"
import { getUser } from '@/lib/auth'

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-8 w-8" />,
  presentation: <Presentation className="h-8 w-8" />,
  music: <Music className="h-8 w-8" />,
  wrench: <Wrench className="h-8 w-8" />,
  users: <Users className="h-8 w-8" />,
  award: <Award className="h-8 w-8" />,
  "party-popper": <PartyPopper className="h-8 w-8" />,
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const user = await getUser()
  
  const { data: categories } = await supabase
    .from("event_categories")
    .select("*, events:events(count)")
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={user} />
      <main className="flex-1">
        <div className="bg-primary/5 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Kategori Event
            </h1>
            <p className="mt-2 text-muted-foreground text-pretty max-w-2xl">
              Jelajahi berbagai kategori event dan temukan yang sesuai dengan minat Anda
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories?.map((category) => (
              <Link 
                key={category.id} 
                href={`/events?category=${category.slug}`}
                className="group"
              >
                <div className="bg-card border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all duration-200">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {iconMap[category.icon] || <Calendar className="h-8 w-8" />}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-foreground">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {(!categories || categories.length === 0) && (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Belum ada kategori
              </h3>
              <p className="mt-1 text-muted-foreground">
                Kategori event akan ditampilkan di sini
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
