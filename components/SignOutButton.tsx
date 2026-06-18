'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const signOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <Button
      variant="destructive"
      className="w-full rounded-xl"
      onClick={signOut}
      disabled={loading}
    >
      {loading ? 'Signing out…' : 'Sign Out'}
    </Button>
  )
}
