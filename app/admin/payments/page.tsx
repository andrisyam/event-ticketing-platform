"use server"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      ticket:tickets(ticket_number, event:events(title)),
      user:profiles(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  // Calculate totals
  const successfulPayments = payments?.filter(p => p.status === "SUCCESS") || []
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingPayments = payments?.filter(p => p.status === "PENDING") || []
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  const statusColors: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    EXPIRED: "bg-gray-100 text-gray-700",
    REFUNDED: "bg-blue-100 text-blue-700"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Pembayaran
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor dan kelola semua pembayaran
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              {successfulPayments.length} pembayaran berhasil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              Rp {totalPending.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} pembayaran menunggu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Semua transaksi
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
          <CardDescription>100 transaksi terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="hidden md:table-cell">Pembayar</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.external_id || payment.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {(payment.ticket as { event?: { title?: string } })?.event?.title || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(payment.user as { full_name?: string })?.full_name || (payment.user as { email?: string })?.email || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      Rp {(payment.amount || 0).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn("text-xs", statusColors[payment.status] || "")}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </TableCell>
                  </TableRow>
                ))}

                {(!payments || payments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada transaksi pembayaran
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
