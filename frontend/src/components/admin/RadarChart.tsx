"use client";

import React from "react";

interface CriterionScore {
  score: number;
  weight?: number;
  weighted_score?: number;
}

interface RadarChartProps {
  data: Record<string, CriterionScore | number>;
  size?: number;
  benchmarkScore?: number;
  className?: string;
}

export default function RadarChart({
  data,
  size = 280,
  benchmarkScore = 3.0,
  className = "",
}: RadarChartProps) {
  // Format labels and scores
  const entries = Object.entries(data);
  
  // Default to 5 standard software competencies if empty or less than 3
  const items = entries.length >= 3 
    ? entries.map(([key, val]) => ({
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        score: typeof val === "number" ? val : val.score,
      }))
    : [
        { label: "System Design", score: 4.5 },
        { label: "Code Quality", score: 4.2 },
        { label: "Problem Solving", score: 4.0 },
        { label: "Communication", score: 4.7 },
        { label: "Domain Mastery", score: 4.3 },
      ];

  const totalAxes = items.length;
  const center = size / 2;
  const radius = (size - 64) / 2;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Coordinate helper: 1-5 scale mapped to radius
  const getPoint = (index: number, score: number) => {
    const angle = index * angleStep - Math.PI / 2; // start from top (12 o'clock)
    const normalized = Math.min(Math.max(score, 0), 5) / 5;
    const r = normalized * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Candidate polygon points
  const candidatePoints = items
    .map((item, idx) => {
      const { x, y } = getPoint(idx, item.score);
      return `${x},${y}`;
    })
    .join(" ");

  // Benchmark polygon points
  const benchmarkPoints = items
    .map((_, idx) => {
      const { x, y } = getPoint(idx, benchmarkScore);
      return `${x},${y}`;
    })
    .join(" ");

  // Grid concentric rings (1 to 5)
  const rings = [1, 2, 3, 4, 5];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          {/* Radial violet gradient for candidate fill */}
          <radialGradient id="radarVioletGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
          </radialGradient>
        </defs>

        {/* Concentric grid webs */}
        {rings.map((ring) => {
          const ringPoints = items
            .map((_, idx) => {
              const { x, y } = getPoint(idx, ring);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polygon
              key={`ring-${ring}`}
              points={ringPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth={ring === 5 ? "1.5" : "1"}
              strokeDasharray={ring === 3 ? "2 2" : undefined}
            />
          );
        })}

        {/* Axis rays */}
        {items.map((_, idx) => {
          const { x, y } = getPoint(idx, 5);
          return (
            <line
              key={`ray-${idx}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Benchmark polygon */}
        <polygon
          points={benchmarkPoints}
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Candidate polygon */}
        <polygon
          points={candidatePoints}
          fill="url(#radarVioletGrad)"
          stroke="#8b5cf6"
          strokeWidth="2"
          className="transition-all duration-500 ease-out"
        />

        {/* Candidate vertex dots */}
        {items.map((item, idx) => {
          const { x, y } = getPoint(idx, item.score);
          return (
            <g key={`dot-${idx}`}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#8b5cf6"
                stroke="#4c1d95"
                strokeWidth="1.5"
                className="hover:scale-125 transition-transform origin-center cursor-pointer"
              />
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="#8b5cf6"
                opacity="0.2"
              />
            </g>
          );
        })}

        {/* Labels at outer perimeter */}
        {items.map((item, idx) => {
          const angle = idx * angleStep - Math.PI / 2;
          const labelDist = radius + 20;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);

          const textAnchor =
            Math.abs(Math.cos(angle)) < 0.1
              ? "middle"
              : Math.cos(angle) > 0
              ? "start"
              : "end";

          return (
            <text
              key={`label-${idx}`}
              x={lx}
              y={ly}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="text-[11px] font-medium fill-white/70"
            >
              {item.label}
              <tspan className="text-[10px] fill-violet-400 font-mono font-semibold" dx="4">
                {item.score.toFixed(1)}
              </tspan>
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          <span>Candidate ({items.reduce((acc, i) => acc + i.score, 0) / items.length > 0 ? (items.reduce((acc, i) => acc + i.score, 0) / items.length).toFixed(1) : "0.0"})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-white/40" />
          <span>Benchmark ({benchmarkScore.toFixed(1)})</span>
        </div>
      </div>
    </div>
  );
}
