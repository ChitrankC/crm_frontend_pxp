"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listProspects, deleteProspect, listUsers, type Prospect } from "@/services/api";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted",
  ACTIVE_SELLING: "Active Selling",
  SCHEDULED: "Scheduled",
  IN_PLAY: "In Play",
  PENDING_WITHDRAWAL: "Pending Withdrawal",
  CLOSED_DEAL: "Closed Deal",
  CLOSED_OUT: "Closed Out",
};

export default function ProspectsPage() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lossMin, setLossMin] = useState("");
  const [lossMax, setLossMax] = useState("");

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: listUsers });
  const { data: prospects, isLoading } = useQuery({
    queryKey: ["prospects", location, statusFilter, lossMin, lossMax],
    queryFn: () =>
      listProspects({
        ...(location && { location }),
        ...(statusFilter && { status: statusFilter }),
        ...(lossMin && { loss_amount_min: Number(lossMin) }),
        ...(lossMax && { loss_amount_max: Number(lossMax) }),
      }),
  });

  const deleteMutation = useMutation({ mutationFn: deleteProspect, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prospects"] }) });

  const repName = (id: string | undefined) => users?.find((u) => u.id === id)?.name ?? "-";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Prospects</h1>
          <Link href="/prospects/new">
            <Button><Plus className="h-4 w-4 mr-2" /> Add Prospect</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm text-muted-foreground mr-2">Location</label>
                <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mr-2">Status</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 w-44"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mr-2">Loss min</label>
                <Input type="number" placeholder="Min" value={lossMin} onChange={(e) => setLossMin(e.target.value)} className="w-28" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mr-2">Loss max</label>
                <Input type="number" placeholder="Max" value={lossMax} onChange={(e) => setLossMax(e.target.value)} className="w-28" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-muted-foreground">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Loss Amount</th>
                      <th className="text-left p-4 font-medium">Location</th>
                      <th className="text-left p-4 font-medium">Assigned Rep</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(prospects ?? []).map((p: Prospect) => (
                      <tr key={p.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4">{p.total_losses != null ? Number(p.total_losses).toLocaleString() : "-"}</td>
                        <td className="p-4">{p.location ?? "-"}</td>
                        <td className="p-4">{repName(p.assigned_rep)}</td>
                        <td className="p-4"><Badge variant="secondary">{STATUS_LABELS[p.status] ?? p.status}</Badge></td>
                        <td className="p-4 text-right">
                          <Link href={`/prospects/${p.id}`}>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Link href={`/prospects/${p.id}/edit`}>
                            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => confirm("Delete?") && deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
