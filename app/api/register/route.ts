import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Generate unique ticket number
function generateTicketNumber(): string {
  const prefix = "NE"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { event_id, form_data } = body

    if (!event_id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if event is open for registration
    if (event.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Event is not open for registration" }, { status: 400 })
    }

    // Check registration period
    const now = new Date()
    if (event.registration_open && new Date(event.registration_open) > now) {
      return NextResponse.json({ error: "Registration has not started yet" }, { status: 400 })
    }
    if (event.registration_close && new Date(event.registration_close) < now) {
      return NextResponse.json({ error: "Registration has closed" }, { status: 400 })
    }

    // Check if already registered
    const { data: existingReg } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", event_id)
      .eq("user_id", user.id)
      .single()

    if (existingReg) {
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 })
    }

    // Check capacity
    if (event.capacity) {
      const { count } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event_id)

      if (count && count >= event.capacity) {
        return NextResponse.json({ error: "Event is full" }, { status: 400 })
      }
    }

    // Create ticket
    const ticketNumber = generateTicketNumber()
    const isFree = !event.price || event.price === 0

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        event_id,
        user_id: user.id,
        ticket_number: ticketNumber,
        qr_code: ticketNumber, // Use ticket number as QR code data
        price: event.price || 0,
        status: isFree ? "PAID" : "UNPAID",
        purchased_at: isFree ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Ticket creation error:", ticketError)
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
    }

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        event_id,
        user_id: user.id,
        ticket_id: ticket.id,
        form_data: form_data || null
      })
      .select()
      .single()

    if (regError) {
      // Rollback ticket creation
      await supabase.from("tickets").delete().eq("id", ticket.id)
      console.error("Registration error:", regError)
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        price: ticket.price
      },
      registration: {
        id: registration.id
      }
    })

  } catch (error) {
    console.error("Registration API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
