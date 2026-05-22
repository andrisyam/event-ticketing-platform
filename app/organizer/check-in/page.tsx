"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Camera, QrCode, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type CheckInResult = {
  success: boolean
  message: string
  ticket?: {
    ticket_number: string
    event_title: string
    attendee_name: string
    status: string
  }
}

export default function CheckInPage() {
  const [events, setEvents] = useState<{ id: string; title: string }[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [ticketCode, setTicketCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadStats()
    }
  }, [selectedEvent])

  async function loadEvents() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("events")
      .select("id, title")
      .eq("organizer_id", user.id)
      .in("status", ["PUBLISHED", "CLOSED"])
      .order("event_start", { ascending: false })

    if (data) {
      setEvents(data)
      if (data.length > 0) {
        setSelectedEvent(data[0].id)
      }
    }
  }

  async function loadStats() {
    const { data: tickets } = await supabase
      .from("tickets")
      .select("status")
      .eq("event_id", selectedEvent)
      .eq("status", "PAID")

    const { data: checkedIn } = await supabase
      .from("tickets")
      .select("status")
      .eq("event_id", selectedEvent)
      .eq("status", "CHECKED_IN")

    setStats({
      total: (tickets?.length || 0) + (checkedIn?.length || 0),
      checkedIn: checkedIn?.length || 0
    })
  }

  async function handleCheckIn() {
    if (!selectedEvent || !ticketCode.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      // Find the ticket
      const { data: ticket, error } = await supabase
        .from("tickets")
        .select(`
          *,
          event:events(title),
          user:profiles(full_name, email)
        `)
        .eq("event_id", selectedEvent)
        .or(`ticket_number.eq.${ticketCode.trim()},qr_code.eq.${ticketCode.trim()}`)
        .single()

      if (error || !ticket) {
        setResult({
          success: false,
          message: "Tiket tidak ditemukan"
        })
        return
      }

      if (ticket.status === "CHECKED_IN") {
        setResult({
          success: false,
          message: "Tiket sudah di check-in sebelumnya",
          ticket: {
            ticket_number: ticket.ticket_number,
            event_title: ticket.event?.title || "",
            attendee_name: ticket.user?.full_name || ticket.user?.email || "",
            status: ticket.status
          }
        })
        return
      }

      if (ticket.status !== "PAID") {
        setResult({
          success: false,
          message: `Status tiket: ${ticket.status}. Hanya tiket yang sudah dibayar dapat di check-in.`,
          ticket: {
            ticket_number: ticket.ticket_number,
            event_title: ticket.event?.title || "",
            attendee_name: ticket.user?.full_name || ticket.user?.email || "",
            status: ticket.status
          }
        })
        return
      }

      // Update ticket status
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ 
          status: "CHECKED_IN",
          checked_in_at: new Date().toISOString()
        })
        .eq("id", ticket.id)

      if (updateError) {
        setResult({
          success: false,
          message: "Gagal melakukan check-in. Silakan coba lagi."
        })
        return
      }

      setResult({
        success: true,
        message: "Check-in berhasil!",
        ticket: {
          ticket_number: ticket.ticket_number,
          event_title: ticket.event?.title || "",
          attendee_name: ticket.user?.full_name || ticket.user?.email || "",
          status: "CHECKED_IN"
        }
      })

      setTicketCode("")
      loadStats()
      inputRef.current?.focus()

    } catch {
      setResult({
        success: false,
        message: "Terjadi kesalahan. Silakan coba lagi."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Check-in Scanner
        </h1>
        <p className="text-muted-foreground mt-1">
          Scan QR code atau masukkan nomor tiket untuk check-in peserta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan Tiket
            </CardTitle>
            <CardDescription>
              Pilih event dan scan QR code atau masukkan nomor tiket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nomor Tiket / QR Code</Label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Masukkan nomor tiket..."
                  onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
                  disabled={!selectedEvent}
                />
                <Button 
                  onClick={handleCheckIn} 
                  disabled={isLoading || !selectedEvent || !ticketCode.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Peserta:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Sudah Check-in:</span>
                <span className="font-medium text-green-600">{stats.checkedIn}</span>
              </div>
              {stats.total > 0 && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(stats.checkedIn / stats.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {Math.round((stats.checkedIn / stats.total) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "transition-colors",
          result?.success && "border-green-500 bg-green-50",
          result && !result.success && "border-destructive bg-red-50"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result?.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : result ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
              Hasil Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <p className={cn(
                  "text-lg font-medium",
                  result.success ? "text-green-700" : "text-destructive"
                )}>
                  {result.message}
                </p>
                {result.ticket && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nomor Tiket:</span>
                      <span className="font-mono font-medium">{result.ticket.ticket_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama:</span>
                      <span className="font-medium">{result.ticket.attendee_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event:</span>
                      <span className="font-medium">{result.ticket.event_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full font-medium",
                        result.ticket.status === "CHECKED_IN" && "bg-green-100 text-green-700",
                        result.ticket.status === "PAID" && "bg-blue-100 text-blue-700",
                        result.ticket.status === "UNPAID" && "bg-yellow-100 text-yellow-700"
                      )}>
                        {result.ticket.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Scan tiket untuk melihat hasil check-in</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
