import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api, type SessionStatus } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Video, Trash2, CalendarPlus } from "lucide-react";
import { googleCalendarUrl } from "@/lib/avatar";

export const Route = createFileRoute("/_authenticated/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.sessions.list();
      setSessions(data);
    } catch {
      setSessions([]);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateSession(id: string, status?: SessionStatus, meetingUrl?: string) {
    try {
      await api.sessions.updateStatus(id, status, meetingUrl);
      toast.success("Updated");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update session");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <h1 className="font-display text-3xl">Sessions</h1>
          {role === "mentor" && <AddSlot onAdded={load} />}
        </div>

        {role === "mentor" && <MentorSlots />}

        {sessions.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No sessions yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const other = s.mentor_id === user!.id ? s.mentee : s.mentor;
              const isMentor = s.mentor_id === user!.id;
              return (
                <Card key={s.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-accent" />
                          <span className="font-medium">{new Date(s.scheduled_at).toLocaleString()}</span>
                          <Badge variant={s.status === "confirmed" ? "default" : "secondary"}>{s.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">With {other?.full_name ?? "—"}</div>
                        {s.topic && <p className="text-sm mt-2">{s.topic}</p>}
                        {s.meeting_url && (
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <a href={s.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                              <Video className="h-4 w-4" /> Join meeting
                            </a>
                            <a
                              href={googleCalendarUrl({
                                title: `Mentor session with ${other?.full_name ?? "Mentor Connect"}`,
                                start: s.scheduled_at,
                                end: s.end_at ?? new Date(new Date(s.scheduled_at).getTime() + 60 * 60 * 1000).toISOString(),
                                details: `${s.topic ?? ""}\n\nJoin link: ${s.meeting_url}`,
                                location: s.meeting_url,
                              })}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
                            >
                              <CalendarPlus className="h-4 w-4" /> Add to Google Calendar
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isMentor && s.status === "pending" && (
                          <Button size="sm" onClick={() => updateSession(s.id, "confirmed")}>Confirm</Button>
                        )}
                        {isMentor && s.status === "confirmed" && (
                          <Button size="sm" variant="outline" onClick={() => updateSession(s.id, "completed")}>Mark complete</Button>
                        )}
                        {s.status !== "completed" && s.status !== "cancelled" && (
                          <Button size="sm" variant="ghost" onClick={() => updateSession(s.id, "cancelled")}>Cancel</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AddSlot({ onAdded }: { onAdded: () => void }) {
  const { user } = useAuth();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function add() {
    if (!user || !start || !end) return;
    try {
      await api.slots.create(start, end);
      toast.success("Slot added");
      setStart("");
      setEnd("");
      onAdded();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add slot");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="h-9" />
      <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="h-9" />
      <Button size="sm" onClick={add}>Add slot</Button>
    </div>
  );
}

function MentorSlots() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.slots.list();
      setSlots(data);
    } catch {
      setSlots([]);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function del(id: string) {
    try {
      await api.slots.delete(id);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete slot");
    }
  }

  if (slots.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">My availability slots</CardTitle></CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-2">
          {slots.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <div>
                <div className="font-medium">{new Date(s.start_time).toLocaleString()}</div>
                <div className="text-muted-foreground text-xs">{s.is_booked ? "Booked" : "Open"}</div>
              </div>
              {!s.is_booked && <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
