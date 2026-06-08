import React from "react";
import { Timeline } from "@/components/Timeline";
import { Clock, Calendar, Settings } from "lucide-react";

export default function Home() {
  // Mock data representing a shift worker's day (e.g. night shift 21:00 to 21:00)
  const shiftStartHour = 21;
  const shiftDuration = 24;

  const mockEvents = [
    {
      id: "1",
      title: "Night Shift Work",
      startOffset: 0, // starts at 21:00
      duration: 540, // 9 hours
      type: "actual" as const,
      color: "bg-indigo-50 border-indigo-200 text-indigo-900",
    },
    {
      id: "2",
      title: "Sleep (Recovery)",
      startOffset: 660, // starts at 08:00 (+11h)
      duration: 420, // 7 hours
      type: "plan" as const,
      color: "bg-blue-50 border-blue-200 text-blue-900",
    },
    {
      id: "3",
      title: "Free Time / Hobby",
      startOffset: 1140, // starts at 16:00 (+19h)
      duration: 180, // 3 hours
      type: "plan" as const,
      color: "bg-emerald-50 border-emerald-200 text-emerald-900",
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      {/* Header Area */}
      <header className="px-6 pt-12 pb-6 bg-white shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Time Asset
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Today's Shift: 21:00 - 21:00
            </p>
          </div>
          <button className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-slate-100/80 rounded-2xl">
          <button className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-white text-slate-900 shadow-sm transition-all">
            PLAN
          </button>
          <button className="flex-1 py-2.5 text-sm font-bold rounded-xl text-slate-500 hover:text-slate-700 transition-all">
            ACTUAL
          </button>
        </div>
      </header>

      {/* Scrollable Timeline Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <Timeline 
          startHour={shiftStartHour} 
          duration={shiftDuration} 
          events={mockEvents}
        />
      </div>

      {/* Floating Action Button for adding time blocks */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <button className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
          <Clock className="w-5 h-5" />
          Add Block
        </button>
      </div>
    </main>
  );
}
