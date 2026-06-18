'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton({ href }: { href?: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground"
      onClick={() => href ? router.push(href) : router.back()}
    >
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )
}
