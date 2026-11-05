import type { Metadata } from "next";

export const SITE_NAME = "The Press Club at DAU";

type ShareMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
};

// Next.js replaces a parent's openGraph object instead of merging it, so every
// page that sets its own share title also restates the site name here.
export function shareMetadata({
  title,
  description,
  path,
  type = "article",
  publishedTime,
  authors,
}: ShareMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
      url: path,
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
