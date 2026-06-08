"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TimeBlock } from "@/hooks/useTimeBlocks";

interface TimelineProps {
  startHour: number; // 0-23
  duration: number; // in hours
  events?: TimeBlock[];
  activeTab: "plan" | "actual";
}

export function Timeline({ startHour, duration, events = [], activeTab }: TimelineProps) {
  // Generate the hours array
  const hours = Array.from({ length: duration + 1 }, (_, i) => {
    const hour = (startHour + i) % 24;
    return hour;
  });

  // Calculate total height based on a fixed pixels per hour
  const PIXELS_PER_HOUR = 80;

  return (
    <div className="relative w-full flex bg-white/50 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[calc(100vh-140px)]">
      {/* Time Axis */}
      <div className="w-16 flex-shrink-0 border-r border-slate-100/80 bg-white/80 py-4 z-10">
        {hours.map((hour, index) => (
          <div
            key={`axis-${index}`}
            className="relative flex justify-end pr-3"
            style={{ height: PIXELS_PER_HOUR }}
          >
            <span className="text-xs font-medium text-slate-400 -translate-y-2.5">
              {hour.toString().padStart(2, "0")}:00
            </span>
            {/* Hour marker line */}
            <div className="absolute right-0 top-0 w-1 h-[1px] bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-slate-50/30 py-4">
        {/* Hour Grid Lines */}
        {hours.map((_, index) => (
          <div
            key={`grid-${index}`}
            className="absolute left-0 right-0 border-t border-slate-100/60"
            style={{
              top: `calc(1rem + ${index * PIXELS_PER_HOUR}px)`,
            }}
          />
        ))}

        {/* Current Time Indicator (Static for mockup) */}
        <div 
          className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
          style={{ top: `calc(1rem + ${2.5 * PIXELS_PER_HOUR}px)` }}
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 -ml-1 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <div className="h-[1px] flex-1 bg-blue-500/60" />
        </div>

        {/* Events Container */}
        <div className="absolute top-4 left-0 right-0 bottom-4 px-2">
          {events.map((event) => {
            // Hide ACTUAL blocks if we are in PLAN tab
            if (activeTab === "plan" && event.type === "actual") return null;

            const topOffset = (event.startOffset / 60) * PIXELS_PER_HOUR;
            const height = (event.duration / 60) * PIXELS_PER_HOUR;

            // Determine horizontal positioning
            let horizontalClass = "left-2 right-2"; // full width by default
            if (activeTab === "actual") {
              if (event.type === "plan") {
                horizontalClass = "left-2 w-[calc(50%-8px)]"; // left half
              } else {
                horizontalClass = "right-2 w-[calc(50%-8px)]"; // right half
              }
            }

            return (
              <div
                key={event.id}
                className={cn(
                  "absolute rounded-xl p-3 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer overflow-hidden",
                  event.type === "plan" 
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-900" 
                    : "bg-emerald-50 border border-emerald-200 text-emerald-900",
                  horizontalClass
                )}
                style={{
                  top: `${topOffset}px`,
                  height: `${height}px`,
                }}
              >
                <div className="text-sm font-bold tracking-tight mb-0.5 leading-tight">{event.title}</div>
                <div className={cn(
                  "text-xs font-medium opacity-80",
                  event.type === "plan" ? "text-indigo-700" : "text-emerald-700"
                )}>
                  {Math.floor(event.duration / 60)}h {event.duration % 60 > 0 ? `${event.duration % 60}m` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
