import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Briefcase, ShieldCheck, Sparkles, Building2, CheckCircle } from "lucide-react";
import { UNIVERSITY_DOMAIN, UNIVERSITY_NAME, isUniversityEmail } from "@/lib/university";
import type { AppRole } from "@/hooks/use-auth";

type AuthSearchParams = {
  role?: "student" | "mentor" | "admin";
  tab?: "signin" | "signup";
};

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): AuthSearchParams => {
    return {
      role: (search.role as "student" | "mentor" | "admin") || undefined,
      tab: (search.tab as "signin" | "signup") || undefined,
    };
  },
  head: () => ({ meta: [{ title: `Sign in · ${UNIVERSITY_NAME} Alumni–Student Connect` }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [selectedRole, setSelectedRole] = useState<AppRole>(
    search.role === "mentor" || search.role === "admin" ? search.role : "student"
  );
  const [activeTab, setActiveTab] = useState<string>(
    search.tab === "signup" ? "signup" : "signin"
  );

  useEffect(() => {
    if (search.role && (search.role === "student" || search.role === "mentor" || search.role === "admin")) {
      setSelectedRole(search.role);
    }
    if (search.tab && (search.tab === "signin" || search.tab === "signup")) {
      setActiveTab(search.tab);
    }
  }, [search.role, search.tab]);

  useEffect(() => {
    api.auth.getMe().then(({ user }) => {
      if (user) {
        if (user.role === "admin") navigate({ to: "/admin" });
        else if (user.role === "mentor") navigate({ to: "/requests" });
        else navigate({ to: "/mentors" });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen grid md:grid-cols-12 bg-background">
      {/* Left side brand banner */}
      <div className="hidden md:flex md:col-span-5 bg-hero text-primary-foreground p-10 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <GraduationCap className="h-7 w-7 text-accent" />
          <span className="font-display text-xl font-bold">{UNIVERSITY_NAME} Connect</span>
        </Link>

        <div className="space-y-6 relative z-10 my-auto py-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Placement Cell Initiative
          </div>
          <h1 className="font-display text-4xl leading-tight font-bold">
            Campus to Corporate Bridge
          </h1>
          <p className="text-primary-foreground/85 text-base leading-relaxed">
            Connect students with verified alumni working across top companies. Get 1-on-1 interview guidance, company insights, and referral opportunities.
          </p>

          <div className="space-y-3 pt-2 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span><strong>Students:</strong> Search alumni by company & prepare for interviews</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span><strong>Alumni:</strong> Mentor juniors & conduct 1-on-1 calls</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span><strong>Admin:</strong> Placement Cell oversight & alumni verifications</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-primary-foreground/60 border-t border-white/10 pt-4 relative z-10">
          Official PCCOER Platform · Email verification with @{UNIVERSITY_DOMAIN}
        </div>
      </div>

      {/* Right side form */}
      <div className="md:col-span-7 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between pb-2 border-b">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">{UNIVERSITY_NAME} Connect</span>
            </Link>
          </div>

          {/* Role Picker */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Select Your Role:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRole("student")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedRole === "student"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground font-medium shadow-sm"
                    : "border-border bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                <GraduationCap className={`h-6 w-6 mb-1 ${selectedRole === "student" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-semibold">Student</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Current Student</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("mentor")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedRole === "mentor"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground font-medium shadow-sm"
                    : "border-border bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                <Briefcase className={`h-6 w-6 mb-1 ${selectedRole === "mentor" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-semibold">Alumni</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Passed out Mentor</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                  selectedRole === "admin"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 text-foreground font-medium shadow-sm"
                    : "border-border bg-card hover:bg-muted text-muted-foreground"
                }`}
              >
                <ShieldCheck className={`h-6 w-6 mb-1 ${selectedRole === "admin" ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-semibold">Admin</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Placement Cell</span>
              </button>
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-2xl flex items-center justify-between">
                <span>
                  {selectedRole === "student" && "Student Login"}
                  {selectedRole === "mentor" && "Alumni Login"}
                  {selectedRole === "admin" && "Placement Cell Admin"}
                </span>
                <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">
                  {selectedRole === "mentor" ? "Alumni" : selectedRole}
                </span>
              </CardTitle>
              <CardDescription>
                {selectedRole === "student" && "Sign in to search alumni at your target companies and schedule guidance calls."}
                {selectedRole === "mentor" && "Sign in to share company experiences, guide juniors, and conduct 1-on-1 sessions."}
                {selectedRole === "admin" && "Sign in to verify alumni passout records and manage platform users."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <SignInForm role={selectedRole} />
                </TabsContent>

                <TabsContent value="signup">
                  <SignUpForm role={selectedRole} onSwitchToSignIn={() => setActiveTab("signin")} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ role }: { role: AppRole }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.signIn(email, password);
      setLoading(false);
      toast.success(`Welcome back, ${res.user.fullName}!`);
      window.dispatchEvent(new Event("auth-changed"));

      if (res.user.role === "admin") navigate({ to: "/admin" });
      else if (res.user.role === "mentor") navigate({ to: "/requests" });
      else navigate({ to: "/mentors" });
    } catch (err: unknown) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Invalid email or password");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {role === "student" && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs text-foreground/90 space-y-2.5">
          <div className="font-semibold text-primary flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" /> Demo Student Credentials
          </div>

          <div className="grid grid-cols-2 gap-2 bg-card rounded-lg p-2.5 border border-border text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium">Student ID / Email</span>
              <code className="font-mono font-semibold text-foreground select-all">student@pccoer.in</code>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-medium">Password</span>
              <code className="font-mono font-semibold text-foreground select-all">student123</code>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5 pt-0.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              Official student accounts are provisioned by the <strong>PCCOER Placement Cell</strong>. For review & testing, use the demo credentials above.
            </span>
          </div>
        </div>
      )}

      {role === "mentor" && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground/90 space-y-1.5">
          <div className="font-semibold text-muted-foreground text-[11px] flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Demo Alumni (Microsoft):
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            priya.patil@microsoft.alumni.com / password123
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signin-email">Email Address</Label>
        <Input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={role === "student" ? `student@${UNIVERSITY_DOMAIN}` : role === "admin" ? "shreya@gmail.com" : "alumni@example.com"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? "Signing in…" : `Sign in as ${role === "mentor" ? "Alumni" : role === "student" ? "Student" : "Admin"}`}
      </Button>
    </form>
  );
}

function SignUpForm({ role, onSwitchToSignIn }: { role: AppRole; onSwitchToSignIn?: () => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (role === "student") {
    return (
      <div className="py-6 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="space-y-2 max-w-sm mx-auto">
          <h3 className="font-semibold text-base text-foreground">Student Accounts are Admin-Created</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To ensure genuine campus placement records, student access is created and provisioned directly by the <strong>PCCOER Placement Cell</strong>.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-left space-y-2">
            <div className="font-semibold text-primary text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Demo Student Account for Testing:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 bg-card p-2 rounded-lg border border-border text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Student ID / Email:</span>
                <code className="font-mono font-semibold text-foreground select-all">student@pccoer.in</code>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Password:</span>
                <code className="font-mono font-semibold text-foreground select-all">student123</code>
              </div>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={onSwitchToSignIn}
          className="w-full max-w-xs mx-auto"
        >
          Sign In with Demo / Admin Credentials
        </Button>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="py-6 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="font-semibold text-sm">Placement Cell Admin</h3>
          <p className="text-xs text-muted-foreground">
            Admin accounts are provisioned internally by the university system administrators.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onSwitchToSignIn} className="text-xs">
          Go to Admin Sign In
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      await api.auth.signUp({
        email,
        password,
        fullName,
        role,
      });
      setLoading(false);
      window.dispatchEvent(new Event("auth-changed"));
      toast.success("Account created! Let's complete your profile.");
      navigate({ to: "/onboarding" });
    } catch (err: unknown) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Failed to create account");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="e.g. Rahul Sharma"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email Address</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="At least 6 characters"
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? "Creating Account…" : `Create Alumni Mentor Account`}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Alumni profiles can add company details, batch year, and availability in the next step.
      </p>
    </form>
  );
}
