"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check, Eraser } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useMonthlyDays } from "@/hooks/useMonthlyDays";
import { getTemplateBlocks } from "@/utils/template";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { shiftTypes, isLoaded: globalLoaded } = useGlobalSettings();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  const { monthlyData, isLoaded: monthlyLoaded } = useMonthlyDays(year, month);
  
  const [stampShiftId, setStampShiftId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!globalLoaded || !monthlyLoaded) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading Calendar...</div>;
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  // Calculate empty padding days for the first week
  const startDay = startOfMonth(currentDate).getDay(); // 0 = Sunday
  const paddingDays = Array.from({ length: startDay }).map((_, i) => `padding-${i}`);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    if (!stampShiftId) {
      // Normal mode: navigate to timeline
      router.push(`/?date=${dateStr}`);
      return;
    }

    // Stamp Mode
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Handle Eraser Mode
      if (stampShiftId === "delete") {
        if (!user) {
          localStorage.removeItem(`time-asset-shift-${dateStr}`);
          localStorage.removeItem(`time-asset-blocks-${dateStr}`);
          window.dispatchEvent(new Event("storage"));
        } else {
          const docRef = doc(db, "users", user.uid, "days", dateStr);
          await deleteDoc(docRef);
        }
        setIsProcessing(false);
        return;
      }

      // 1. Find template blocks
      const shift = shiftTypes.find(s => s.id === stampShiftId);
      if (!shift) throw new Error("Shift not found");
      const templateBlocks = await getTemplateBlocks(user ? user.uid : null, shift, dateStr);

      // 2. Save data
      if (!user) {
        // Local Mode
        localStorage.setItem(`time-asset-shift-${dateStr}`, stampShiftId);
        if (templateBlocks.length > 0) {
          localStorage.setItem(`time-asset-blocks-${dateStr}`, JSON.stringify(templateBlocks));
        } else {
          // If no template, we just overwrite with empty blocks to clear whatever was there, per "全上書き" strategy
          localStorage.setItem(`time-asset-blocks-${dateStr}`, JSON.stringify([]));
        }
        
        // Force reload by mutating state locally is hard without a context, 
        // but useMonthlyDays has onSnapshot for cloud. For local we might just refresh or ignore.
        // Quick hack for local mode update:
        window.dispatchEvent(new Event("storage"));
        
      } else {
        // Cloud Mode
        const docRef = doc(db, "users", user.uid, "days", dateStr);
        await setDoc(docRef, {
          shiftTypeId: stampShiftId,
          blocks: templateBlocks,
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Stamp failed", e);
      alert("スタンプに失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 px-5 py-4 bg-white/90 backdrop-blur-xl shrink-0 z-50 shadow-sm border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            シフトカレンダー
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <button 
            onClick={handlePrevMonth}
            className="p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-extrabold text-slate-800">
            {format(currentDate, "yyyy年 M月", { locale: ja })}
          </h2>
          <button 
            onClick={handleNextMonth}
            className="p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {["日", "月", "火", "水", "木", "金", "土"].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {paddingDays.map(id => (
              <div key={id} className="aspect-square rounded-xl bg-slate-50/50" />
            ))}

            {daysInMonth.map(date => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayData = monthlyData[dateStr];
              const shift = shiftTypes.find(s => s.id === dayData?.shiftTypeId);
              const isTodayDate = isToday(date);

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(date)}
                  disabled={isProcessing}
                  className={`relative aspect-square flex flex-col items-center justify-start p-1.5 sm:p-2 rounded-2xl border-2 transition-all active:scale-[0.95] ${
                    stampShiftId ? "hover:border-indigo-400" : "hover:bg-slate-50"
                  } ${
                    isTodayDate ? "border-slate-800" : "border-transparent"
                  } bg-slate-50/30`}
                >
                  <span className={`text-xs sm:text-sm font-bold ${isTodayDate ? "text-slate-900" : "text-slate-700"}`}>
                    {format(date, "d")}
                  </span>
                  
                  {shift && (
                    <div className={`mt-auto w-full text-[10px] sm:text-xs font-bold text-center rounded py-0.5 px-1 truncate ${shift.color}`}>
                      {shift.name}
                    </div>
                  )}

                  {!shift && dayData?.hasPlan && (
                    <div className="mt-auto w-1.5 h-1.5 rounded-full bg-slate-400 mb-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stamp Mode Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe pt-4 px-4 pb-6 z-40 rounded-t-3xl">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            スタンプで一括登録
          </h3>
          {stampShiftId && (
            <button 
              onClick={() => setStampShiftId(null)}
              className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 active:scale-95 transition-all"
            >
              解除
            </button>
          )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto snap-x hide-scrollbar pb-2">
          {shiftTypes.map(shift => {
            const isSelected = stampShiftId === shift.id;
            return (
              <button
                key={shift.id}
                onClick={() => setStampShiftId(isSelected ? null : shift.id)}
                className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                  isSelected 
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100" 
                    : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${shift.color.split(' ')[0]}`} />
                <span className="font-bold text-sm">{shift.name}</span>
                {isSelected && <Check className="w-4 h-4 ml-1" />}
              </button>
            );
          })}
          
          <div className="w-[1px] h-8 bg-slate-200 self-center mx-1 flex-shrink-0" />
          
          <button
            onClick={() => setStampShiftId(stampShiftId === "delete" ? null : "delete")}
            className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
              stampShiftId === "delete"
                ? "border-red-500 bg-red-50 text-red-700 shadow-md shadow-red-100" 
                : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="font-bold text-sm">消しゴム</span>
            {stampShiftId === "delete" && <Check className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </main>
  );
}
