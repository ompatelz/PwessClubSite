export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  published_at: string;
};

export function formatStoryDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function previewStoryText(value: string, maximum = 360) {
  const text = value.trim();
  if (text.length <= maximum) return text;
  const shortened = text.slice(0, maximum + 1);
  const breakAt = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, breakAt > maximum * 0.7 ? breakAt : maximum).trim()}…`;
}

