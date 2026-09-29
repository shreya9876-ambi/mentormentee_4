import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Inbox,
  Calendar,
  MessageSquare,
  LogOut,
  User as UserIcon,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { UNIVERSITY_NAME, UNIVERSITY_TAGLINE } from "@/lib/university";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", roles: ["admin"] },
  { to: "/admin", icon: ShieldCheck, label: "Placement Portal", roles: ["admin"] },
  { to: "/mentors", icon: Users, label: "Find mentors", roles: ["student"] },
  { to: "/requests", icon: Inbox, label: "Requests", roles: ["mentor"] },
  { to: "/sessions", icon: Calendar, label: "Sessions", roles: ["student", "mentor"] },
  { to: "/messages", icon: MessageSquare, label: "Messages", roles: ["student", "mentor"] },
  { to: "/feedback", icon: Heart, label: "Feedback", roles: ["mentor"] },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, signOut: authSignOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    authSignOut();
    navigate({ to: "/auth", replace: true });
  }

  const visible = navItems.filter((n) => !role || (n.roles as readonly string[]).includes(role));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <GraduationCap className="h-6 w-6 text-sidebar-primary" />
          <div>
            <div className="font-display text-lg leading-none">{UNIVERSITY_NAME}</div>
            <div className="text-xs text-sidebar-foreground/70 mt-1">{UNIVERSITY_TAGLINE}</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {visible.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <UserIcon className="h-4 w-4" />
            <span className="truncate">{user?.email ?? "Profile"}</span>
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b px-4 py-3 bg-card">
          <Link to="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display">{UNIVERSITY_NAME}</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
