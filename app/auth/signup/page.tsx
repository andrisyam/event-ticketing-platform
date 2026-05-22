import { Suspense } from 'react'
import SignUpPageClient from './signup-page-client'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPageClient />
    </Suspense>
  )
}