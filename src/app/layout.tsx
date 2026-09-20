import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevFlow AI — Developer Project & Task Management",
  description:
    "DevFlow AI is a modern, AI-powered project & task management platform for developers, students, freelancers and small teams. Plan projects, manage tasks, and generate work with AI.",
  keywords: [
    "DevFlow AI",
    "project management",
    "task management",
    "developer tools",
    "productivity",
    "AI task generation",
    "kanban",
  ],
  authors: [{ name: "DevFlow AI" }],
  applicationName: "DevFlow AI",
  openGraph: {
    title: "DevFlow AI — Developer Project & Task Management",
    description:
      "Plan projects, manage tasks, and generate work with AI. A modern SaaS dashboard for developers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevFlow AI",
    description: "AI-powered project & task management for developers.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101013" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
          <SonnerToaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
