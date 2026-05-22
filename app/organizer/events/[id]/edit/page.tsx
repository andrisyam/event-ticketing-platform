"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"

type Category = {
  id: string
  name: string
  slug: string
}

type Event = {
  id: string
  title: string
  slug: string
  description: string | null
  category_id: string | null
  venue: string | null
  city: string | null
  address: string | null
  maps_url: string | null
  capacity: number | null
  price: number
  registration_open: string | null
  registration_close: string | null
  event_start: string
  event_end: string | null
  status: string
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [eventId])

  async function loadData() {
    const [eventRes, categoriesRes] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single(),
      supabase
        .from("event_categories")
        .select("id, name, slug")
        .order("name")
    ])

    if (eventRes.data) {
      setEvent(eventRes.data)
    }
    if (categoriesRes.data) {
      setCategories(categoriesRes.data)
    }
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!event) return

    setIsSaving(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const updateData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      category_id: formData.get("category_id") as string || null,
      venue: formData.get("venue") as string || null,
      city: formData.get("city") as string || null,
      address: formData.get("address") as string || null,
      maps_url: formData.get("maps_url") as string || null,
      capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string) : null,
      price: parseFloat(formData.get("price") as string) || 0,
      registration_open: formData.get("registration_open") as string || null,
      registration_close: formData.get("registration_close") as string || null,
      event_start: formData.get("event_start") as string,
      event_end: formData.get("event_end") as string || null,
    }

    // Generate slug from title
    const slug = updateData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + eventId.slice(0, 8)

    const { error: updateError } = await supabase
      .from("events")
      .update({ ...updateData, slug })
      .eq("id", eventId)

    setIsSaving(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.push("/organizer/events")
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!event) return

    const { error } = await supabase
      .from("events")
      .update({ status: newStatus })
      .eq("id", eventId)

    if (!error) {
      setEvent({ ...event, status: newStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground">Event tidak ditemukan</h2>
        <Link href="/organizer/events" className="text-primary hover:underline mt-2 inline-block">
          Kembali ke daftar event
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/organizer/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Edit Event
          </h1>
          <p className="text-muted-foreground">
            Ubah detail event Anda
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Detail utama event Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Event *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={event.title}
                required
                placeholder="Masukkan judul event"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={event.description || ""}
                placeholder="Jelaskan detail event Anda..."
                rows={5}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category_id">Kategori</Label>
                <Select name="category_id" defaultValue={event.category_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasitas</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  defaultValue={event.capacity || ""}
                  placeholder="Jumlah peserta maksimal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Harga Tiket (Rp)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                defaultValue={event.price || 0}
                placeholder="0 untuk gratis"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lokasi</CardTitle>
            <CardDescription>Tempat penyelenggaraan event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="venue">Nama Venue</Label>
                <Input
                  id="venue"
                  name="venue"
                  defaultValue={event.venue || ""}
                  placeholder="Nama gedung/tempat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={event.city || ""}
                  placeholder="Kota penyelenggaraan"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={event.address || ""}
                placeholder="Alamat lengkap venue"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maps_url">Link Google Maps</Label>
              <Input
                id="maps_url"
                name="maps_url"
                type="url"
                defaultValue={event.maps_url || ""}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jadwal</CardTitle>
            <CardDescription>Waktu registrasi dan pelaksanaan event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registration_open">Registrasi Dibuka</Label>
                <Input
                  id="registration_open"
                  name="registration_open"
                  type="datetime-local"
                  defaultValue={event.registration_open?.slice(0, 16) || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_close">Registrasi Ditutup</Label>
                <Input
                  id="registration_close"
                  name="registration_close"
                  type="datetime-local"
                  defaultValue={event.registration_close?.slice(0, 16) || ""}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event_start">Tanggal & Waktu Mulai *</Label>
                <Input
                  id="event_start"
                  name="event_start"
                  type="datetime-local"
                  defaultValue={event.event_start?.slice(0, 16) || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_end">Tanggal & Waktu Selesai</Label>
                <Input
                  id="event_end"
                  name="event_end"
                  type="datetime-local"
                  defaultValue={event.event_end?.slice(0, 16) || ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Event</CardTitle>
            <CardDescription>Kelola status publikasi event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {event.status === "DRAFT" && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleStatusChange("PENDING_APPROVAL")}
                >
                  Ajukan untuk Disetujui
                </Button>
              )}
              {event.status === "APPROVED" && (
                <Button 
                  type="button" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusChange("PUBLISHED")}
                >
                  Publikasikan
                </Button>
              )}
              {event.status === "PUBLISHED" && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleStatusChange("CLOSED")}
                >
                  Tutup Registrasi
                </Button>
              )}
              <p className="w-full text-sm text-muted-foreground mt-2">
                Status saat ini: <span className="font-medium">{event.status}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/organizer/events">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  )
}
