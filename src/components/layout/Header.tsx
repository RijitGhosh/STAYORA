"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Building2, User, LogOut, LayoutDashboard, Menu, X,
  CalendarCheck, ShieldCheck, BedDouble, Wallet,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import ThemeToggle from "@/components/theme-toggle"
import { useState } from "react"

type Panel = { href: string; label: string; icon: React.ComponentType<any> }

/** Every workspace the signed-in account can reach. */
function panelsFor(role: string | undefined): Panel[] {
  const panels: Panel[] = []
  if (role === "ADMIN") {
    panels.push({ href: "/admin", label: "Admin console", icon: ShieldCheck })
    panels.push({ href: "/owner", label: "Property management", icon: Building2 })
    panels.push({ href: "/operations", label: "Hotel operations", icon: BedDouble })
  } else if (role === "HOTEL_OWNER") {
    panels.push({ href: "/owner", label: "Property management", icon: Building2 })
    panels.push({ href: "/operations", label: "Hotel operations", icon: BedDouble })
  } else if (role === "RECEPTIONIST" || role === "HOUSEKEEPING" || role === "FINANCE") {
    panels.push({ href: "/operations", label: "Hotel operations", icon: BedDouble })
  }
  panels.push({ href: "/account", label: "My bookings", icon: CalendarCheck })
  return panels
}

export default function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)

  const isAuthed = status === "authenticated"
  const role = (session?.user as any)?.role as string | undefined
  const panels = panelsFor(role)
  const primary = panels[0]

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push("/")
    router.refresh()
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <header className="bg-deepOceanBlue text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-white p-1.5 rounded-lg">
              <Building2 className="h-5 w-5 text-stayoraTeal" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Stayora</h1>
              <p className="text-[10px] text-gray-300 leading-tight">Every Stay, A Better Story</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/search" className="hover:text-brightTeal transition-colors">Find Hotels</Link>
            <Link href="/about" className="hover:text-brightTeal transition-colors">About</Link>
            <Link href="/contact" className="hover:text-brightTeal transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthed ? (
              <>
                {/* Workspace switcher — receptionists and owners need more than one entry point */}
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setMenu((m) => !m)}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-white/30 text-white text-sm hover:bg-white/10"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {primary?.label ?? "Account"}
                  </button>

                  {menu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                      <div className="absolute right-0 mt-1 w-56 bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-sm font-medium text-deepOceanBlue truncate">
                            {session?.user?.name}
                          </p>
                          <p className="text-[11px] text-secondaryText">
                            {role?.replace(/_/g, " ").toLowerCase()}
                          </p>
                        </div>
                        {panels.map((p) => (
                          <Link
                            key={p.href}
                            href={p.href}
                            onClick={() => setMenu(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm text-primaryText hover:bg-warmWhite ${
                              isActive(p.href) ? "bg-warmWhite font-medium" : ""
                            }`}
                          >
                            <p.icon className="h-4 w-4 text-stayoraTeal" />
                            {p.label}
                          </Link>
                        ))}
                        <div className="border-t border-border mt-1 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-errorRed hover:bg-errorRed/5"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-deepOceanBlue h-9">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button className="bg-stayoraTeal hover:bg-stayoraTeal/90 h-9">Register</Button>
                </Link>
              </>
            )}

            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/30"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pt-3 pb-1 space-y-1 border-t border-white/15 mt-3">
            <Link href="/search" className="block px-2 py-2 text-sm hover:bg-white/10 rounded" onClick={() => setOpen(false)}>Find Hotels</Link>
            <Link href="/about" className="block px-2 py-2 text-sm hover:bg-white/10 rounded" onClick={() => setOpen(false)}>About</Link>
            <Link href="/contact" className="block px-2 py-2 text-sm hover:bg-white/10 rounded" onClick={() => setOpen(false)}>Contact</Link>

            {isAuthed ? (
              <>
                <p className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-400">
                  {role?.replace(/_/g, " ").toLowerCase()}
                </p>
                {panels.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-white/10 rounded"
                    onClick={() => setOpen(false)}
                  >
                    <p.icon className="h-4 w-4" />
                    {p.label}
                  </Link>
                ))}
                <button onClick={handleSignOut} className="w-full text-left px-2 py-2 text-sm hover:bg-white/10 rounded">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-2 py-2 text-sm hover:bg-white/10 rounded" onClick={() => setOpen(false)}>Sign in</Link>
                <Link href="/register" className="block px-2 py-2 text-sm hover:bg-white/10 rounded" onClick={() => setOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
