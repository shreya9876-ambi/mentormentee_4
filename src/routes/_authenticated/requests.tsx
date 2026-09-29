import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api, type RequestStatus } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user || !role) return;
    try {
      const data = await api.requests.list();
      setItems(data);
    } catch {
      setItems([]);
    }
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  if (role && role !== "mentor") {
    return (
      <AppShell>
        <Card><CardContent className="py-10 text-center text-muted-foreground">Requests are visible only to mentors.</CardContent></Card>
      </AppShell>
    );
  }

  async function setStatus(id: string, status: RequestStatus) {
    try {
      await api.requests.updateStatus(id, status);
      toast.success("Updated");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update request");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{role === "mentor" ? "Mentorship & Guidance Inquiries" : "My Mentorship Requests"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {role === "mentor"
              ? "Students who are preparing for placements and seeking guidance from you."
              : "Track responses from verified alumni mentors."}
          </p>
        </div>

        {items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No mentorship requests yet.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {items.map((r) => (
              <Card key={r.id} className="hover:shadow-sm transition">
                <CardContent className="pt-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-base">{r.other_user?.full_name ?? "Unknown"}</span>
                      {r.other_user?.email && <span className="text-xs text-muted-foreground">({r.other_user.email})</span>}
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Student academic details if visible */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {r.other_user?.department && (
                        <Badge variant="secondary" className="font-normal">{r.other_user.department}</Badge>
                      )}
                      {r.other_user?.academic_year && (
                        <Badge variant="outline" className="font-normal">{r.other_user.academic_year}</Badge>
                      )}
                      {r.other_user?.company && (
                        <Badge variant="secondary" className="font-normal">{r.other_user.company}</Badge>
                      )}
                    </div>

                    {r.other_user?.career_goals && (
                      <div className="text-xs text-foreground/80 bg-muted/40 p-2 rounded">
                        <strong>Student Career Target:</strong> {r.other_user.career_goals}
                      </div>
                    )}

                    {r.message && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm text-foreground">
                        <div className="text-[11px] font-semibold text-primary mb-1">Message from Student:</div>
                        <p className="whitespace-pre-wrap">{r.message}</p>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground">
                      Received: {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button asChild size="sm" variant="default" className="bg-primary">
                      <Link to="/messages/$userId" params={{ userId: r.other_user.id }}>
                        Message Student
                      </Link>
                    </Button>

                    {role === "mentor" && r.status === "pending" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "accepted")}>Accept</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(r.id, "rejected")}>Decline</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: "secondary",
    accepted: "default",
    rejected: "destructive",
    cancelled: "outline",
  };
  return <Badge variant={map[status] ?? "secondary"}>{status}</Badge>;
}
