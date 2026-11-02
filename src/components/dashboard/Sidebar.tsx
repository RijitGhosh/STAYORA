"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Building2, BedDouble, IndianRupee, CalendarRange,
  CalendarCheck, CalendarX, BarChart3, Users, CreditCard, TicketPercent,
  MessageSquare, ScrollText, Settings, Sparkles,
} from "lucide-react"

/**
 * Icons are referenced by name, not passed as components.
 * Server layouts can only send serialisable values to client components, so
 * an icon registry keeps the boundary clean.
 */
const ICONS = {
  dashboard: LayoutDashboard,
  building: Building2,
  bed: BedDouble,
  rupee: IndianRupee,
  calendarRange: CalendarRange,
  calendarCheck: CalendarCheck,
  calendarX: CalendarX,
  chart: BarChart3,
  users: Users,
  card: CreditCard,
  ticket: TicketPercent,
  message: MessageSquare,
  scroll: ScrollText,
  settings: Settings,
  sparkles: Sparkles,
} as const

export type IconName = keyof typeof ICONS

export type NavItem = {
  href: string
  label: string
  icon?: IconName
  badge?: number
}

export default function Sidebar({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === pathname) return true
    return pathname.startsWith(href + "/")
  }

  return (
    <nav className="bg-white border border-border rounded-lg p-2 lg:sticky lg:top-4 h-fit">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-secondaryText">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon ? ICONS[item.icon] : null
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-stayoraTeal text-white" : "text-primaryText hover:bg-warmWhite"
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-full",
                    active ? "bg-white/20" : "bg-warningAmber/15 text-warningAmber"
                  )}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
