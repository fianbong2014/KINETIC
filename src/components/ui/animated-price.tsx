"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedPriceProps {
  value: number;
  prevValue?: number;
  prefix?: string;
  decimals?: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AnimatedPrice({
  value,
  prevValue,
  prefix = "$",
  decimals = 2,
  className = "",
  size = "md",
}: AnimatedPriceProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value === 0 || prevRef.current === 0) {
      prevRef.current = value;
      return;
    }

    if (value > prevRef.current) {
      setFlash("up");
    } else if (value < prevRef.current) {
      setFlash("down");
    }

    prevRef.current = value;

    const timer = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(timer);
  }, [value]);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const flashClasses = {
    up: "text-emerald-accent",
    down: "text-crimson",
  };

  const formatted = value > 0 ? value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) : "---";

  return (
    <span
      className={`
        font-mono tabular-nums font-semibold transition-colors duration-300
        ${sizeClasses[size]}
        ${flash ? flashClasses[flash] : ""}
        ${className}
      `}
    >
      {value > 0 ? `${prefix}${formatted}` : "Loading..."}
    </span>
  );
}
