"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats, type AdminClientStats } from "@/services/api";
import { Users, TrendingUp, Calendar, CheckCircle, Building2, ArrowRight } from "lucide-react";

function ClientCard({ c }: { c: AdminClientStats }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          {c.company_name}
        </CardTitle>
        <Badge variant={c.subscription_status === "ACTIVE" ? "default" : "secondary"}>{c.subscription_status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{c.total_prospects} prospects</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>{c.deals_in_pipeline} in pipeline</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{c.meetings_today} meetings today</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span>{c.closed_deals} closed</span>
          </div>
        </div>
        <Link href={`/admin/clients?highlight=${c.tenant_id}`}>
          <Button variant="outline" size="sm" className="w-full">
            View client <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: getAdminDashboardStats,
  });

  const totals = stats.reduce(
    (acc, c) => ({
      prospects: acc.prospects + c.total_prospects,
      pipeline: acc.pipeline + c.deals_in_pipeline,
      meetingsToday: acc.meetingsToday + c.meetings_today,
      closed: acc.closed + c.closed_deals,
    }),
    { prospects: 0, pipeline: 0, meetingsToday: 0, closed: 0 }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of all clients</p>
        </div>

        {/* Global totals */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total prospects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.prospects}</div>
              <p className="text-xs text-muted-foreground">Across all clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In pipeline</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.pipeline}</div>
              <p className="text-xs text-muted-foreground">Active deals</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Meetings today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.meetingsToday}</div>
              <p className="text-xs text-muted-foreground">Across all clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Closed deals</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.closed}</div>
              <p className="text-xs text-muted-foreground">Total won</p>
            </CardContent>
          </Card>
        </div>

        {/* Per-client cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Clients at a glance</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : stats.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No clients yet. Create one from the Clients page.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((c) => (
                <ClientCard key={c.tenant_id} c={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
