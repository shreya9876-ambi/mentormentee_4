export async function getAvatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  return path;
}

export async function uploadAvatar(_userId: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function googleCalendarUrl(opts: {
  title: string;
  start: string | Date;
  end: string | Date;
  details?: string;
  location?: string;
}) {
  const fmt = (d: string | Date) => {
    const dt = new Date(d);
    return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(opts.end)}`,
    details: opts.details ?? "",
    location: opts.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
