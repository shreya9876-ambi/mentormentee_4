import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Camera } from "lucide-react";
import { AvatarImg } from "@/components/avatar-image";
import { uploadAvatar } from "@/lib/avatar";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { user, role, loading, refresh } = useAuth();
  const navigate = useNavigate();

  // Common
  const [fullName, setFullName] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Student
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");

  // Mentor
  const [gradYear, setGradYear] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [mDepartment, setMDepartment] = useState("");

  const [saving, setSaving] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.profile.getProfile(user.id).then(({ profile, studentProfile, mentorProfile }) => {
      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.avatar_url) setAvatarPath(profile.avatar_url);

      if (studentProfile) {
        if (studentProfile.department) setDepartment(studentProfile.department);
        if (studentProfile.academicYear) setAcademicYear(studentProfile.academicYear);
        if (studentProfile.careerGoals) setCareerGoals(studentProfile.careerGoals);
        if (studentProfile.interests?.length) setInterests(studentProfile.interests.join(", "));
        if (studentProfile.skills?.length) setSkills(studentProfile.skills.join(", "));
        if (studentProfile.linkedinUrl) setLinkedin(studentProfile.linkedinUrl);
      }

      if (mentorProfile) {
        if (mentorProfile.graduationYear) setGradYear(String(mentorProfile.graduationYear));
        if (mentorProfile.company) setCompany(mentorProfile.company);
        if (mentorProfile.designation) setDesignation(mentorProfile.designation);
        if (mentorProfile.experienceYears) setExperience(String(mentorProfile.experienceYears));
        if (mentorProfile.bio) setBio(mentorProfile.bio);
        if (mentorProfile.expertise?.length) setExpertise(mentorProfile.expertise.join(", "));
        if (mentorProfile.department) setMDepartment(mentorProfile.department);
        if (mentorProfile.linkedinUrl) setLinkedin(mentorProfile.linkedinUrl);
      }
    });
  }, [user]);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(user.id, file);
      setAvatarPath(path);
      toast.success("Photo uploaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!user || !role) return;
    setSaving(true);

    try {
      await api.profile.updateOnboarding({
        fullName,
        avatarUrl: avatarPath || undefined,
        role,
        studentData:
          role === "student"
            ? {
                department,
                academicYear,
                careerGoals,
                interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
                skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
                linkedinUrl: linkedin || undefined,
              }
            : undefined,
        mentorData:
          role === "mentor"
            ? {
                graduationYear: gradYear ? parseInt(gradYear) : undefined,
                company,
                designation,
                experienceYears: experience ? parseInt(experience) : 0,
                bio,
                linkedinUrl: linkedin || undefined,
                expertise: expertise.split(",").map((s) => s.trim()).filter(Boolean),
                department: mDepartment,
              }
            : undefined,
      });

      await refresh();
      setSaving(false);
      toast.success("Profile saved");
      if (role === "admin") navigate({ to: "/admin" });
      else if (role === "mentor") navigate({ to: "/requests" });
      else navigate({ to: "/mentors" });
    } catch (err: unknown) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  if (loading || !role) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-display text-xl">Complete your profile</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{role === "mentor" ? "Mentor profile" : role === "admin" ? "Admin profile" : "Student profile"}</CardTitle>
            <CardDescription>
              {role === "mentor"
                ? "Add your photo and experience — students will see this on your mentor card."
                : role === "admin"
                  ? "Just a profile photo and name is enough — you have admin access."
                  : "Tell us about your studies and interests so we can match you with the right mentors."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <AvatarImg path={avatarPath} name={fullName} className="h-20 w-20" />
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    <Camera className="h-4 w-4" />
                    {uploading ? "Uploading…" : avatarPath ? "Change photo" : "Upload photo"}
                  </span>
                </Label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={onPickAvatar} className="hidden" disabled={uploading} />
                <p className="text-xs text-muted-foreground mt-1">A clear headshot helps build trust.</p>
              </div>
            </div>
            <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
            {role !== "admin" && (
              <Field label="LinkedIn URL (optional)"><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
            )}

            {role === "student" && (
              <>
                <Field label="Department"><Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Engineering" /></Field>
                <Field label="Academic year"><Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. Third year" /></Field>
                <Field label="Career goals"><Textarea value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} rows={3} placeholder="What are you aiming for?" /></Field>
                <Field label="Interests (comma separated)"><Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="AI, fintech, product" /></Field>
                <Field label="Skills (comma separated)"><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python, SQL" /></Field>
              </>
            )}

            {role === "mentor" && (
              <>
                <Field label="Graduation year"><Input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="2018" /></Field>
                <Field label="Department"><Input value={mDepartment} onChange={(e) => setMDepartment(e.target.value)} placeholder="e.g. Computer Engineering" /></Field>
                <Field label="Current company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
                <Field label="Designation"><Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Software Engineer" /></Field>
                <Field label="Years of experience"><Input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} /></Field>
                <Field label="Expertise areas (comma separated)"><Input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="System design, ML, career coaching" /></Field>
                <Field label="Bio"><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="A short professional bio" /></Field>
              </>
            )}

            <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save and continue"}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
