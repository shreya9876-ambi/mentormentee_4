import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { GraduationCap, Users, ShieldCheck, Calendar, MessageSquare, Sparkles, Briefcase, ArrowRight, CheckCircle } from "lucide-react";
import { UNIVERSITY_NAME, UNIVERSITY_TAGLINE } from "@/lib/university";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `${UNIVERSITY_NAME} ${UNIVERSITY_TAGLINE} — Connect with verified alumni mentors` },
      { name: "description", content: "A university-exclusive mentorship platform connecting students with verified alumni working in industry." },
      { property: "og:title", content: `${UNIVERSITY_NAME} Mentor–Mentee Connect` },
      { property: "og:description", content: "Verified alumni mentorship for current students." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Hero */}
      <section className="bg-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5 relative z-10">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-accent" />
            <span className="font-display text-lg font-bold tracking-tight">{UNIVERSITY_NAME} Connect</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              search={{ tab: "signin" }}
              className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ tab: "signup", role: "student" }}
              className="inline-flex items-center justify-center rounded-lg text-sm font-semibold bg-accent text-accent-foreground shadow hover:bg-accent/90 h-9 px-4 transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium backdrop-blur-sm border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Placement Cell · Verified Alumni Network
            </div>
            <h1 className="mt-5 font-display text-4xl md:text-5xl lg:text-6xl leading-[1.15] font-bold">
              Bridge the gap between classroom and career.
            </h1>
            <p className="mt-5 text-primary-foreground/85 max-w-lg text-base md:text-lg leading-relaxed">
              Connect current students with verified alumni working in top tech, core, and finance companies — for interview prep, 1-on-1 guidance calls, and referrals.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                search={{ role: "student", tab: "signin" }}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground shadow-md hover:bg-accent/90 h-11 px-6 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <GraduationCap className="h-4 w-4" />
                Student Sign In
              </Link>
              <Link
                to="/auth"
                search={{ role: "mentor", tab: "signup" }}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold border border-white/30 bg-white/10 text-white hover:bg-white/20 h-11 px-6 transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
              >
                <Briefcase className="h-4 w-4" />
                Become an Alumni Mentor
              </Link>
              <Link
                to="/auth"
                search={{ role: "admin", tab: "signin" }}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-primary-foreground/75 hover:text-white underline-offset-4 hover:underline py-2 px-3"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Placement Admin Portal
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, t: "Verified Alumni", s: "Mentors across Amazon, Microsoft, TCS, Infosys, Barclays & top startups" },
                { icon: Calendar, t: "1-on-1 Sessions", s: "Book slots, conduct video calls, and mock interviews" },
                { icon: MessageSquare, t: "Direct Chat", s: "Seamless direct messaging for guidance and resumes" },
                { icon: ShieldCheck, t: "Placement Cell Verified", s: "All alumni records verified with official college records" },
              ].map((f) => (
                <div key={f.t} className="rounded-xl bg-white/5 backdrop-blur-md p-5 border border-white/10 hover:bg-white/10 transition-colors">
                  <f.icon className="h-6 w-6 text-accent" />
                  <div className="mt-3 font-semibold text-base">{f.t}</div>
                  <div className="text-xs text-primary-foreground/70 mt-1.5 leading-relaxed">{f.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Role Benefits Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-bold">Built for the Entire Campus Community</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Whether you are a student aiming for your dream company or an alumni paying it forward.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold">For Current Students</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Access senior alumni working in your target companies.</p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Search alumni by company & batch year
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Request 1-on-1 interview prep & mock interviews
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Get resume reviews & referral tips
                </li>
              </ul>
            </div>
            <Link
              to="/auth"
              search={{ role: "student", tab: "signin" }}
              className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Student Sign In <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="h-10 w-10 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center mb-4">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold">For Alumni Mentors</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Give back to juniors with your experience and guidance.</p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Set your own availability slots anytime
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Accept or decline guidance requests on your schedule
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Host 1-click video calls with students
                </li>
              </ul>
            </div>
            <Link
              to="/auth"
              search={{ role: "mentor", tab: "signup" }}
              className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Become a Mentor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold">For Placement Cell</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Official oversight, passout record matching, & analytics.</p>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Verify alumni passout records & batches
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Track mentorship sessions and feedback ratings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" /> Manage student queries and campus drives
                </li>
              </ul>
            </div>
            <Link
              to="/auth"
              search={{ role: "admin", tab: "signin" }}
              className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Admin Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/40 border-y py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-center">How It Works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Sign up with your college role", d: "Students sign up with their college email; Alumni specify their company, batch year, and expertise." },
              { n: "02", t: "Discover & connect", d: "Students search mentors by company (Google, Microsoft, TCS, etc.) or department and request 1-on-1 guidance." },
              { n: "03", t: "Meet & prepare", d: "Once accepted, mentors and students connect via direct chat and join scheduled video sessions." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="text-accent font-display text-2xl font-bold">{s.n}</div>
                <div className="mt-3 font-semibold text-lg">{s.t}</div>
                <div className="mt-2 text-muted-foreground text-xs leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="rounded-2xl bg-hero text-primary-foreground p-8 md:p-12 shadow-xl relative overflow-hidden">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Ready to connect with verified mentors?</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto text-sm md:text-base">
            Join the official {UNIVERSITY_NAME} alumni-student network and jumpstart your career preparation today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ role: "student", tab: "signup" }}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground shadow-md hover:bg-accent/90 h-10 px-6 transition-all"
            >
              Get Started Now
            </Link>
            <Link
              to="/auth"
              search={{ tab: "signin" }}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold border border-white/30 bg-white/10 text-white hover:bg-white/20 h-10 px-6 transition-all"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground mt-auto">
        © {new Date().getFullYear()} {UNIVERSITY_NAME} Placement Cell · {UNIVERSITY_TAGLINE}
      </footer>
    </div>
  );
}
