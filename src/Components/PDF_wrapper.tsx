"use client";

import dynamic from "next/dynamic";

const PDFviewer = dynamic(
  () => import("./PDFviewer"),
  { ssr: false }
);

export default function PDFWrapper(
  { url }: { url: string }
) {
  return <PDFviewer url={url} />;
}