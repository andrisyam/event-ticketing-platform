import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Search, Filter, MoreVertical, Shield, Calendar as CalendarIcon, Ticket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import { AdminSidebar } from '../sidebar'
import { getUser } from '@/lib/auth'

interface PageProps {
  searchParams: Promise<{
    role?: string
    q?: string
  }>
}

async function getUsers(role?: string, search?: string): Promise<Profile[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (role) {
    query = query.eq('role', role.toUpperCase())
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data } = await query
  return data || []
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/admin/users')
  }

  if (user.role !== 'ADMIN') {
    redirect('/')
  }

  const users = await getUsers(params.role, params.q)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const roleFilters = [
    { value: '', label: 'Semua Role' },
    { value: 'user', label: 'User' },
    { value: 'organizer', label: 'Organizer' },
    { value: 'admin', label: 'Admin' },
  ]

  const roleColors: Record<string, string> = {
    USER: 'bg-blue-100 text-blue-800',
    ORGANIZER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-red-100 text-red-800',
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar user={user} />

      <div className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Manajemen User</h1>
            <p className="text-muted-foreground">
              Kelola semua user di platform
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Cari user..."
                  defaultValue={params.q}
                  className="pl-10"
                />
              </div>
              <select
                name="role"
                defaultValue={params.role}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {roleFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <Button type="submit">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </form>
          </div>

          {/* Users Table */}
          {users.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((profile) => (
                        <tr key={profile.id} className="hover:bg-muted/30">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{profile.full_name || 'User'}</p>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={roleColors[profile.role] || ''}>
                              {profile.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {profile.phone || '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatDate(profile.created_at)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Users className="h-4 w-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                {profile.role === 'USER' && (
                                  <DropdownMenuItem>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Jadikan Organizer
                                  </DropdownMenuItem>
                                )}
                                {profile.role === 'ORGANIZER' && (
                                  <DropdownMenuItem>
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    Lihat Event
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Tidak Ada User</h3>
                <p className="mt-2 text-muted-foreground">
                  {params.role || params.q
                    ? 'Tidak ada user yang sesuai dengan filter'
                    : 'Belum ada user yang terdaftar'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
