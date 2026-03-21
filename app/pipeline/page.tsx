"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProspects, updateProspectStatus, type Prospect } from "@/services/api";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import Link from "next/link";

const COLUMNS = [
  { id: "NOT_CONTACTED", title: "Not Contacted" },
  { id: "ACTIVE_SELLING", title: "Active Selling" },
  { id: "SCHEDULED", title: "Scheduled" },
  { id: "IN_PLAY", title: "In Play" },
  { id: "PENDING_WITHDRAWAL", title: "Pending Withdrawal" },
  { id: "CLOSED_DEAL", title: "Closed Deal" },
  { id: "CLOSED_OUT", title: "Closed Out" },
];

function ProspectCard({ prospect, isDrag }: { prospect: Prospect; isDrag?: boolean }) {
  return (
    <div
      className={`rounded-lg border bg-card p-3 text-sm shadow-sm ${isDrag ? "opacity-90 shadow-lg" : ""}`}
    >
      <Link href={`/prospects/${prospect.id}`} className="font-medium hover:underline">
        {prospect.name}
      </Link>
      <p className="text-muted-foreground text-xs mt-1">
        {prospect.total_losses != null ? `$${Number(prospect.total_losses).toLocaleString()}` : ""} {prospect.location ? `· ${prospect.location}` : ""}
      </p>
    </div>
  );
}

function SortableCard({ prospect }: { prospect: Prospect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prospect.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProspectCard prospect={prospect} isDrag={isDragging} />
    </div>
  );
}

function Column({ id, title, prospects }: { id: string; title: string; prospects: Prospect[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Card ref={setNodeRef} className={`min-w-[220px] flex-shrink-0 ${isOver ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-xs text-muted-foreground">{prospects.length}</span>
      </CardHeader>
      <CardContent className="pt-0 space-y-2 max-h-[70vh] overflow-y-auto">
        {prospects.map((p) => (
          <SortableCard key={p.id} prospect={p} />
        ))}
      </CardContent>
    </Card>
  );
}

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects"],
    queryFn: () => listProspects(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateProspectStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prospects"] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as string;
    if (!COLUMNS.some((c) => c.id === newStatus)) return;
    const prospect = prospects.find((p) => p.id === active.id);
    if (prospect && prospect.status !== newStatus) {
      updateStatus.mutate({ id: prospect.id, status: newStatus });
    }
  }

  const byStatus = COLUMNS.reduce<Record<string, Prospect[]>>((acc, col) => {
    acc[col.id] = prospects.filter((p) => p.status === col.id);
    return acc;
  }, {});

  const activeProspect = activeId ? prospects.find((p) => p.id === activeId) : null;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => (
                <Column
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  prospects={byStatus[col.id] ?? []}
                />
              ))}
            </div>
            <DragOverlay>
              {activeProspect ? <ProspectCard prospect={activeProspect} isDrag /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  );
}
