import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrganizerSidebar } from "./sidebar"

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login?redirect=/organizer")
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (!profile || (profile.role !== "ORGANIZER" && profile.role !== "ADMIN")) {
    redirect("/?error=not_organizer")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <OrganizerSidebar />
        <main className="flex-1 lg:ml-64">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
