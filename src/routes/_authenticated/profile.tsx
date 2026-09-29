import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!user || !role) return;
    api.profile.getProfile(user.id).then(({ profile, studentProfile, mentorProfile }) => {
      setProfile(profile);
      if (role === "student") {
        setDetails(studentProfile);
      } else if (role === "mentor") {
        setDetails(mentorProfile);
      }
    });
  }, [user, role]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">{profile?.full_name ?? "Your profile"}</CardTitle>
            <div className="text-sm text-muted-foreground">{user?.email} · {role}</div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(details, null, 2)}</pre>
            <Button asChild className="mt-4"><Link to="/onboarding">Edit profile</Link></Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
