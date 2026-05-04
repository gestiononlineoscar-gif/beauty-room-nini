import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  colorFrom?: string;
  colorTo?: string;
  duration?: number;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  colorFrom = "#C4728A",
  colorTo = "#e8c5ce",
  duration = 8,
  borderWidth = 1.5,
}: Props) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden",
        className,
      )}
    >
      <span
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${colorFrom} 60deg, ${colorTo} 120deg, transparent 180deg)`,
          animation: `border-beam-spin ${duration}s linear infinite`,
          maskImage: `radial-gradient(transparent calc(100% - ${borderWidth}px), black calc(100% - ${borderWidth}px))`,
          WebkitMaskImage: `radial-gradient(transparent calc(100% - ${borderWidth}px), black calc(100% - ${borderWidth}px))`,
        }}
      />
    </span>
  );
}
