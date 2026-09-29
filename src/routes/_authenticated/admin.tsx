import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, GraduationCap, ShieldCheck, Calendar, Search, Building2, Edit3, CheckCircle2, XCircle, UserPlus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { role, loading: authLoading } = useAuth();
  const [mentors, setMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getData();
      setMentors(data.mentors || []);
      setStudents(data.students || []);
      setSessions(data.sessions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load admin data";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data once role is confirmed to be admin
  useEffect(() => {
    if (role === "admin") {
      load();
    }
  }, [role, load]);

  if (authLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-muted rounded w-64" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppShell>
    );
  }

  if (role && role !== "admin") {
    return (
      <AppShell>
        <Card><CardContent className="py-10 text-center text-muted-foreground">Admin access required.</CardContent></Card>
      </AppShell>
    );
  }

  const approvedMentors = mentors.filter((m) => m.approved);
  const pendingMentors = mentors.filter((m) => !m.approved);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Placement Cell · Admin Portal</h1>
            <p className="text-muted-foreground mt-1">
              Manage alumni passout records, verify alumni working across companies, and view current registered students.
            </p>
          </div>
          <Button
            onClick={load}
            disabled={loading}
            variant="outline"
            className="shrink-0 flex items-center gap-2"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            )}
            {loading ? "Loading…" : "Refresh Data"}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={load}>Retry</Button>
          </div>
        )}

        {/* Metrics Grid */}
        {loading && mentors.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ShieldCheck} label="Verified Alumni" value={approvedMentors.length} tone="success" />
            <StatCard icon={Users} label="Pending Alumni Verifications" value={pendingMentors.length} tone="warning" />
            <StatCard icon={GraduationCap} label="Current Students" value={students.length} tone="accent" />
            <StatCard icon={Calendar} label="Mentorship Sessions" value={sessions.length} tone="primary" />
          </div>
        )}

        {/* Tabs for Managing Alumni, Students, and Verifications */}
        <Tabs defaultValue="alumni" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="alumni">All Alumni ({mentors.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingMentors.length})</TabsTrigger>
            <TabsTrigger value="students">Current Students ({students.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({sessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="alumni">
            {loading && mentors.length === 0 ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
              </div>
            ) : (
              <AlumniManagementTab mentors={mentors} onReload={load} />
            )}
          </TabsContent>

          <TabsContent value="pending">
            <AlumniManagementTab mentors={pendingMentors} onReload={load} isPendingOnly />
          </TabsContent>

          <TabsContent value="students">
            {loading && students.length === 0 ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
              </div>
            ) : (
              <StudentsManagementTab students={students} onReload={load} />
            )}
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsTab sessions={sessions} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: string }) {
  const toneCls: Record<string, string> = {
    success: "bg-success/10 text-success",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <Card>
      <CardContent className="pt-6 flex items-center justify-between">
        <div>
          <div className="text-3xl font-display font-bold">{value}</div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
        <div className={"h-12 w-12 rounded-lg flex items-center justify-center " + (toneCls[tone] ?? "")}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== ALUMNI MANAGEMENT TAB ====================
function AlumniManagementTab({ mentors, onReload, isPendingOnly }: { mentors: any[]; onReload: () => void; isPendingOnly?: boolean }) {
  const [q, setQ] = useState("");
  const [editingMentor, setEditingMentor] = useState<any>(null);
  const [showAddAlumni, setShowAddAlumni] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return mentors;
    const query = q.toLowerCase();
    return mentors.filter((m) =>
      m.full_name?.toLowerCase().includes(query) ||
      m.company?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.department?.toLowerCase().includes(query) ||
      (m.graduation_year && String(m.graduation_year).includes(query))
    );
  }, [mentors, q]);

  async function toggleApproval(userId: string, current: boolean) {
    try {
      await api.admin.approveMentor(userId, !current);
      toast.success(!current ? "Alumni verified & approved" : "Alumni approval revoked");
      onReload();
    } catch (err: unknown) {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search alumni by name, company (e.g. Google), batch year, email..."
            className="pl-9"
          />
        </div>

        {!isPendingOnly && (
          <Button onClick={() => setShowAddAlumni(true)} className="bg-primary hover:bg-primary/90 shadow-sm shrink-0">
            <UserPlus className="h-4 w-4 mr-2" /> Register New Alumni
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No alumni records found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.user_id} className="hover:shadow-sm transition">
              <CardContent className="pt-6 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{m.full_name}</span>
                    <span className="text-xs text-muted-foreground">({m.email})</span>
                    {m.approved ? (
                      <Badge variant="default" className="text-xs bg-emerald-600">Verified</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-amber-600 bg-amber-50">Pending Verification</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/80">
                    {m.company && (
                      <span className="inline-flex items-center gap-1 font-medium text-accent">
                        <Building2 className="h-3.5 w-3.5" /> {m.company}
                      </span>
                    )}
                    {m.designation && <span>· {m.designation}</span>}
                    {m.graduation_year && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" /> Batch of {m.graduation_year}
                      </span>
                    )}
                    {m.department && <span className="text-muted-foreground">· {m.department}</span>}
                  </div>

                  {m.bio && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.bio}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingMentor(m)}>
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Passout Details
                  </Button>

                  {m.approved ? (
                    <Button variant="ghost" size="sm" onClick={() => toggleApproval(m.user_id, true)} className="text-destructive hover:bg-destructive/10">
                      Revoke
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => toggleApproval(m.user_id, false)} className="bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve Alumni
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Alumni Dialog */}
      {editingMentor && (
        <EditAlumniModal
          mentor={editingMentor}
          onClose={() => setEditingMentor(null)}
          onSaved={() => { setEditingMentor(null); onReload(); }}
        />
      )}

      {/* Add Alumni Dialog */}
      {showAddAlumni && (
        <AddAlumniModal
          onClose={() => setShowAddAlumni(false)}
          onSaved={() => { setShowAddAlumni(false); onReload(); }}
        />
      )}
    </div>
  );
}

function EditAlumniModal({ mentor, onClose, onSaved }: { mentor: any; onClose: () => void; onSaved: () => void }) {
  const [gradYear, setGradYear] = useState(mentor.graduation_year ? String(mentor.graduation_year) : "");
  const [company, setCompany] = useState(mentor.company || "");
  const [designation, setDesignation] = useState(mentor.designation || "");
  const [department, setDepartment] = useState(mentor.department || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.admin.updateMentorDetails({
        mentorUserId: mentor.user_id,
        graduationYear: gradYear ? parseInt(gradYear) : undefined,
        company,
        designation,
        department,
      });
      toast.success("Alumni details updated successfully");
      onSaved();
    } catch (err: unknown) {
      toast.error("Failed to update alumni details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Alumni Record</DialogTitle>
          <DialogDescription>
            Update passout year, company, or department for {mentor.full_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Passout / Graduation Batch Year</label>
            <Input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="e.g. 2021" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Current Company</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google, Microsoft, TCS" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Job Designation</label>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">College Department</label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Engineering" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddAlumniModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [gradYear, setGradYear] = useState(String(new Date().getFullYear()));
  const [department, setDepartment] = useState("Computer Engineering");
  const [skills, setSkills] = useState("Software Engineering, System Design, DSA");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !company.trim()) {
      toast.error("Please fill in Name, Email, and Company");
      return;
    }
    setSaving(true);
    try {
      const res = await api.admin.createAlumni({
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim() || "password123",
        company: company.trim(),
        designation: designation.trim() || "Software Engineer",
        graduationYear: gradYear ? parseInt(gradYear) : new Date().getFullYear(),
        department: department.trim() || "Computer Engineering",
        expertise: skills.split(",").map((s) => s.trim()).filter(Boolean),
        bio: bio.trim() || `${fullName} is an alumnus working at ${company}.`,
        approved: true,
      });
      toast.success(`Alumni ${fullName} registered! Credentials email dispatched to ${email}.`);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to register alumni");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Alumni Mentor</DialogTitle>
          <DialogDescription>
            Register alumni records in MongoDB Atlas. A welcome email containing login credentials will be dispatched automatically, and students will immediately see them in the mentor directory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Full Name *</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Shashank Pawar" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Email Address *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. shashank@fox.alumni.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Current Company *</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google, HPE, FOX, TCS" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Job Designation</label>
              <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Software Engineer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Passout / Graduation Batch Year</label>
              <Input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="e.g. 2022" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">College Department</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Engineering" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Initial Login Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Default: password123" />
            <span className="text-[11px] text-muted-foreground">Alumni can log in with this password to answer student queries.</span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Skills & Mentorship Areas (comma separated)</label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. System Design, DSA, React, Interview Prep" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Bio / About</label>
            <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief introduction or guidance domains" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleRegister} disabled={saving} className="bg-primary">
            {saving ? "Saving to Database…" : "Save & Register Alumni"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== STUDENTS MANAGEMENT TAB ====================
function StudentsManagementTab({ students, onReload }: { students: any[]; onReload: () => void }) {
  const [q, setQ] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return students;
    const query = q.toLowerCase();
    return students.filter((s) =>
      s.full_name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.department?.toLowerCase().includes(query) ||
      s.academic_year?.toLowerCase().includes(query) ||
      s.career_goals?.toLowerCase().includes(query) ||
      s.skills?.some((sk: string) => sk.toLowerCase().includes(query))
    );
  }, [students, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students by name, email, department, year, skills..."
            className="pl-9"
          />
        </div>

        <Button onClick={() => setShowAddStudent(true)} className="bg-primary hover:bg-primary/90 shadow-sm shrink-0">
          <UserPlus className="h-4 w-4 mr-2" /> Register New Student
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No students registered yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.user_id}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-base">{s.full_name}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {s.department && <Badge variant="secondary">{s.department}</Badge>}
                    {s.academic_year && <Badge variant="outline">{s.academic_year}</Badge>}
                  </div>
                </div>

                {s.career_goals && (
                  <div className="text-xs text-foreground/80 bg-muted/40 p-2 rounded">
                    <strong>Career Goals / Target Roles:</strong> {s.career_goals}
                  </div>
                )}

                {s.skills && s.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {s.skills.map((sk: string) => (
                      <Badge key={sk} variant="outline" className="text-[10px]">{sk}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Student Dialog */}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onSaved={() => { setShowAddStudent(false); onReload(); }}
        />
      )}
    </div>
  );
}

function AddStudentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [department, setDepartment] = useState("Computer Engineering");
  const [academicYear, setAcademicYear] = useState("BE - Final Year");
  const [careerGoals, setCareerGoals] = useState("Software Development / SDE Placement");
  const [skills, setSkills] = useState("Data Structures, Java, React, SQL");
  const [saving, setSaving] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please enter Student Name and Email");
      return;
    }
    setSaving(true);
    try {
      await api.admin.createStudent({
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim() || "password123",
        department: department.trim() || "Computer Engineering",
        academicYear: academicYear.trim() || "BE - Final Year",
        careerGoals: careerGoals.trim(),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success(`Student ${fullName} registered! Credentials email dispatched to ${email}.`);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to register student");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Student</DialogTitle>
          <DialogDescription>
            Enter the student's details. Once registered, a login credentials email will be sent automatically so they can log in, view verified alumni, and send mentorship messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Student Full Name *</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Aarav Sharma" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Email Address *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. aarav.sharma@pcoer.in" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Initial Login Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Default: password123" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Department</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Engineering" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Academic Year</label>
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. TE, BE - Final Year" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Target Companies & Career Goals</label>
            <Input value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} placeholder="e.g. SDE at Google/HPE, Fullstack" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Skills (comma separated)</label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. DSA, Python, React, SQL" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleRegister} disabled={saving} className="bg-primary">
            {saving ? "Registering Student…" : "Register Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== SESSIONS MONITOR TAB ====================
function SessionsTab({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">No mentorship sessions recorded yet.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Scheduled & Completed Mentorship Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {sessions.map((sess) => (
            <div key={sess.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{sess.topic || "1-on-1 Mentorship Call"}</div>
                <div className="text-xs text-muted-foreground">
                  Alumni Mentor: <strong>{sess.mentor_name}</strong> · Student: <strong>{sess.mentee_name}</strong>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Scheduled for: {new Date(sess.scheduled_at).toLocaleString()}
                </div>
              </div>
              <Badge variant={sess.status === "confirmed" ? "default" : sess.status === "completed" ? "secondary" : "outline"}>
                {sess.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
