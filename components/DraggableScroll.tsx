"use client";

import { useRef, useCallback, type ReactNode } from "react";

export function DraggableScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    dragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }, []);

  const onMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    dragging.current = false;
    el.style.cursor = "grab";
    el.style.userSelect = "";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = x - startX.current;
    ref.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!dragging.current || !ref.current) return;
    dragging.current = false;
    ref.current.style.cursor = "grab";
    ref.current.style.userSelect = "";
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-x-auto cursor-grab scrollbar-visible"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
