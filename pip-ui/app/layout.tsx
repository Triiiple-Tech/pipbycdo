import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { ClientThemeProvider } from "@/components/client-theme-provider"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PIP AI - Construction Document Analysis",
  description: "AI-powered construction document analysis and cost estimation platform",
  generator: "PIP AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientThemeProvider>
          {children}
          <Toaster position="top-right" />
        </ClientThemeProvider>
      </body>
    </html>
  )
}
