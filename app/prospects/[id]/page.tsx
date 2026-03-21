"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProspect, listMessages, listCalls, listUsers } from "@/services/api";
import { Phone, MessageSquare, Mail, MapPin, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted",
  ACTIVE_SELLING: "Active Selling",
  SCHEDULED: "Scheduled",
  IN_PLAY: "In Play",
  PENDING_WITHDRAWAL: "Pending Withdrawal",
  CLOSED_DEAL: "Closed Deal",
  CLOSED_OUT: "Closed Out",
};

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: prospect, isLoading } = useQuery({ queryKey: ["prospect", id], queryFn: () => getProspect(id) });
  const { data: messages } = useQuery({ queryKey: ["messages", id], queryFn: () => listMessages(id) });
  const { data: calls } = useQuery({ queryKey: ["calls", id], queryFn: () => listCalls(id) });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const repName = (uid: string | undefined) => users?.find((u) => u.id === uid)?.name ?? "-";

  if (isLoading || !prospect) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{prospect.name}</h1>
          <Badge>{STATUS_LABELS[prospect.status] ?? prospect.status}</Badge>
          <Link href={`/prospects/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {prospect.phone && (
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {prospect.phone}</p>
              )}
              {prospect.email && (
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {prospect.email}</p>
              )}
              {prospect.location && (
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {prospect.location}</p>
              )}
              <p className="text-sm text-muted-foreground">Assigned: {repName(prospect.assigned_rep)}</p>
              {prospect.total_losses != null && <p>Total losses: {Number(prospect.total_losses).toLocaleString()}</p>}
              {prospect.notes && <p className="text-sm pt-2 border-t">{prospect.notes}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {prospect.accounts?.length ? (
                <ul className="space-y-2">
                  {prospect.accounts.map((a) => (
                    <li key={a.id} className="flex justify-between text-sm">
                      <span>{a.account_name}</span>
                      <span>{Number(a.loss_amount).toLocaleString()} · {Number(a.deal_percentage)}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No accounts</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Message history</CardTitle>
              <Link href={`/messaging?prospect=${id}`}>
                <Button size="sm"><MessageSquare className="h-4 w-4 mr-1" /> Send</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {messages?.length ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {messages.map((m) => (
                    <li key={m.id} className="text-sm border-l-2 pl-2">
                      <span className="text-muted-foreground">{m.channel} · {format(new Date(m.sent_at), "PPp")}</span>
                      <p>{m.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No messages</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Call history</CardTitle>
              <Link href={`/calls?prospect=${id}`}>
                <Button size="sm"><Phone className="h-4 w-4 mr-1" /> Call</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {calls?.length ? (
                <ul className="space-y-2">
                  {calls.map((c) => (
                    <li key={c.id} className="text-sm flex justify-between">
                      <span>{format(new Date(c.created_at), "PPp")} · {c.call_status}</span>
                      <span>{c.duration}s</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No calls</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
