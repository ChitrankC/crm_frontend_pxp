"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "@/services/api";
import { cn } from "@/lib/utils";

const navAll = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/prospects", label: "Prospects" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/calendar", label: "Calendar" },
  { href: "/messaging", label: "Messaging" },
  { href: "/calls", label: "Calls" },
  { href: "/settings/sheet-import", label: "Sheet import", roles: ["ClientAdmin", "SalesRep"] as const },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.replace("/login");
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const nav = navAll.filter((item) => {
    if ("roles" in item && item.roles) {
      return (item.roles as readonly string[]).includes(user.role);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-lg">CRM</Link>
          <nav className="flex gap-2">
            {nav.map(({ href, label }) => (
              <Link key={href} href={href}>
                <Button variant={pathname === href ? "secondary" : "ghost"} size="sm">{label}</Button>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{user.name} ({user.role})</span>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
