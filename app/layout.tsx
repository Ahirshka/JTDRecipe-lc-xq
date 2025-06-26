import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JTDRecipe - Share Your Favorite Recipes",
  description: "Discover and share amazing recipes with our community of food lovers.",
  keywords: ["recipes", "cooking", "food", "community", "sharing"],
  authors: [{ name: "JTDRecipe Team" }],
  openGraph: {
    title: "JTDRecipe - Share Your Favorite Recipes",
    description: "Discover and share amazing recipes with our community of food lovers.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "JTDRecipe - Share Your Favorite Recipes",
    description: "Discover and share amazing recipes with our community of food lovers.",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
