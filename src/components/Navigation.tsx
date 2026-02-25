"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Flower, Camera, User, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { label: "Blooming", icon: Home, href: "/blooming" },
    { label: "Garden", icon: LayoutGrid, href: "/garden" },
    { label: "Camera", icon: Camera, href: "/camera", center: true },
    { label: "Friends", icon: Flower, href: "/friends" },
    { label: "Profile", icon: User, href: "/profile" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-4 md:px-32">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (pathname === "/" && item.href === "/blooming")
        if (item.center) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative -top-6 flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground hover:scale-110 transition-transform duration-200"
            >
              <item.icon size={28} />
            </Link>
          )
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
            )}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}