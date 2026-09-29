import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Building2, GraduationCap, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: MessagesIndex,
});

function MessagesIndex() {
  const { user, role } = useAuth();
  const [convos, setConvos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.messages
      .getConversations()
      .then((data) => {
        setConvos(data || []);
      })
      .catch(() => setConvos([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return convos;
    const q = search.toLowerCase();
    return convos.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q) ||
        c.career_goals?.toLowerCase().includes(q)
    );
  }, [convos, search]);

  const isMentor = role === "mentor";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {isMentor ? "Student Messages & Inquiries" : "Messages & Conversations"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isMentor
                ? "Registered students seeking guidance, interview advice, or referral tips from you."
                : "Chat directly with verified alumni mentors currently working in industry."}
            </p>
          </div>

          {!isMentor && (
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-sm shrink-0">
              <Link to="/mentors">
                <Sparkles className="h-4 w-4 mr-1.5" /> Find More Alumni Mentors
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        {convos.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isMentor
                  ? "Search students by name, email, department, target role..."
                  : "Search alumni by name, company, role..."
              }
              className="pl-9"
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6 h-24 bg-muted/20" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">
                {search ? "No matching conversations found" : "No active conversations yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isMentor
                  ? "When students find your profile in the alumni directory and send you messages or interview questions, they will show up here."
                  : "Connect with alumni from Google, HPE, FOX, Capgemini, TCS and more to start a conversation!"}
              </p>
              {!isMentor && !search && (
                <Button asChild className="mt-2">
                  <Link to="/mentors">Browse Verified Alumni</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <Link key={p.id} to="/messages/$userId" params={{ userId: p.id }} className="block group">
                <Card className="hover:shadow-md hover:border-primary/50 transition-all">
                  <CardContent className="py-4 px-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <Avatar className="h-11 w-11 mt-0.5 border shadow-xs">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                          {p.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                            {p.full_name}
                          </span>
                          {p.email && <span className="text-xs text-muted-foreground">({p.email})</span>}
                          {p.role === "student" && (
                            <Badge variant="secondary" className="text-[11px]">Registered Student</Badge>
                          )}
                          {p.role === "mentor" && p.company && (
                            <Badge variant="default" className="text-[11px] bg-emerald-600">
                              <Building2 className="h-3 w-3 mr-1" /> {p.company}
                            </Badge>
                          )}
                        </div>

                        {/* Additional student details */}
                        {p.role === "student" && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {p.department && (
                              <span className="inline-flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5 text-primary" /> {p.department}
                              </span>
                            )}
                            {p.academic_year && <span>· {p.academic_year}</span>}
                            {p.career_goals && (
                              <span className="text-foreground/80 font-medium truncate max-w-xs">
                                · Target: {p.career_goals}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Additional alumni details */}
                        {p.role === "mentor" && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {p.designation && <span>{p.designation}</span>}
                            {p.graduation_year && <span>· Batch of {p.graduation_year}</span>}
                          </div>
                        )}

                        {/* Last message preview */}
                        {p.last_message && (
                          <p className="text-xs text-muted-foreground line-clamp-1 pt-0.5 group-hover:text-foreground/80 transition-colors">
                            <span className="font-medium text-foreground/70">Latest: </span>
                            {p.last_message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      {p.last_message_time && (
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(p.last_message_time).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Chat <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
