"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      try {
        const u = JSON.parse(user);
        if (u.role === "SuperAdmin") router.replace("/admin/dashboard");
        else router.replace("/dashboard");
      } catch {
        router.replace("/login");
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-muted/30">
      <h1 className="text-3xl font-bold">Multi-Tenant CRM</h1>
      <p className="text-muted-foreground">Prospect tracking, pipeline, calendar, messaging & calls</p>
      <Link href="/login">
        <Button size="lg">Sign in</Button>
      </Link>
    </div>
  );
}
