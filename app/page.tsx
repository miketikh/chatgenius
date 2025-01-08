"use server"

import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import {
  FileText,
  MessageCircle,
  MessageSquare,
  Smile,
  Users,
  Zap
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect("/chat")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-purple-600">
            ChatGenius
          </Link>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link
                  href="#features"
                  className="text-gray-600 hover:text-purple-600"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-purple-600">
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="grow">
        <section className="bg-gradient-to-b from-purple-100 to-white py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-800 md:text-6xl">
              Welcome to ChatGenius
            </h1>
            <p className="mb-8 text-xl text-gray-600 md:text-2xl">
              The intelligent communication platform for teams
            </p>
            <div className="mb-8 flex h-12 justify-center space-x-4">
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700"
                >
                  Sign Up
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-600 bg-white text-purple-600 hover:bg-purple-100 dark:border-purple-600 dark:bg-white dark:text-purple-600 dark:hover:bg-purple-100"
                >
                  Sign In
                </Button>
              </SignInButton>
            </div>

            <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border-2 border-purple-100 shadow-2xl">
              <img
                src="/screenshots/homepage_screenshot.png"
                alt="ChatGenius Interface Screenshot"
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-8">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-800">
              Core Features
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <MessageSquare className="size-8 text-purple-600" />,
                  title: "Real-time messaging",
                  description: "Instant communication with your team"
                },
                {
                  icon: <Users className="size-8 text-purple-600" />,
                  title: "Channel/DM organization",
                  description: "Organize conversations efficiently"
                },
                {
                  icon: <FileText className="size-8 text-purple-600" />,
                  title: "File sharing & search",
                  description: "Share and find files with ease"
                },
                {
                  icon: <Zap className="size-8 text-purple-600" />,
                  title: "User presence & status",
                  description: "See who's online and their status"
                },
                {
                  icon: <MessageCircle className="size-8 text-purple-600" />,
                  title: "Thread support",
                  description: "Keep discussions organized with threads"
                },
                {
                  icon: <Smile className="size-8 text-purple-600" />,
                  title: "Emoji reactions",
                  description: "React to messages with emojis"
                }
              ].map((feature, index) => (
                <div key={index} className="rounded-lg bg-white p-6 shadow-md">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between">
            <div className="mb-6 w-full md:mb-0 md:w-1/3">
              <h3 className="mb-4 text-xl font-bold text-gray-800">
                ChatGenius
              </h3>
              <p className="text-gray-600">
                Empowering teams with intelligent communication.
              </p>
            </div>
            <div className="mb-6 w-full md:mb-0 md:w-1/3">
              <h4 className="mb-4 text-lg font-semibold text-gray-800">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 hover:text-purple-600"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="text-gray-600 hover:text-purple-600"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 hover:text-purple-600"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/3">
              <h4 className="mb-4 text-lg font-semibold text-gray-800">
                Connect
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="https://x.com/miketikh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-purple-600"
                  >
                    Twitter
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600">
              &copy; {new Date().getFullYear()} ChatGenius. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
