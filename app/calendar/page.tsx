"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMeetings, listProspects, createMeeting, deleteMeeting, listUsers } from "@/services/api";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", format(monthStart, "yyyy-MM"), format(monthEnd, "yyyy-MM")],
    queryFn: () => listMeetings({ from_date: format(monthStart, "yyyy-MM-dd"), to_date: format(monthEnd, "yyyy-MM-dd") }),
  });
  const { data: prospects } = useQuery({ queryKey: ["prospects"], queryFn: listProspects });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const deleteOne = useMutation({ mutationFn: deleteMeeting, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }) });

  const meetingsByDay: Record<string, typeof meetings> = {};
  meetings.forEach((m) => {
    const d = format(new Date(m.meeting_date), "yyyy-MM-dd");
    if (!meetingsByDay[d]) meetingsByDay[d] = [];
    meetingsByDay[d].push(m);
  });

  const prospectName = (id: string) => prospects?.find((p) => p.id === id)?.name ?? id;
  const userName = (id: string | undefined) => users?.find((u) => u.id === id)?.name ?? "-";

  const padStart = monthStart.getDay();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex gap-2">
            <Link href="/calendar/new">
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add meeting</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setCurrent(subMonths(current, 1))}>Prev</Button>
            <span className="text-lg font-medium min-w-[180px] text-center">{format(current, "MMMM yyyy")}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrent(addMonths(current, 1))}>Next</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: padStart }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[100px] rounded border bg-muted/20" />
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayMeetings = meetingsByDay[key] ?? [];
                return (
                  <div
                    key={key}
                    className={`min-h-[100px] rounded border p-1 ${isSameMonth(day, current) ? "bg-card" : "bg-muted/20"}`}
                  >
                    <div className="text-xs font-medium text-muted-foreground">{format(day, "d")}</div>
                    <ul className="mt-1 space-y-1">
                      {dayMeetings.map((m) => (
                        <li key={m.id} className="text-xs rounded bg-primary/10 px-1 py-0.5 truncate" title={prospectName(m.prospect_id)}>
                          {prospectName(m.prospect_id)} · {userName(m.assigned_rep)}
                          <Button variant="ghost" size="icon" className="h-4 w-4 ml-0.5" onClick={() => confirm("Delete meeting?") && deleteOne.mutate(m.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {meetings.slice(0, 10).map((m) => (
                <li key={m.id} className="flex justify-between text-sm">
                  <span>{format(new Date(m.meeting_date), "PP")} — {prospectName(m.prospect_id)} ({userName(m.assigned_rep)})</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteOne.mutate(m.id)}>Delete</Button>
                </li>
              ))}
            </ul>
            {meetings.length === 0 && <p className="text-muted-foreground text-sm">No meetings in this range.</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
