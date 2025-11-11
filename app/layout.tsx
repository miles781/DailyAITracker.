import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "🧠 DailyAITracker - AI-Powered Task & Habit Manager",
  description:
    "Modernize your productivity with AI-powered daily planning, task tracking, and habit building. Light/Dark mode, futuristic UI, and intelligent insights.",
  icons: {
    icon: "🧠",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${urbanist.variable} font-sans bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
 