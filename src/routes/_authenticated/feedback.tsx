import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: FeedbackPage,
});

type SessionRow = {
  id: string;
  scheduled_at: string;
  status: string;
  mentor_id: string;
  mentee_id: string;
  topic?: string | null;
  other_name?: string;
  existing?: { rating: number; review?: string | null } | null;
};

function FeedbackPage() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.feedback.getFeedback();
      const fbMap = new Map((data.feedback ?? []).map((f: any) => [f.session_id, f]));

      const list = (data.sessions ?? []).map((s: any) => ({
        id: s.id,
        scheduled_at: s.scheduled_at,
        status: "completed",
        mentor_id: s.mentor_id,
        mentee_id: s.mentee_id,
        topic: s.topic,
        other_name: s.mentor_id === user.id ? s.mentee?.full_name : s.mentor?.full_name,
        existing: fbMap.get(s.id) || null,
      }));
      setRows(list);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (role && role !== "mentor" && role !== "student") {
    return (
      <AppShell>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Feedback is available on mentor and student profiles.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2">
            <Heart className="h-7 w-7 text-accent" /> Feedback
          </h1>
          <p className="text-muted-foreground mt-1">
            Rate your sessions to help build a trusted mentorship community.
          </p>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && rows.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No completed sessions yet. Once a session is marked complete, it will appear here for rating.
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {rows.map((s) => (
            <SessionFeedback
              key={s.id}
              session={s}
              onSaved={(rating, review) =>
                setRows((rs) =>
                  rs.map((r) => (r.id === s.id ? { ...r, existing: { rating, review } } : r)),
                )
              }
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function SessionFeedback({
  session,
  onSaved,
}: {
  session: SessionRow;
  onSaved: (rating: number, review: string | null) => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(session.existing?.rating ?? 0);
  const [review, setReview] = useState<string>(session.existing?.review ?? "");
  const [saving, setSaving] = useState(false);
  const submitted = !!session.existing;

  async function save() {
    if (!user) return;
    if (rating < 1) {
      toast.error("Pick a star rating first");
      return;
    }
    setSaving(true);
    try {
      await api.feedback.submit({
        sessionId: session.id,
        rating,
        review: review.trim() || undefined,
      });
      setSaving(false);
      toast.success("Thanks for your feedback!");
      onSaved(rating, review.trim() || null);
    } catch (err: unknown) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Failed to save feedback");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {session.topic || "Mentorship session"} · {session.other_name}
            </CardTitle>
            <CardDescription>
              {new Date(session.scheduled_at).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant={session.status === "completed" ? "default" : "secondary"}>
            {session.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={submitted}
              onClick={() => setRating(n)}
              className="p-1 disabled:cursor-not-allowed"
            >
              <Star
                className={
                  "h-6 w-6 transition " +
                  (n <= rating
                    ? "fill-accent text-accent"
                    : "text-muted-foreground hover:text-accent")
                }
              />
            </button>
          ))}
        </div>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share what went well or what could improve…"
          rows={3}
          disabled={submitted}
        />
        {submitted ? (
          <p className="text-sm text-muted-foreground">✓ Feedback submitted</p>
        ) : (
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Submit feedback"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
