import type { Metadata } from "next";
import Link from "next/link";
import { AuthButton, AuthProvider, DemoBanner } from "@/components/Auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roadkill",
  description: "Log roadkill, check your state's salvage rules, and claim a pickup.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <DemoBanner />
          <header className="border-b border-zinc-200 dark:border-zinc-800">
            <nav className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 text-sm">
              <Link href="/" className="text-base font-bold">
                Roadkill
              </Link>
              <Link href="/report">Log one</Link>
              <Link href="/regs">State rules</Link>
              <AuthButton />
            </nav>
          </header>
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
