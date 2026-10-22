import { permanentRedirect } from "next/navigation";

export default function StoriesRedirect() {
  permanentRedirect("/Blog");
}

