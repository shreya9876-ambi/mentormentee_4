import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function AvatarImg({
  path,
  name,
  className,
}: {
  path: string | null | undefined;
  name: string | null | undefined;
  className?: string;
}) {
  // Use the real photo if available, otherwise generate a gender-appropriate Indian avatar
  const src =
    path && path.trim() !== ""
      ? path
      : getDefaultAvatarUrl(name);

  const initials =
    (name ?? "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={src} alt={name ?? "avatar"} />
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
