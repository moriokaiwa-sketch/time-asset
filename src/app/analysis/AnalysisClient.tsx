"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, addDays, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, PieChart as PieChartIcon, AlignLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

export default function AnalysisClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const dateStr = dateParam || format(new Date(), 'yyyy-MM-dd');
  const currentDate = parseISO(dateStr);

  const { categories, shiftTypes, isLoaded: globalLoaded } = useGlobalSettings();
  const { blocks, shiftTypeId, isLoaded: blocksLoaded } = useTimeBlocks(dateStr);

  if (!globalLoaded || !blocksLoaded) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading Data...</div>;
  }

  // Find current shift config
  const currentShiftType = shiftTypes.find(s => s.id === shiftTypeId) || shiftTypes[0];
  const displayDate = format(currentDate, "yyyy/MM/dd (E)", { locale: ja });

  const handlePrevDay = () => {
    router.push(`/analysis?date=${format(subDays(currentDate, 1), "yyyy-MM-dd")}`);
  };

  const handleNextDay = () => {
    router.push(`/analysis?date=${format(addDays(currentDate, 1), "yyyy-MM-dd")}`);
  };

  const handleGoToTimeline = () => {
    router.push(`/?date=${dateStr}`);
  };

  // Process data for the pie chart
  const actualBlocks = blocks.filter(b => b.type === "actual");
  const totalActualMinutes = actualBlocks.reduce((sum, block) => sum + block.duration, 0);

  const chartData = useMemo(() => {
    if (totalActualMinutes === 0) return [];

    const categoryMap = new Map<string, number>();
    actualBlocks.forEach(block => {
      const catId = block.categoryId || "";
      const current = categoryMap.get(catId) || 0;
      categoryMap.set(catId, current + block.duration);
    });

    const data = Array.from(categoryMap.entries()).map(([catId, duration]) => {
      const category = categories.find(c => c.id === catId);
      return {
        id: catId,
        name: category ? category.name : "未分類",
        value: duration,
        color: category ? category.color : "#cbd5e1"
      };
    });

    // Sort descending by value
    data.sort((a, b) => b.value - a.value);
    return data;
  }, [actualBlocks, categories, totalActualMinutes]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return m > 0 ? `${h}hr ${m}min` : `${h}hr`;
    }
    return `${m}min`;
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      <header className="sticky top-0 px-5 pt-6 pb-4 bg-white/90 backdrop-blur-xl shrink-0 z-50 shadow-sm border-b border-slate-100/50">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Analysis
              </h1>
              <p className="text-sm font-bold text-slate-500 mt-0.5 whitespace-nowrap">
                {currentShiftType?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleGoToTimeline}
              className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95 flex items-center justify-center gap-1.5 px-4 font-bold text-sm"
            >
              <AlignLeft className="w-5 h-5" />
              <span className="hidden sm:inline">タイムライン</span>
            </button>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-between p-1 bg-slate-100/80 rounded-2xl">
          <button 
            onClick={handlePrevDay}
            className="p-3 text-slate-600 hover:text-slate-900 transition-colors active:scale-95 hover:bg-slate-200/50 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-extrabold text-slate-800 tracking-tight text-base">
            {displayDate}
          </div>
          <button 
            onClick={handleNextDay}
            className="p-3 text-slate-600 hover:text-slate-900 transition-colors active:scale-95 hover:bg-slate-200/50 rounded-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-6">
        {totalActualMinutes === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
            <PieChartIcon className="w-12 h-12 opacity-20" />
            <p className="font-bold">この日の実績データはありません</p>
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="w-full h-72 mb-8 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => formatDuration(Number(value))}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-xl font-extrabold text-slate-800">{formatDuration(totalActualMinutes)}</span>
              </div>
            </div>

            {/* Category Details List */}
            <div className="space-y-3">
              {chartData.map((item, idx) => {
                const percentage = ((item.value / totalActualMinutes) * 100).toFixed(1);
                return (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate text-base">{item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900">{formatDuration(item.value)}</div>
                      <div className="text-xs font-bold text-slate-400">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
