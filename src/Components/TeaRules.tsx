import Link from "next/link";
import { TEA_RULES, TEA_RULES_VERSION } from "@/lib/tea-discussion";

export default function TeaRules() {
  return <aside className="tea-rules" id="tea-rules" aria-labelledby="tea-rules-title">
    <p className="kicker">Before you spill</p>
    <h2 id="tea-rules-title">A little tea. A little care.</h2>
    <p>Keep the conversation worth having. These rules apply to posts and every reply.</p>
    <ol>{TEA_RULES.map(rule => <li key={rule.title}><strong>{rule.title}</strong><p>{rule.text}</p></li>)}</ol>
    <p>For a correction or a sensitive concern, <Link href="/Contact">contact the Press Club</Link>. <Link href="/Editorial">How we publish</Link>.</p>
    <small>Rules updated {TEA_RULES_VERSION}</small>
  </aside>;
}
