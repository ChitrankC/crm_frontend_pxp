"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listProspects, listMessages, sendMessage } from "@/services/api";
import { format } from "date-fns";
import { Send } from "lucide-react";

function MessagingContent() {
  const searchParams = useSearchParams();
  const prospectIdParam = searchParams.get("prospect");
  const [selectedId, setSelectedId] = useState<string | null>(prospectIdParam);
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (prospectIdParam) setSelectedId(prospectIdParam);
  }, [prospectIdParam]);

  const { data: prospects = [] } = useQuery({ queryKey: ["prospects"], queryFn: () => listProspects() });
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedId ?? ""],
    queryFn: () => listMessages(selectedId ?? undefined),
    enabled: !!selectedId,
  });

  const send = useMutation({
    mutationFn: () => sendMessage(selectedId!, message, channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedId ?? ""] });
      setMessage("");
    },
  });

  const selected = prospects.find((p) => p.id === selectedId);

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        <Card className="w-80 flex-shrink-0">
          <CardHeader>
            <CardTitle>Prospects</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="max-h-[60vh] overflow-y-auto">
              {prospects.map((p) => (
                <li
                  key={p.id}
                  className={`px-4 py-2 cursor-pointer border-b hover:bg-muted/50 ${selectedId === p.id ? "bg-muted" : ""}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone ?? p.email ?? "-"}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>{selected ? selected.name : "Select a prospect"}</CardTitle>
            {selected && <p className="text-sm text-muted-foreground">{selected.phone ?? selected.email}</p>}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {selectedId ? (
              <>
                <ul className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {messages.map((m) => (
                    <li key={m.id} className="text-sm border-l-2 pl-2">
                      <span className="text-muted-foreground">{m.channel} · {format(new Date(m.sent_at), "PPp")}</span>
                      <p>{m.message}</p>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as "sms" | "whatsapp")}
                  >
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                  <Input
                    placeholder="Type message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send.mutate()}
                    className="flex-1"
                  />
                  <Button onClick={() => send.mutate()} disabled={!message.trim() || send.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Select a prospect to view and send messages.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function MessagingPage() {
  return (
    <Suspense fallback={<DashboardLayout><p>Loading...</p></DashboardLayout>}>
      <MessagingContent />
    </Suspense>
  );
}
