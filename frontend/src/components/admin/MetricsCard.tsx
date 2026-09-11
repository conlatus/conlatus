"use client";

import React from "react";
import SpecularContainer from "@/components/SpecularContainer";
import AnimatedCounter from "./AnimatedCounter";

interface MetricsCardProps {
  title: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  subtitle: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accentColor?: string;
}

export default function MetricsCard({
  title,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  subtitle,
  trend,
  trendDirection = "up",
  icon,
  accentColor = "#8b5cf6",
}: MetricsCardProps) {
  return (
    <SpecularContainer
      radius={20}
      tintOpacity={0.02}
      className="group relative overflow-hidden border border-white/10 transition-colors duration-200"
      contentClassName="p-5 flex flex-col justify-between h-full"
    >
      {/* Background glow orb */}
      <div
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-white/50">
          {title}
        </span>
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 transition-colors duration-200">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-semibold tracking-tight text-white/95">
          <AnimatedCounter
            value={value}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
          />
        </span>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
              trendDirection === "up"
                ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                : trendDirection === "down"
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                : "bg-white/10 text-white/60"
            }`}
          >
            {trendDirection === "up" && "↑"}
            {trendDirection === "down" && "↓"}
            {trend}
          </span>
        )}
      </div>

      <p className="text-xs text-white/40 mt-1 truncate">
        {subtitle}
      </p>
    </SpecularContainer>
  );
}
