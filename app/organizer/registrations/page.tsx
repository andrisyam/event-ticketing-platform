"use server"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Download, Search } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default async function RegistrationsPage({
  searchParams
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: selectedEventId } = await searchParams
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get organizer's events
  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false })

  // Get registrations for selected event
  let registrations: {
    id: string
    created_at: string
    ticket: {
      ticket_number: string
      status: string
      price: number
      checked_in_at: string | null
    } | null
    user: {
      full_name: string | null
      email: string
      phone: string | null
    }
  }[] = []

  if (selectedEventId) {
    const { data } = await supabase
      .from("registrations")
      .select(`
        id,
        created_at,
        ticket:tickets(ticket_number, status, price, checked_in_at),
        user:profiles(full_name, email, phone)
      `)
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false })

    registrations = (data || []) as typeof registrations
  }

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    CHECKED_IN: "bg-blue-100 text-blue-700",
    UNPAID: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Pendaftar
          </h1>
          <p className="text-muted-foreground mt-1">
            Lihat dan kelola pendaftar event Anda
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Peserta
          </CardTitle>
          <CardDescription>
            Pilih event untuk melihat daftar peserta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <form className="flex gap-2">
              <Select name="event" defaultValue={selectedEventId || ""}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Pilih event..." />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link 
                href={selectedEventId ? `/organizer/registrations?event=${selectedEventId}` : "#"}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                <Search className="h-4 w-4 mr-2" />
                Lihat
              </Link>
            </form>
          </div>

          {selectedEventId && registrations.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Total: {registrations.length} peserta
                </p>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Tiket</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Telepon</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Terdaftar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-mono text-sm">
                          {reg.ticket?.ticket_number || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {reg.user?.full_name || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {reg.user?.email}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {reg.user?.phone || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              statusColors[reg.ticket?.status || ""] || "bg-gray-100"
                            )}
                          >
                            {reg.ticket?.status || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {new Date(reg.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {selectedEventId && registrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Belum ada pendaftar
              </h3>
              <p className="text-muted-foreground mt-1">
                Belum ada yang mendaftar untuk event ini
              </p>
            </div>
          )}

          {!selectedEventId && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Pilih Event
              </h3>
              <p className="text-muted-foreground mt-1">
                Pilih event di atas untuk melihat daftar peserta
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
