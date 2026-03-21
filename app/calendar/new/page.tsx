"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMeeting, listProspects, listUsers } from "@/services/api";
import { format } from "date-fns";

export default function NewMeetingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [prospectId, setProspectId] = useState("");
  const [assignedRep, setAssignedRep] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const { data: prospects } = useQuery({ queryKey: ["prospects"], queryFn: listProspects });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const create = useMutation({
    mutationFn: () =>
      createMeeting({
        prospect_id: prospectId,
        assigned_rep: assignedRep || undefined,
        meeting_date: new Date(`${date}T${time}`).toISOString(),
        meeting_time: time,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.push("/calendar");
    },
  });

  return (
    <DashboardLayout>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Schedule meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label>Prospect</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3"
                value={prospectId}
                onChange={(e) => setProspectId(e.target.value)}
                required
              >
                <option value="">Select</option>
                {(prospects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Assigned rep</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3"
                value={assignedRep}
                onChange={(e) => setAssignedRep(e.target.value)}
              >
                <option value="">None</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending}>Create</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
