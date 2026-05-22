'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface RegisterButtonProps {
  eventId: string
  isLoggedIn: boolean
  isOpen: boolean
  price: number
}

export function RegisterButton({ eventId, isLoggedIn, isOpen, price }: RegisterButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/events/${eventId}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push(`/auth/login?redirect=/events/${eventId}`)
        return
      }

      // Check if already registered
      const { data: existingReg } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

      if (existingReg) {
        setError('Anda sudah terdaftar untuk event ini')
        setLoading(false)
        return
      }

      // Generate ticket number
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          event_id: eventId,
          user_id: user.id,
          ticket_number: ticketNumber,
          price: price,
          status: price === 0 ? 'PAID' : 'UNPAID',
          purchased_at: price === 0 ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (ticketError) {
        throw ticketError
      }

      // Create registration
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          ticket_id: ticket.id,
        })

      if (regError) {
        throw regError
      }

      if (price === 0) {
        // Free event - redirect to ticket
        router.push(`/my-tickets/${ticket.id}`)
      } else {
        // Paid event - redirect to payment
        router.push(`/checkout/${ticket.id}`)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Gagal mendaftar. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleRegister}
        disabled={!isOpen || loading}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <Ticket className="mr-2 h-4 w-4" />
            {isOpen ? 'Daftar Sekarang' : 'Tidak Tersedia'}
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
