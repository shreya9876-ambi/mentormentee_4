import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, GraduationCap, Building2, ExternalLink, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/$userId")({
  component: Conversation,
});

function Conversation() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.messages.getMessages(userId);
      if (data.otherUser) setOther(data.otherUser);
      setMessages(data.messages || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      // silent catch for interval polling
    }
  }, [user, userId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  async function send() {
    if (!user || !content.trim()) return;
    const text = content.trim();
    setContent("");
    try {
      const newMsg = await api.messages.send(userId, text);
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  const isStudentOther = other?.role === "student";
  const isMentorOther = other?.role === "mentor";

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Chat Header with Interconnected Student/Alumni Details */}
        <div className="border-b pb-3 mb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button asChild variant="ghost" size="icon" className="shrink-0 md:hidden">
                <Link to="/messages">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>

              <Avatar className="h-10 w-10 border shadow-xs shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {other?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl md:text-2xl font-bold truncate">
                    {other?.full_name ?? "Conversation"}
                  </h1>
                  {isStudentOther && (
                    <Badge variant="secondary" className="text-xs">Registered Student</Badge>
                  )}
                  {isMentorOther && other?.company && (
                    <Badge variant="default" className="text-xs bg-emerald-600">
                      <Building2 className="h-3 w-3 mr-1" /> {other.company}
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                  {other?.email && <span>{other.email}</span>}
                  {other?.department && (
                    <span className="inline-flex items-center gap-1">
                      · <GraduationCap className="h-3.5 w-3.5 text-primary" /> {other.department}
                    </span>
                  )}
                  {other?.academic_year && <span>· {other.academic_year}</span>}
                  {other?.designation && <span>· {other.designation}</span>}
                  {other?.graduation_year && <span>· Batch of {other.graduation_year}</span>}
                </div>
              </div>
            </div>

            {isMentorOther && (
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex shrink-0">
                <Link to="/mentors/$id" params={{ id: userId }}>
                  View Profile <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {/* Student Career Target callout for mentors */}
          {isStudentOther && other?.career_goals && (
            <div className="mt-2.5 bg-accent/5 border border-accent/20 rounded-md px-3 py-1.5 text-xs text-foreground/85 flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong>Student Career Goals:</strong> {other.career_goals}
              </div>
              {other.skills && other.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {other.skills.slice(0, 4).map((sk: string) => (
                    <Badge key={sk} variant="outline" className="text-[10px] py-0">{sk}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <p className="text-sm">Start your conversation with {other?.full_name || "this user"}.</p>
              <p className="text-xs mt-1">Ask questions regarding interviews, guidance, or placement advice.</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                  <div
                    className={
                      "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-2xs " +
                      (mine
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-muted text-foreground rounded-bl-xs")
                    }
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    <div
                      className={
                        "text-[10px] mt-1 text-right " +
                        (mine ? "text-primary-foreground/70" : "text-muted-foreground")
                      }
                    >
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Send Input */}
        <Card className="mt-3 p-2 flex items-center gap-2 border-primary/20">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message ${other?.full_name || "here"}…`}
            className="border-0 focus-visible:ring-0 shadow-none text-sm"
          />
          <Button onClick={send} size="sm" className="bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
