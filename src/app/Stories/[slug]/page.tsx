import { permanentRedirect } from "next/navigation";

type LegacyStoryProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyStoryRedirect({ params }: LegacyStoryProps) {
  const { slug } = await params;
  permanentRedirect(`/Blog/${slug}`);
}
