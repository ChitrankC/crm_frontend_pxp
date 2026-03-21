"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProspect, updateProspect, listUsers } from "@/services/api";
import { useState, useEffect } from "react";

export default function EditProspectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: prospect, isLoading } = useQuery({ queryKey: ["prospect", id], queryFn: () => getProspect(id) });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => listUsers() });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [totalLosses, setTotalLosses] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("NOT_CONTACTED");
  const [assignedRep, setAssignedRep] = useState("");

  useEffect(() => {
    if (prospect) {
      setName(prospect.name);
      setPhone(prospect.phone ?? "");
      setEmail(prospect.email ?? "");
      setLocation(prospect.location ?? "");
      setTotalLosses(prospect.total_losses != null ? String(prospect.total_losses) : "");
      setNotes(prospect.notes ?? "");
      setStatus(prospect.status);
      setAssignedRep(prospect.assigned_rep ?? "");
    }
  }, [prospect]);

  const update = useMutation({
    mutationFn: (body: Parameters<typeof updateProspect>[1]) => updateProspect(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect", id] });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      router.push(`/prospects/${id}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      name,
      phone: phone || undefined,
      email: email || undefined,
      location: location || undefined,
      total_losses: totalLosses ? Number(totalLosses) : undefined,
      notes: notes || undefined,
      status,
      assigned_rep: assignedRep || undefined,
    });
  }

  if (isLoading || !prospect) return <DashboardLayout><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Prospect</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <Label>Total Losses</Label>
                <Input type="number" value={totalLosses} onChange={(e) => setTotalLosses(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Assigned Rep</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={assignedRep} onChange={(e) => setAssignedRep(e.target.value)}>
                <option value="">None</option>
                {(users ?? []).filter((u) => u.role === "SalesRep" || u.role === "ClientAdmin").map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="NOT_CONTACTED">Not Contacted</option>
                <option value="ACTIVE_SELLING">Active Selling</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PLAY">In Play</option>
                <option value="PENDING_WITHDRAWAL">Pending Withdrawal</option>
                <option value="CLOSED_DEAL">Closed Deal</option>
                <option value="CLOSED_OUT">Closed Out</option>
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={update.isPending}>Save</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
