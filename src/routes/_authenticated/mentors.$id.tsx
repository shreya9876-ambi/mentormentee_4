import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarImg } from "@/components/avatar-image";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Briefcase, GraduationCap, Globe, MessageSquare, Video, Calendar, Sparkles, Building2, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mentors/$id")({
  component: MentorDetail,
});

function MentorDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<any>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await api.mentors.getById(id);
      setMentor(data);
    } catch {
      setMentor(null);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    api.requests.list().then((reqs) => {
      const existing = reqs.find((r: any) => r.mentor_id === id && r.mentee_id === user.id);
      setRequestStatus(existing?.status ?? null);
    });
  }, [user, id]);

  async function sendRequest() {
    if (!user) return;
    setSending(true);
    try {
      await api.requests.create(id, message);
      setSending(false);
      toast.success("Mentorship & interview guidance request sent!");
      setRequestStatus("pending");
      setOpen(false);
    } catch (err: unknown) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    }
  }

  if (!mentor) return <AppShell><p className="text-muted-foreground py-10 text-center">Loading mentor profile…</p></AppShell>;

  const defaultMeetUrl = `https://meet.jit.si/pcooer-mentorship-${id.substring(0, 8)}-${user?.id ? user.id.substring(0, 8) : "session"}`;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="border-t-4 border-t-primary shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <AvatarImg path={mentor.avatar_url} name={mentor.full_name} className="h-24 w-24 rounded-full border shadow-md" />
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl md:text-3xl font-bold">{mentor.full_name}</h1>
                  <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700">
                    Verified Alumni
                  </Badge>
                </div>

                <div className="text-primary font-medium text-base mt-1">
                  {mentor.designation}{mentor.company ? ` · ${mentor.company}` : ""}
                </div>

                {mentor.company && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent mt-2 bg-accent/10 px-2.5 py-1 rounded-md">
                    <Building2 className="h-3.5 w-3.5" /> Working at {mentor.company}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {mentor.graduation_year && (
                    <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded">
                      <GraduationCap className="h-4 w-4 text-primary" /> Batch of {mentor.graduation_year}
                    </span>
                  )}
                  {mentor.department && (
                    <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded">
                      {mentor.department}
                    </span>
                  )}
                  {mentor.experience_years > 0 && (
                    <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded">
                      <Briefcase className="h-4 w-4" /> {mentor.experience_years} years industry exp
                    </span>
                  )}
                  {mentor.linkedin_url && (
                    <a href={mentor.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline bg-muted px-2.5 py-1 rounded">
                      <Globe className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                </div>

                {/* Skills/Expertise */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(mentor.expertise ?? []).map((x: string) => (
                    <Badge key={x} variant="secondary" className="text-xs">{x}</Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Student */}
              <div className="flex flex-col gap-2 min-w-[180px]">
                {role === "student" && (
                  <>
                    <Button onClick={() => navigate({ to: "/messages/$userId", params: { userId: id } })} className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" /> Chat Message
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                      <a href={defaultMeetUrl} target="_blank" rel="noreferrer">
                        <Video className="h-4 w-4 mr-2 text-primary" /> Start Instant Call
                      </a>
                    </Button>

                    {requestStatus === "accepted" ? (
                      <Badge variant="outline" className="justify-center py-1 text-emerald-600 border-emerald-300">
                        ✓ Connected
                      </Badge>
                    ) : requestStatus === "pending" ? (
                      <Button disabled variant="secondary" className="w-full">Request Pending</Button>
                    ) : requestStatus === "rejected" ? (
                      <Button disabled variant="outline" className="w-full text-destructive">Request Declined</Button>
                    ) : (
                      <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" className="w-full">
                            <Sparkles className="h-4 w-4 mr-1.5 text-accent" /> Request Guidance
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Interview Guidance & Mentorship</DialogTitle>
                            <DialogDescription>
                              Applied for {mentor.company || "a role"} or want referral advice? Introduce yourself and tell {mentor.full_name} what you need help with.
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            placeholder={`Hi ${mentor.full_name}, I have applied for ${mentor.company ? `a role at ${mentor.company}` : "software roles"} and would love your guidance on the interview process and preparation tips.`}
                          />
                          <DialogFooter>
                            <Button onClick={sendRequest} disabled={sending}>
                              {sending ? "Sending…" : "Send Request"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Card */}
        <Card>
          <CardHeader>
            <CardTitle>About & Experience</CardTitle>
            <CardDescription>Background and guidance domains</CardDescription>
          </CardHeader>
          <CardContent className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {mentor.bio || `${mentor.full_name} is an alumnus from the batch of ${mentor.graduation_year || "our college"} currently working as ${mentor.designation || "an industry professional"} at ${mentor.company || "tech industry"}.`}
          </CardContent>
        </Card>

        {/* Availability & Booking Slots */}
        <AvailabilityView mentor={mentor} slots={mentor.slots || []} onReload={loadData} />
      </div>
    </AppShell>
  );
}

function AvailabilityView({ mentor, slots, onReload }: { mentor: any; slots: any[]; onReload: () => void }) {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [booking, setBooking] = useState<string | null>(null);

  async function book(slot: any) {
    if (!user) return;
    setBooking(slot.id);
    try {
      const meetUrl = `https://meet.jit.si/mentor-session-${slot.id.substring(0, 8)}`;
      await api.sessions.book({
        mentorId: mentor.id,
        slotId: slot.id,
        scheduledAt: slot.start_time,
        topic: topic || (mentor.company ? `Interview Preparation & Guidance for ${mentor.company}` : "1-on-1 Mentorship Call"),
        meetingUrl: meetUrl,
      });
      toast.success("1-on-1 Session booked! You can join via Google Meet / Video call at the scheduled time.");
      onReload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to book session");
    } finally {
      setBooking(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" /> Schedule a 1-on-1 Guidance Call
        </CardTitle>
        <CardDescription>
          Pick an available slot for a 1-on-1 mock interview, resume review, or company interview guidance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            Discussion Topic / Questions:
          </label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={2}
            placeholder={mentor.company ? `e.g. Interview process and round guidance for ${mentor.company}` : "e.g. Resume review, coding round preparation"}
          />
        </div>

        {slots.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No open availability slots currently scheduled by this alumni. You can still message them directly above!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3.5 bg-card hover:bg-muted/40 transition">
                <div className="text-sm">
                  <div className="font-semibold text-foreground">{new Date(s.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <Button size="sm" onClick={() => book(s)} disabled={booking === s.id}>
                  {booking === s.id ? "Booking…" : "Book Call"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
