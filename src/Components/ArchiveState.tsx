import Link from "next/link";

type ArchiveStateProps = {
  title: string;
  message: string;
  tone?: "error" | "pending";
};

export default function ArchiveState({ title, message, tone = "error" }: ArchiveStateProps) {
  return (
    <div className={`archive-state archive-state--${tone}`} role="status">
      <span className="archive-state__mark" aria-hidden="true">
        {tone === "pending" ? "—" : "×"}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        <Link className="type-link" href="/">
          Return home <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
