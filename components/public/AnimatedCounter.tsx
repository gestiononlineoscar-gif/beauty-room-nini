"use client";

import { NumberTicker } from "@/components/ui/number-ticker";

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix = "", prefix = "", duration = 1800 }: Props) {
  return (
    <NumberTicker
      value={value}
      suffix={suffix}
      prefix={prefix}
      duration={duration / 1000}
    />
  );
}
