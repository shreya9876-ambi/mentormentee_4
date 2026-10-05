// Common Indian female first names for gender detection
const FEMALE_NAMES = new Set([
  "aaradhya","aashi","aastha","aditi","aisha","akanksha","akshara","alka","amrita","ananya",
  "anchal","anisha","anita","anjali","ankita","anmol","anushka","arpita","asmita","avantika",
  "avni","ayesha","bhavana","bhavna","chandni","chetna","damini","deepa","deepika","devika",
  "diya","divya","durga","ekta","falak","fatima","gauri","gayatri","geeta","harleen","harpreet",
  "heena","hemal","hina","isha","ishita","janhvi","janki","jasleen","jaspreet","jaya","jayashree",
  "jyoti","kajal","kanchan","kavitha","kavya","kiran","komal","kratika","kriti","kumari",
  "lakshmi","lalita","latika","lavanya","laxmi","leela","lekha","madhuri","mamta","manasi",
  "manisha","manpreet","meenakshi","meera","megha","minal","mira","mitali","monika","mukta",
  "muskan","nalini","namrata","nandini","natasha","navneet","neelam","neeta","neha","nidhi",
  "nikita","nimisha","nisha","nishtha","niti","nivedita","niyati","paakhi","pallavi","parinita",
  "parvati","pooja","pooja","poornima","pragati","pragya","pranjal","prarthana","prativa","preethi",
  "preeti","prerna","prianka","priti","priya","priyanka","puja","rachna","radha","radhika",
  "ragini","rakhi","rashmi","raveena","renu","renuka","rhea","riddhi","ritu","riya","rohini",
  "rupal","rupa","rupali","ruqaiya","sakshi","saloni","sangeeta","saniya","sanjana","sara","sarika",
  "savita","seema","shakti","shikha","shilpa","shraddha","shreya","shruti","siddhi","simran",
  "smita","sneha","sonam","sonali","sonal","srija","stuti","subha","sucheta","suchitra","sudha",
  "sugandha","suhasini","sujata","suman","sumita","sunita","swati","tanvi","tara","taruna",
  "trisha","urvashi","usha","vaishali","vandana","varsha","vartika","vasudha","vibha","vidya",
  "vimala","vrinda","yashaswini","zara","zoya","zainab",
]);

/**
 * Guess gender from an Indian name.
 * Returns "female" | "male" — defaults to "male" when uncertain.
 */
export function getGenderFromName(name: string | null | undefined): "female" | "male" {
  if (!name) return "male";
  const first = name.trim().split(/\s+/)[0].toLowerCase();
  return FEMALE_NAMES.has(first) ? "female" : "male";
}

/**
 * Returns a DiceBear avatar URL that looks Indian and is gender-appropriate.
 * Uses "lorelei" style for female, "micah" style for male.
 * The name is used as a seed so each person gets a consistent, unique look.
 */
export function getDefaultAvatarUrl(name: string | null | undefined): string {
  const gender = getGenderFromName(name);
  const seed = encodeURIComponent((name ?? "user").trim());
  if (gender === "female") {
    // lorelei — warm, illustrated, feminine
    return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=fde68a,fca5a5,c4b5fd,86efac,fdba74&radius=50`;
  } else {
    // micah — clean illustrated, masculine
    return `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&backgroundColor=bfdbfe,bbf7d0,fde68a,e9d5ff,fed7aa&radius=50`;
  }
}

export async function getAvatarUrl(
  path: string | null | undefined,
  name?: string | null
): Promise<string> {
  if (path && path.trim() !== "") return path;
  return getDefaultAvatarUrl(name);
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
