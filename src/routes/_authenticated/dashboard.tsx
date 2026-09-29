import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ mentors: 0, mentees: 0, meetings: 0 });

  useEffect(() => {
    if (!role) return;
    if (role === "mentor") { navigate({ to: "/requests", replace: true }); return; }
    if (role === "student") { navigate({ to: "/mentors", replace: true }); return; }
    if (role === "admin") {
      api.dashboard.getStats().then((stats) => {
        if (stats) {
          setCounts({
            mentors: stats.mentorsCount ?? 0,
            mentees: stats.studentsCount ?? 0,
            meetings: stats.sessionsCount ?? 0,
          });
        }
      });
    }
  }, [role, navigate]);

  if (role !== "admin") {
    return <AppShell><div /></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-xl bg-hero text-primary-foreground p-6 md:p-8 shadow-lg">
          <h1 className="font-display text-3xl md:text-4xl leading-tight">Placement Cell · Overview</h1>
          <p className="mt-2 text-primary-foreground/80 max-w-2xl">A snapshot of mentors, mentees and meetings on the platform.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Stat icon={Users} label="Verified Alumni Mentors" value={counts.mentors} tone="success" />
          <Stat icon={GraduationCap} label="Registered Students" value={counts.mentees} tone="accent" />
          <Stat icon={Calendar} label="Mentorship Sessions" value={counts.meetings} tone="primary" />
        </div>

        <Card className="border-accent/40 bg-accent/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Placement Cell · Records & Verification Portal</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add new alumni and students, update passout batches, verify credentials, and manage placements.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/admin" })}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition shadow shrink-0"
          >
            Open Placement Portal →
          </button>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: string }) {
  const toneCls: Record<string, string> = {
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <Card>
      <CardContent className="pt-6 flex items-center justify-between">
        <div>
          <div className="text-4xl font-display">{value}</div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
        <div className={"h-12 w-12 rounded-lg flex items-center justify-center " + (toneCls[tone] ?? "")}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
