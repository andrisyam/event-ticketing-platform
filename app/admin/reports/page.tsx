"use server"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Ticket
} from "lucide-react"

export default async function AdminReportsPage() {
  const supabase = await createClient()

  // Get statistics
  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalTickets },
    { data: revenueData }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "PAID"),
    supabase.from("payments").select("amount").eq("status", "SUCCESS")
  ])

  const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  // Get events by status
  const { data: eventsByStatus } = await supabase
    .from("events")
    .select("status")

  const statusCounts: Record<string, number> = {}
  eventsByStatus?.forEach(e => {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1
  })

  // Get recent registrations
  const { data: recentRegistrations } = await supabase
    .from("registrations")
    .select(`
      id,
      created_at,
      event:events(title),
      user:profiles(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get monthly stats (last 6 months)
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const { data: monthlyTickets } = await supabase
    .from("tickets")
    .select("created_at, price")
    .gte("created_at", sixMonthsAgo.toISOString())
    .eq("status", "PAID")

  const monthlyData: { month: string; tickets: number; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toLocaleDateString("id-ID", { month: "short", year: "numeric" })
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthTickets = monthlyTickets?.filter(t => {
      const ticketDate = new Date(t.created_at)
      return ticketDate >= monthStart && ticketDate <= monthEnd
    }) || []

    monthlyData.push({
      month: monthKey,
      tickets: monthTickets.length,
      revenue: monthTickets.reduce((sum, t) => sum + (t.price || 0), 0)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Laporan & Statistik
        </h1>
        <p className="text-muted-foreground mt-1">
          Analisis performa platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Terdaftar di platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Event</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Event dibuat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tiket Terjual</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tiket dibayar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Dari pembayaran berhasil
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Event berdasarkan Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(count / (totalEvents || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trend 6 Bulan Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-20">{data.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {data.tickets} tiket
                    </span>
                    <span className="text-sm font-medium w-24 text-right">
                      Rp {data.revenue.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendaftaran Terbaru</CardTitle>
          <CardDescription>10 pendaftaran terakhir di platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRegistrations?.map((reg) => (
              <div 
                key={reg.id} 
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {(reg.user as { full_name?: string })?.full_name || (reg.user as { email?: string })?.email || "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(reg.event as { title?: string })?.title || "Unknown Event"}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(reg.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            ))}

            {(!recentRegistrations || recentRegistrations.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                Belum ada pendaftaran
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
