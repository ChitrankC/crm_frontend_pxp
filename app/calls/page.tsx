"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProspects, listCalls, initiateCall } from "@/services/api";
import { format } from "date-fns";
import { Phone } from "lucide-react";

function CallsContent() {
  const searchParams = useSearchParams();
  const prospectIdParam = searchParams.get("prospect");
  const [selectedId, setSelectedId] = useState<string | null>(prospectIdParam);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (prospectIdParam) setSelectedId(prospectIdParam);
  }, [prospectIdParam]);

  const { data: prospects = [] } = useQuery({ queryKey: ["prospects"], queryFn: () => listProspects() });
  const { data: calls = [] } = useQuery({
    queryKey: ["calls", selectedId ?? ""],
    queryFn: () => listCalls(selectedId ?? undefined),
  });

  const startCall = useMutation({
    mutationFn: (prospectId: string) => initiateCall(prospectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calls"] }),
  });

  const selected = prospects.find((p) => p.id === selectedId);

  return (
    <div className="flex gap-6">
      <Card className="w-80 flex-shrink-0">
        <CardHeader>
          <CardTitle>Prospects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="max-h-[60vh] overflow-y-auto">
            {prospects.map((p) => (
              <li
                key={p.id}
                className={`px-4 py-2 cursor-pointer border-b hover:bg-muted/50 flex items-center justify-between ${selectedId === p.id ? "bg-muted" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone ?? "-"}</p>
                </div>
                {p.phone && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCall.mutate(p.id);
                    }}
                    disabled={startCall.isPending}
                  >
                    <Phone className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Call history</CardTitle>
          {selected && (
            <p className="text-sm text-muted-foreground">
              {selected.name} · {selected.phone ?? "No phone"}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {selectedId ? (
            <ul className="space-y-2">
              {calls.filter((c) => c.prospect_id === selectedId).map((c) => (
                <li key={c.id} className="flex justify-between text-sm border-b pb-2">
                  <span>{format(new Date(c.created_at), "PPp")} · {c.call_status}</span>
                  <span>{c.duration}s</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Select a prospect to view call history and click-to-call.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CallsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <CallsContent />
      </Suspense>
    </DashboardLayout>
  );
}
