"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// The phone and tablet menu. The header stays mounted while pages change, so a
// plain <details> would stay open after choosing a link. This closes it when a
// link is chosen, the page changes, Escape is pressed or someone taps outside.
export default function MastheadMenu({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = (returnFocus: boolean) => {
      const element = menu.current;
      if (!element?.open) return;
      element.open = false;
      if (returnFocus) element.querySelector("summary")?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) close(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details
      ref={menu}
      className="masthead__menu"
      onClick={(event) => {
        // Choosing any link closes the menu, including the page you're already on.
        if ((event.target as HTMLElement).closest("a") && menu.current) menu.current.open = false;
      }}
    >
      <summary>Menu</summary>
      {children}
    </details>
  );
}
