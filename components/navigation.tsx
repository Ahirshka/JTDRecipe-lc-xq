"use client"

import type React from "react"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Plus, User, LogOut, Shield, Menu, Settings, Home } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { hasPermission } from "@/lib/auth"
import { useState } from "react"

export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const isActivePath = (path: string) => {
    return pathname === path
  }

  const NavLink = ({
    href,
    children,
    className = "",
    onClick,
  }: {
    href: string
    children: React.ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors hover:text-orange-600 ${
        isActivePath(href) ? "text-orange-600" : "text-gray-700"
      } ${className}`}
    >
      {children}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src="/jtd-logo.png" alt="Just The Damn Recipe" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink href="/">
              <Home className="h-4 w-4 mr-1 inline" />
              Home
            </NavLink>
            <NavLink href="/search">Browse Recipes</NavLink>
            {isAuthenticated && (
              <NavLink href="/add-recipe">
                <Plus className="h-4 w-4 mr-1 inline" />
                Add Recipe
              </NavLink>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <img src="/jtd-logo.png" alt="Just The Damn Recipe" className="h-8 w-auto" />
                  </SheetTitle>
                  <SheetDescription>Navigate through our recipe platform</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  <NavLink href="/" onClick={() => setMobileMenuOpen(false)}>
                    <Home className="h-4 w-4 mr-2 inline" />
                    Home
                  </NavLink>
                  <NavLink href="/search" onClick={() => setMobileMenuOpen(false)}>
                    Browse Recipes
                  </NavLink>
                  {isAuthenticated ? (
                    <>
                      <NavLink href="/add-recipe" onClick={() => setMobileMenuOpen(false)}>
                        <Plus className="h-4 w-4 mr-2 inline" />
                        Add Recipe
                      </NavLink>
                      <NavLink href="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <User className="h-4 w-4 mr-2 inline" />
                        My Profile
                      </NavLink>
                      <NavLink href="/profile/settings" onClick={() => setMobileMenuOpen(false)}>
                        <Settings className="h-4 w-4 mr-2 inline" />
                        Settings
                      </NavLink>
                      {user && hasPermission(user.role, "moderator") && (
                        <NavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Shield className="h-4 w-4 mr-2 inline" />
                          Admin Panel
                        </NavLink>
                      )}
                      <Button
                        variant="ghost"
                        className="justify-start p-0 h-auto font-medium text-sm text-gray-700 hover:text-orange-600"
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          router.push("/login")
                          setMobileMenuOpen(false)
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        className="w-full justify-start bg-orange-600 hover:bg-orange-700"
                        onClick={() => {
                          router.push("/login")
                          setMobileMenuOpen(false)
                        }}
                      >
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop User Menu or Login Buttons */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg?height=36&width=36"}
                        alt={user.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg?height=40&width=40"}
                        alt={user.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user.username}</p>
                      <p className="w-[180px] truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {hasPermission(user.role, "moderator") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Login Buttons in Header */
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-gray-700 hover:text-orange-600 hidden sm:flex"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Link href="/login">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
