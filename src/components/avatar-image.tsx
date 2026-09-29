import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatar";
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
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getAvatarUrl(path).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [path]);
  const initials = (name ?? "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
  return (
    <Avatar className={cn(className)}>
      {url && <AvatarImage src={url} alt={name ?? "avatar"} />}
      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
    </Avatar>
  );
}
