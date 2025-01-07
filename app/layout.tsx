import { cn } from "@/lib/utils"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ChatGenius",
  description: "A Slack-like chat application"
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background min-h-screen font-sans antialiased",
            inter.className
          )}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
