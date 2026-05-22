'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Calendar, MapPin, DollarSign, Users, Image } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { EventCategory } from '@/lib/types'

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<EventCategory[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    venue: '',
    city: '',
    address: '',
    maps_url: '',
    capacity: '',
    price: '0',
    event_start: '',
    event_end: '',
    registration_open: '',
    registration_close: '',
    banner_image: '',
  })

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('event_categories')
        .select('*')
        .order('name')
      setCategories(data || [])
    }
    fetchCategories()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .concat('-', Date.now().toString(36))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const eventData = {
        organizer_id: user.id,
        title: formData.title,
        slug: generateSlug(formData.title),
        description: formData.description || null,
        category_id: formData.category_id || null,
        venue: formData.venue || null,
        city: formData.city || null,
        address: formData.address || null,
        maps_url: formData.maps_url || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: parseFloat(formData.price) || 0,
        event_start: formData.event_start,
        event_end: formData.event_end || null,
        registration_open: formData.registration_open || null,
        registration_close: formData.registration_close || null,
        banner_image: formData.banner_image || null,
        status: 'DRAFT',
      }

      const { data, error: insertError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      router.push(`/organizer/events/${data.id}`)
    } catch (err) {
      console.error('Error creating event:', err)
      setError('Gagal membuat event. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href="/organizer/events"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Event Saya
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Buat Event Baru</CardTitle>
            <CardDescription>
              Isi detail event Anda. Event akan disimpan sebagai draft dan perlu disubmit untuk review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Informasi Dasar
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="title">Nama Event *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Masukkan nama event"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Jelaskan tentang event Anda"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Kategori</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category_id: value }))
                    }
                    disabled={loading}
                  >
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
                  <Label htmlFor="banner_image">URL Banner Image</Label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="banner_image"
                      name="banner_image"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.banner_image}
                      onChange={handleChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Waktu Event
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_start">Mulai Event *</Label>
                    <Input
                      id="event_start"
                      name="event_start"
                      type="datetime-local"
                      value={formData.event_start}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_end">Selesai Event</Label>
                    <Input
                      id="event_end"
                      name="event_end"
                      type="datetime-local"
                      value={formData.event_end}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_open">Pendaftaran Dibuka</Label>
                    <Input
                      id="registration_open"
                      name="registration_open"
                      type="datetime-local"
                      value={formData.registration_open}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_close">Pendaftaran Ditutup</Label>
                    <Input
                      id="registration_close"
                      name="registration_close"
                      type="datetime-local"
                      value={formData.registration_close}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  Lokasi
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Nama Venue</Label>
                    <Input
                      id="venue"
                      name="venue"
                      placeholder="Nama gedung/tempat"
                      value={formData.venue}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Kota"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Alamat lengkap venue"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maps_url">Link Google Maps</Label>
                  <Input
                    id="maps_url"
                    name="maps_url"
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.maps_url}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Pricing & Capacity */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Harga & Kuota
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga Tiket (Rp)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      placeholder="0 untuk gratis"
                      value={formData.price}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Kuota Peserta</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min="1"
                        placeholder="Kosongkan jika unlimited"
                        value={formData.capacity}
                        onChange={handleChange}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan sebagai Draft'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
