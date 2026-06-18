'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, TrendingUp, Dumbbell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/routines', label: 'Routines', icon: Dumbbell },
  { href: '/history', label: 'History', icon: History },
  { href: '/', label: 'Home', icon: Home },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', href === '/' && 'h-6 w-6')} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
