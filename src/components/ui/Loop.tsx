import { useMemo, type CSSProperties, type ReactNode } from "react";
import { loopAnimations, type LoopKeyframes, type LoopTransition } from "@/lib/ambient";

interface LoopProps {
  animate: LoopKeyframes;
  transition: LoopTransition;
  className?: string;
  style?: CSSProperties;
  paint?: CSSProperties;
  children?: ReactNode;
}

export function Loop({ animate, transition, className, style, paint, children }: LoopProps) {
  const key = JSON.stringify([animate, transition]);
  const { opacity, layers } = useMemo(() => loopAnimations(animate, transition), [key]);

  const [outer, ...inner] = layers;
  const outerAnims = [outer, opacity].filter(Boolean).join(",");

  let content = paint ? (
    <>
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", ...paint }} />
      {children}
    </>
  ) : children;
  for (let i = inner.length - 1; i >= 0; i--) {
    content = (
      <div style={{ position: "absolute", inset: 0, animation: inner[i] }}>{content}</div>
    );
  }

  return (
    <div
      className={`zw-ambient${className ? ` ${className}` : ""}`}
      style={{ ...style, ...(outerAnims ? { animation: outerAnims } : null) }}
    >
      {content}
    </div>
  );
}
