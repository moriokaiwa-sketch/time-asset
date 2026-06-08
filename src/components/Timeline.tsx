"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TimeBlock, Category } from "@/types";
import { format } from "date-fns";

interface TimelineProps {
  startHour: number; // 0-23
  duration: number; // in hours
  events?: TimeBlock[];
  categories?: Category[];
  activeTab: "plan" | "both" | "actual";
  onUpdateBlock?: (id: string, updates: Partial<TimeBlock>) => void;
  onAddBlockRequest?: (startOffset: number) => void;
  onBlockClick?: (block: TimeBlock) => void;
  isOverviewMode?: boolean;
  dateStr?: string;
}

export function Timeline({ startHour, duration, events = [], categories = [], activeTab, onUpdateBlock, onAddBlockRequest, onBlockClick, isOverviewMode = false, dateStr }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<"move" | "resizeTop" | "resizeBottom" | null>(null);
  const [dragDeltaMinutes, setDragDeltaMinutes] = useState<number>(0);
  const dragStartY = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);
  const initialDurationRef = useRef<number>(0);

  // Selection & Tap State
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  const lastTapTimeRef = useRef<Record<string, number>>({});

  // Long Press State
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Viewport Height for Overview Mode
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateHeight = () => {
        // Header height + bottom padding space is roughly 220px
        // Use window.innerHeight strictly so it always fits the screen
        setContainerHeight(window.innerHeight - 220);
      };
      updateHeight();
      // small delay to ensure layout is done
      setTimeout(updateHeight, 100);
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
  }, []);

  const PIXELS_PER_HOUR = isOverviewMode && containerHeight > 0 
    ? Math.max(containerHeight / duration, 20) 
    : 80;
  const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
  const SNAP_MINUTES = 15;

  const hours = Array.from({ length: duration + 1 }, (_, i) => {
    return (startHour + i) % 24;
  });

  // Handle Drag
  useEffect(() => {
    if (!draggedBlockId || !dragMode) return;

    let totalScrolled = 0;
    let currentClientY = dragStartY.current;
    let autoScrollRaf: number | null = null;
    let lastScrollTime = performance.now();
    let currentDragDelta = 0;

    const updateDragDelta = () => {
      const deltaY = (currentClientY - dragStartY.current) + totalScrolled;
      let deltaMin = Math.round(deltaY / PIXELS_PER_MINUTE);
      
      // Snap to SNAP_MINUTES
      deltaMin = Math.round(deltaMin / SNAP_MINUTES) * SNAP_MINUTES;
      
      if (currentDragDelta !== deltaMin) {
        currentDragDelta = deltaMin;
        setDragDeltaMinutes(deltaMin);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      currentClientY = e.clientY;
      updateDragDelta();
    };

    const doAutoScroll = (time: number) => {
      const dt = time - lastScrollTime;
      lastScrollTime = time;

      const edgeSize = 120; // pixels from top or bottom to trigger scroll
      const maxScrollSpeed = 0.8; // pixels per ms
      
      let scrollY = 0;
      
      if (currentClientY < edgeSize) {
        // Scroll up
        const intensity = Math.min(1.5, Math.max(0, (edgeSize - currentClientY) / edgeSize));
        scrollY = -maxScrollSpeed * intensity * dt;
      } else if (currentClientY > window.innerHeight - edgeSize) {
        // Scroll down
        const intensity = Math.min(1.5, Math.max(0, (currentClientY - (window.innerHeight - edgeSize)) / edgeSize));
        scrollY = maxScrollSpeed * intensity * dt;
      }

      if (scrollY !== 0 && dt < 100) { // dt < 100 to prevent huge jumps if tab was inactive
        let actualScrolled = 0;
        
        // Try window first
        const prevWindowScroll = window.scrollY;
        window.scrollBy(0, scrollY);
        actualScrolled = window.scrollY - prevWindowScroll;

        // Try container if window didn't scroll
        if (actualScrolled === 0) {
          const el = document.querySelector('.overflow-y-auto') as HTMLElement;
          if (el) {
            const prevElScroll = el.scrollTop;
            el.scrollBy(0, scrollY);
            actualScrolled = el.scrollTop - prevElScroll;
          }
        }

        if (actualScrolled !== 0) {
          totalScrolled += actualScrolled;
          updateDragDelta();
        }
      }
      
      autoScrollRaf = requestAnimationFrame(doAutoScroll);
    };

    autoScrollRaf = requestAnimationFrame((time) => {
      lastScrollTime = time;
      doAutoScroll(time);
    });

    const handlePointerUp = () => {
      if (autoScrollRaf) cancelAnimationFrame(autoScrollRaf);

      if (draggedBlockId && currentDragDelta !== 0) {
        if (dragMode === "move") {
          let newOffset = initialOffsetRef.current + currentDragDelta;
          // Clamp to timeline boundaries
          newOffset = Math.max(0, Math.min(newOffset, duration * 60 - initialDurationRef.current));
          if (onUpdateBlock) onUpdateBlock(draggedBlockId, { startOffset: newOffset });
        } else if (dragMode === "resizeTop") {
          let newDuration = initialDurationRef.current - currentDragDelta;
          let newOffset = initialOffsetRef.current + currentDragDelta;
          
          if (newDuration < 15) {
            const diff = 15 - newDuration;
            newDuration = 15;
            newOffset -= diff;
          }
          if (newOffset < 0) {
            const diff = 0 - newOffset;
            newOffset = 0;
            newDuration -= diff;
          }
          if (onUpdateBlock) onUpdateBlock(draggedBlockId, { startOffset: newOffset, duration: newDuration });
        } else if (dragMode === "resizeBottom") {
          let newDuration = initialDurationRef.current + currentDragDelta;
          if (newDuration < 15) newDuration = 15;
          if (initialOffsetRef.current + newDuration > duration * 60) {
            newDuration = duration * 60 - initialOffsetRef.current;
          }
          if (onUpdateBlock) onUpdateBlock(draggedBlockId, { duration: newDuration });
        }
      }

      setDraggedBlockId(null);
      setDragMode(null);
      setDragDeltaMinutes(0);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      if (autoScrollRaf) cancelAnimationFrame(autoScrollRaf);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggedBlockId, dragMode, duration, onUpdateBlock, PIXELS_PER_MINUTE]);

  // Handle Background Long Press & Background Tap
  const handleBgPointerDown = (e: React.PointerEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains("bg-grid")) return;
    
    // Clear selection on background tap
    setSelectedBlockId(null);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    let offsetMinutes = y / PIXELS_PER_MINUTE;
    // Snap
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

  let currentTimeIndicator = null;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  let hoursOffset = currentHour - startHour;
  if (hoursOffset < 0) hoursOffset += 24;
  
  const totalOffsetHours = hoursOffset + (currentMinute / 60);

  if (totalOffsetHours <= duration) {
    currentTimeIndicator = (
      <div 
        className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
        style={{ top: `calc(1rem + ${totalOffsetHours * PIXELS_PER_HOUR}px)` }}
      >
        <div className="w-2 h-2 rounded-full bg-blue-500 -ml-1 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        <div className="h-[1px] flex-1 bg-blue-500/60" />
      </div>
    );
  }

  return (
    <div className="relative w-full flex bg-white/50 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[calc(100vh-140px)] select-none" style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>
      {/* Time Axis */}
      <div className="w-16 flex-shrink-0 border-r border-slate-100/80 bg-white/80 py-4 z-10 pointer-events-none">
        {hours.map((hour, index) => (
          <div
            key={`axis-${index}`}
            className="relative flex justify-end pr-3 transition-[height] duration-300 ease-in-out"
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
            className="absolute left-0 right-0 border-t border-slate-100/60 pointer-events-none bg-grid transition-[top] duration-300 ease-in-out"
            style={{ top: `calc(1rem + ${index * PIXELS_PER_HOUR}px)` }}
          />
        ))}

        {/* Current Time Indicator */}
        {currentTimeIndicator}

        {/* Events Container */}
        <div className="absolute top-4 left-0 right-0 bottom-4 px-2 pointer-events-none">
          {events.map((event) => {
            if (activeTab === "plan" && event.type === "actual") return null;
            if (activeTab === "actual" && event.type === "plan") return null;

            const isDragging = draggedBlockId === event.id;
            
            let currentOffset = event.startOffset;
            let currentDuration = event.duration;

            if (isDragging) {
              if (dragMode === "move") {
                currentOffset += dragDeltaMinutes;
              } else if (dragMode === "resizeTop") {
                currentOffset += dragDeltaMinutes;
                currentDuration -= dragDeltaMinutes;
                if (currentDuration < 15) {
                  const diff = 15 - currentDuration;
                  currentDuration = 15;
                  currentOffset -= diff;
                }
                if (currentOffset < 0) {
                  const diff = 0 - currentOffset;
                  currentOffset = 0;
                  currentDuration -= diff;
                }
              } else if (dragMode === "resizeBottom") {
                currentDuration += dragDeltaMinutes;
                if (currentDuration < 15) currentDuration = 15;
                if (currentOffset + currentDuration > duration * 60) {
                  currentDuration = duration * 60 - currentOffset;
                }
              }
            }

            const topPx = (currentOffset / 60) * PIXELS_PER_HOUR;
            const heightPx = (currentDuration / 60) * PIXELS_PER_HOUR;

            // Layout Calculation
            const col = event.column || 0;
            const totalCols = event.totalColumns || 1;
            
            let leftStr = "0.5rem";
            let widthStr = "calc(100% - 1rem)";

            if (activeTab === "both") {
              const halfWidth = "calc(50% - 0.5rem)";
              if (event.type === "plan") {
                widthStr = `calc(${halfWidth} / ${totalCols})`;
                leftStr = `calc(0.5rem + ${halfWidth} * ${col} / ${totalCols})`;
              } else {
                widthStr = `calc(${halfWidth} / ${totalCols})`;
                leftStr = `calc(50% + 0.25rem + ${halfWidth} * ${col} / ${totalCols})`;
              }
            } else {
              widthStr = `calc((100% - 1rem) / ${totalCols})`;
              leftStr = `calc(0.5rem + (100% - 1rem) * ${col} / ${totalCols})`;
            }

            const isSelected = selectedBlockId === event.id;

            // Appearance based on category and tab
            const category = categories.find(c => c.id === event.categoryId);
            const bgColor = category?.color || "#e2e8f0"; // Fallback color
            
            let blockOpacity = 1;
            
            if (event.type === "plan") {
              blockOpacity = 0.4;
            }

            return (
              <div
                key={event.id}
                className={cn(
                  "absolute rounded-xl shadow-sm transition-transform active:scale-[0.98] cursor-grab active:cursor-grabbing pointer-events-auto select-none flex flex-col text-slate-900 border border-black/5",
                  isSelected ? "touch-none" : "touch-pan-y",
                  isDragging && "z-30 shadow-xl scale-[1.02]", // Removed opacity-90 from tailwind class to rely on style prop
                  !isDragging && "z-20 transition-[top,left,width,height] duration-200",
                  isSelected && "ring-2 ring-slate-900 ring-offset-1 z-30"
                )}
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  left: leftStr,
                  width: widthStr,
                  backgroundColor: bgColor,
                  opacity: isDragging ? 0.9 : blockOpacity,
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none"
                }}
                onPointerDown={(e) => {
                  if (isSelected) {
                    e.stopPropagation();
                    (e.target as HTMLElement).releasePointerCapture(e.pointerId); // Prevent default dragging behaviors
                    setDraggedBlockId(event.id);
                    setDragMode("move");
                    dragStartY.current = e.clientY;
                    initialOffsetRef.current = event.startOffset;
                    initialDurationRef.current = event.duration;
                    setDragDeltaMinutes(0);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDragging && dragDeltaMinutes !== 0) return;

                  const now = Date.now();
                  const lastTap = lastTapTimeRef.current[event.id] || 0;
                  
                  if (now - lastTap < 300) {
                    if (onBlockClick) onBlockClick(event);
                  } else {
                    setSelectedBlockId(event.id);
                  }
                  lastTapTimeRef.current[event.id] = now;
                }}
              >
                {/* Resize Handle Top */}
                {isSelected && (
                  <div 
                    className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize z-40 bg-white/0"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                      setDraggedBlockId(event.id);
                      setDragMode("resizeTop");
                      dragStartY.current = e.clientY;
                      initialOffsetRef.current = event.startOffset;
                      initialDurationRef.current = event.duration;
                      setDragDeltaMinutes(0);
                    }}
                  >
                    <div className="w-8 h-1 rounded-full bg-slate-900/40 shadow-sm pointer-events-none" />
                  </div>
                )}

                {/* Content */}
                <div className={cn(
                  "flex-1 p-2 sm:p-3 overflow-hidden transition-opacity duration-200", 
                  currentDuration <= 15 || isOverviewMode ? "opacity-0" : "opacity-100"
                )}>
                  <div className="text-sm font-bold tracking-tight mb-0.5 leading-tight truncate">{event.title}</div>
                  <div className="text-xs font-medium opacity-70 truncate">
                    {Math.floor(event.duration / 60)}h {event.duration % 60 > 0 ? `${event.duration % 60}m` : ''}
                  </div>
                </div>

                {/* Resize Handle Bottom */}
                {isSelected && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize z-40 bg-white/0"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                      setDraggedBlockId(event.id);
                      setDragMode("resizeBottom");
                      dragStartY.current = e.clientY;
                      initialOffsetRef.current = event.startOffset;
                      initialDurationRef.current = event.duration;
                      setDragDeltaMinutes(0);
                    }}
                  >
                    <div className="w-8 h-1 rounded-full bg-slate-900/40 shadow-sm pointer-events-none" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
