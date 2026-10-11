import Link from "next/link";

type ArchiveStateProps = {
  title: string;
  message: string;
};

export default function ArchiveState({ title, message }: ArchiveStateProps) {
  return (
    <div className="archive-state" role="status">
      <span className="archive-state__mark" aria-hidden="true">
        ×
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
