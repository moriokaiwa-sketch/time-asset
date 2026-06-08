"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TimeBlock } from "@/hooks/useTimeBlocks";

interface TimelineProps {
  startHour: number; // 0-23
  duration: number; // in hours
  events?: TimeBlock[];
  activeTab: "plan" | "actual";
  onUpdateBlock?: (id: string, updates: Partial<TimeBlock>) => void;
  onAddBlockRequest?: (startOffset: number) => void;
}

export function Timeline({ startHour, duration, events = [], activeTab, onUpdateBlock, onAddBlockRequest }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragDeltaMinutes, setDragDeltaMinutes] = useState<number>(0);
  const dragStartY = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);

  // Long Press State
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const PIXELS_PER_HOUR = 80;
  const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
  const SNAP_MINUTES = 5;

  const hours = Array.from({ length: duration + 1 }, (_, i) => {
    return (startHour + i) % 24;
  });

  // Handle Drag
  useEffect(() => {
    if (!draggedBlockId) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      const deltaY = e.clientY - dragStartY.current;
      let deltaMin = Math.round(deltaY / PIXELS_PER_MINUTE);
      
      // Snap to SNAP_MINUTES
      deltaMin = Math.round(deltaMin / SNAP_MINUTES) * SNAP_MINUTES;
      setDragDeltaMinutes(deltaMin);
    };

    const handlePointerUp = () => {
      if (draggedBlockId && dragDeltaMinutes !== 0) {
        let newOffset = initialOffsetRef.current + dragDeltaMinutes;
        // Clamp to timeline boundaries
        newOffset = Math.max(0, Math.min(newOffset, duration * 60 - 5)); // min 5 min block duration assumption

        if (onUpdateBlock) {
          onUpdateBlock(draggedBlockId, { startOffset: newOffset });
        }
      }
      setDraggedBlockId(null);
      setDragDeltaMinutes(0);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggedBlockId, dragDeltaMinutes, duration, onUpdateBlock]);

  // Handle Background Long Press
  const handleBgPointerDown = (e: React.PointerEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains("bg-grid")) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    let offsetMinutes = y / PIXELS_PER_MINUTE;
    // Snap to 5 mins
    offsetMinutes = Math.round(offsetMinutes / SNAP_MINUTES) * SNAP_MINUTES;

    longPressTimer.current = setTimeout(() => {
      if (onAddBlockRequest) {
        onAddBlockRequest(Math.max(0, offsetMinutes));
      }
    }, 500); // 500ms long press
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className="relative w-full flex bg-white/50 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[calc(100vh-140px)] select-none" style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>
      {/* Time Axis */}
      <div className="w-16 flex-shrink-0 border-r border-slate-100/80 bg-white/80 py-4 z-10 pointer-events-none">
        {hours.map((hour, index) => (
          <div
            key={`axis-${index}`}
            className="relative flex justify-end pr-3"
            style={{ height: PIXELS_PER_HOUR }}
          >
            <span className="text-xs font-medium text-slate-400 -translate-y-2.5">
              {hour.toString().padStart(2, "0")}:00
            </span>
            <div className="absolute right-0 top-0 w-1 h-[1px] bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-slate-50/30 py-4 bg-grid cursor-pointer"
        onPointerDown={handleBgPointerDown}
        onPointerUp={cancelLongPress}
        onPointerMove={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerLeave={cancelLongPress}
      >
        {/* Hour Grid Lines */}
        {hours.map((_, index) => (
          <div
            key={`grid-${index}`}
            className="absolute left-0 right-0 border-t border-slate-100/60 pointer-events-none bg-grid"
            style={{ top: `calc(1rem + ${index * PIXELS_PER_HOUR}px)` }}
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
        <div className="absolute top-4 left-0 right-0 bottom-4 px-2 pointer-events-none">
          {events.map((event) => {
            if (activeTab === "plan" && event.type === "actual") return null;

            const isDragging = draggedBlockId === event.id;
            const currentOffset = isDragging ? event.startOffset + dragDeltaMinutes : event.startOffset;

            const topPx = (currentOffset / 60) * PIXELS_PER_HOUR;
            const heightPx = (event.duration / 60) * PIXELS_PER_HOUR;

            // Layout Calculation
            const col = event.column || 0;
            const totalCols = event.totalColumns || 1;
            
            let leftStr = "0.5rem";
            let widthStr = "calc(100% - 1rem)";

            if (activeTab === "plan") {
              widthStr = `calc((100% - 1rem) / ${totalCols})`;
              leftStr = `calc(0.5rem + (100% - 1rem) * ${col} / ${totalCols})`;
            } else {
              // activeTab === "actual"
              const halfWidth = "calc(50% - 0.5rem)";
              if (event.type === "plan") {
                widthStr = `calc(${halfWidth} / ${totalCols})`;
                leftStr = `calc(0.5rem + ${halfWidth} * ${col} / ${totalCols})`;
              } else {
                widthStr = `calc(${halfWidth} / ${totalCols})`;
                leftStr = `calc(50% + 0.25rem + ${halfWidth} * ${col} / ${totalCols})`;
              }
            }

            return (
              <div
                key={event.id}
                className={cn(
                  "absolute rounded-xl p-2 sm:p-3 shadow-sm transition-transform active:scale-[0.98] cursor-grab active:cursor-grabbing overflow-hidden pointer-events-auto select-none touch-none",
                  event.type === "plan" 
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-900" 
                    : "bg-emerald-50 border border-emerald-200 text-emerald-900",
                  isDragging && "z-30 shadow-lg scale-[1.02] opacity-90",
                  !isDragging && "z-20 transition-[top,left,width,height] duration-200"
                )}
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  left: leftStr,
                  width: widthStr,
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none"
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.target as HTMLElement).releasePointerCapture(e.pointerId); // Prevent default dragging behaviors
                  setDraggedBlockId(event.id);
                  dragStartY.current = e.clientY;
                  initialOffsetRef.current = event.startOffset;
                  setDragDeltaMinutes(0);
                }}
              >
                <div className="text-sm font-bold tracking-tight mb-0.5 leading-tight truncate">{event.title}</div>
                <div className={cn(
                  "text-xs font-medium opacity-80 truncate",
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
