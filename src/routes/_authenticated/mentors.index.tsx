import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarImg } from "@/components/avatar-image";
import {
  Search, Briefcase, GraduationCap, Building2, Sparkles,
  MessageSquare, Users, CheckCircle, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/mentors/")({
  component: Mentors,
});

type MentorRow = {
  user_id: string;
  company?: string | null;
  designation?: string | null;
  experience_years?: number | null;
  expertise?: string[] | null;
  department?: string | null;
  graduation_year?: number | null;
  bio?: string | null;
  full_name: string;
  avatar_url?: string | null;
};

function Mentors() {
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [q, setQ] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.mentors.list({ approvedOnly: true }).then((data) => {
      setMentors((data as MentorRow[]) ?? []);
      setLoading(false);
    });
  }, []);

  const companies = useMemo(() => {
    const set = new Set(mentors.map((m) => m.company?.trim()).filter(Boolean));
    return Array.from(set) as string[];
  }, [mentors]);

  const years = useMemo(() => {
    const set = new Set(mentors.map((m) => m.graduation_year).filter(Boolean));
    return Array.from(set).sort((a, b) => (b as number) - (a as number)) as number[];
  }, [mentors]);

  const departments = useMemo(() => {
    const set = new Set(mentors.map((m) => m.department?.trim()).filter(Boolean));
    return Array.from(set) as string[];
  }, [mentors]);

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      if (selectedCompany && m.company?.toLowerCase() !== selectedCompany.toLowerCase()) return false;
      if (selectedYear && String(m.graduation_year) !== selectedYear) return false;
      if (selectedDept && m.department?.toLowerCase() !== selectedDept.toLowerCase()) return false;
      if (!q.trim()) return true;
      const query = q.toLowerCase().trim();
      const hay = [
        m.full_name, m.company, m.designation, m.department,
        m.graduation_year ? `class of ${m.graduation_year}` : "",
        ...(m.expertise ?? []),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [mentors, q, selectedCompany, selectedYear, selectedDept]);

  const clearFilters = () => {
    setQ("");
    setSelectedCompany("");
    setSelectedYear("");
    setSelectedDept("");
  };

  const hasActiveFilters = q || selectedCompany || selectedYear || selectedDept;

  // Calculate the 5 newest mentors (most recent graduation year)
  const newestMentors = useMemo(() =>
    [...mentors].sort((a, b) => (b.graduation_year ?? 0) - (a.graduation_year ?? 0)).slice(0, 5),
    [mentors]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Hero Banner */}
        <div className="rounded-xl bg-hero text-primary-foreground p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Alumni Directory &amp; Placements
              </div>
              <h1 className="font-display text-3xl md:text-4xl mt-2">Connect with Alumni Mentors</h1>
              <p className="text-primary-foreground/80 mt-1 max-w-2xl text-sm md:text-base">
                Applied for a company or preparing for interviews? Search for PCCOER alumni at that company and get 1-on-1 interview tips, referrals, and guidance.
              </p>
            </div>

            {/* Live Stats */}
            <div className="flex gap-5 text-center shrink-0">
              <div>
                <div className="text-4xl font-display font-bold leading-none">
                  {loading ? "–" : mentors.length}
                </div>
                <div className="text-xs text-primary-foreground/70 mt-1">Verified Alumni</div>
              </div>
              <div className="border-l border-white/20 pl-5">
                <div className="text-4xl font-display font-bold leading-none">
                  {loading ? "–" : companies.length}
                </div>
                <div className="text-xs text-primary-foreground/70 mt-1">Companies</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Alumni Summary Row — always visible, showing the 5 newest */}
        {!loading && mentors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold">
                Recently Verified Alumni
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({mentors.length} total · All placement cell approved)
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {newestMentors.map((m) => (
                <Link
                  key={m.user_id}
                  to="/mentors/$id"
                  params={{ id: m.user_id }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-muted transition-colors text-xs group"
                >
                  <AvatarImg path={m.avatar_url} name={m.full_name} className="h-7 w-7 rounded-full border" />
                  <div>
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {m.full_name.split(" ")[0]}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {m.company ?? "–"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by company (Google, TCS, HPE…), name, role, or skills…"
                  className="pl-9 h-11"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {companies.length > 0 && (
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All Companies</option>
                    {companies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}

                {years.length > 0 && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All Batches</option>
                    {years.map((y) => (
                      <option key={y} value={String(y)}>Batch of {y}</option>
                    ))}
                  </select>
                )}

                {departments.length > 0 && (
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                    Reset filters
                  </Button>
                )}
              </div>
            </div>

            {/* Popular company filter chips */}
            {companies.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Quick filter:
                </span>
                {companies.map((comp) => (
                  <button
                    key={comp}
                    onClick={() => setSelectedCompany(selectedCompany === comp ? "" : comp)}
                    className={`rounded-full px-2.5 py-1 text-xs transition border cursor-pointer ${
                      selectedCompany === comp
                        ? "bg-accent text-accent-foreground border-accent font-medium"
                        : "bg-muted hover:bg-muted/80 text-foreground border-border"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Results count */}
        {!loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Showing <strong className="text-foreground">{filtered.length}</strong> of{" "}
            <strong className="text-foreground">{mentors.length}</strong> verified alumni
            {hasActiveFilters && (
              <span className="text-xs">(filtered)</span>
            )}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <div className="text-muted-foreground">No alumni mentors found matching your search.</div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear all search filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((m) => (
              <Card key={m.user_id} className="hover:shadow-lg transition-shadow flex flex-col justify-between border-t-4 border-t-primary">
                <CardContent className="pt-6 space-y-4">
                  {/* Top: Avatar and basic info */}
                  <div className="flex items-start gap-3">
                    <AvatarImg path={m.avatar_url} name={m.full_name} className="h-14 w-14 rounded-full border shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-lg leading-tight truncate">{m.full_name}</div>
                      <div className="text-sm font-medium text-primary mt-0.5 truncate">
                        {m.designation || "Alumni Mentor"}
                      </div>
                      {m.company && (
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-accent mt-1 bg-accent/10 px-2 py-0.5 rounded">
                          <Building2 className="h-3 w-3" /> {m.company}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges: Graduation & Dept */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {m.graduation_year && (
                      <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                        <GraduationCap className="h-3.5 w-3.5 text-primary" /> Batch of {m.graduation_year}
                      </span>
                    )}
                    {m.department && (
                      <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                        {m.department}
                      </span>
                    )}
                    {m.experience_years != null && m.experience_years > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded">
                        <Briefcase className="h-3.5 w-3.5" /> {m.experience_years} yr{m.experience_years > 1 ? "s" : ""} exp
                      </span>
                    ) : m.experience_years === 0 ? (
                      <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded">
                        <TrendingUp className="h-3.5 w-3.5" /> Fresher
                      </span>
                    ) : null}
                  </div>

                  {/* Bio */}
                  {m.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {m.bio}
                    </p>
                  )}

                  {/* Expertise skills */}
                  {(m.expertise ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(m.expertise ?? []).slice(0, 4).map((x) => (
                        <Badge key={x} variant="secondary" className="text-[11px] font-normal">
                          {x}
                        </Badge>
                      ))}
                      {(m.expertise ?? []).length > 4 && (
                        <Badge variant="outline" className="text-[11px] font-normal">
                          +{(m.expertise ?? []).length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Company Guidance Callout */}
                  {m.company && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 text-xs text-foreground/80">
                      💡 <strong>Interviewing at {m.company}?</strong> Connect with {m.full_name.split(" ")[0]} for insider tips.
                    </div>
                  )}
                </CardContent>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 border-t mt-4 flex items-center gap-2">
                  <Button asChild className="flex-1" size="sm">
                    <Link to="/mentors/$id" params={{ id: m.user_id }}>
                      View &amp; Connect
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/messages/$userId" params={{ userId: m.user_id }}>
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
