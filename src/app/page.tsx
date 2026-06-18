"use client";

import React, { useState, Suspense } from "react";
import { Timeline } from "@/components/Timeline";
import { Clock, Calendar as CalendarIcon, Settings, Rows4, ZoomIn, LogIn, LogOut, CalendarDays } from "lucide-react";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { TimeBlock, ShiftConfig } from "@/types";
import { BlockModal } from "@/components/BlockModal";
import { SettingsModal } from "@/components/SettingsModal";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const dateStr = dateParam || format(new Date(), 'yyyy-MM-dd');
  
  const { user, loading, signIn, signOut } = useAuth();
  const { 
    categories, 
    shiftTypes, 
    isLoaded: globalLoaded,
    addCategory,
    updateCategory,
    removeCategory,
    addShiftType,
    updateShiftType,
    removeShiftType
  } = useGlobalSettings();

  const { 
    blocks, 
    shiftTypeId,
    isLoaded: blocksLoaded, 
    addBlock, 
    updateBlock, 
    removeBlock, 
    setShiftTypeId
  } = useTimeBlocks(dateStr);
  
  const [activeTab, setActiveTab] = useState<"plan" | "both" | "actual">("actual");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialOffset, setInitialOffset] = useState<number | undefined>(undefined);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isOverviewMode, setIsOverviewMode] = useState(false);

  if (!globalLoaded || !blocksLoaded) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading Data...</div>;
  }

  // Find current shift config
  const currentShiftType = shiftTypes.find(s => s.id === shiftTypeId) || shiftTypes[0];
  const shiftConfig: ShiftConfig = { 
    startHour: currentShiftType.startHour, 
    duration: currentShiftType.duration 
  };

  const endHour = (shiftConfig.startHour + shiftConfig.duration) % 24;
  
  // Calculate work hours for display
  const legacyStart = currentShiftType.workStartHour ?? shiftConfig.startHour;
  const legacyEnd = currentShiftType.workEndHour ?? endHour;
  
  const displayWorkStart = currentShiftType.workStartTime ?? `${legacyStart.toString().padStart(2, '0')}:00`;
  const displayWorkEnd = currentShiftType.workEndTime ?? `${legacyEnd.toString().padStart(2, '0')}:00`;
  
  // Format display date
  const displayDate = format(parseISO(dateStr), "yyyy年M月d日(E)", { locale: ja });

  const handleAddBlockRequest = (offset: number) => {
    setEditingBlock(null);
    setInitialOffset(offset);
    setIsAddModalOpen(true);
  };

  const handleBlockClick = (block: TimeBlock) => {
    setEditingBlock(block);
    setInitialOffset(undefined);
    setIsAddModalOpen(true);
  };

  const closeBlockModal = () => {
    setIsAddModalOpen(false);
    setInitialOffset(undefined);
    setEditingBlock(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      <header className="sticky top-0 px-5 pt-6 pb-4 bg-white/90 backdrop-blur-xl shrink-0 z-50 shadow-sm border-b border-slate-100/50">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 truncate">
              Time Asset
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1 whitespace-nowrap">
              {displayDate}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">

            <button 
              onClick={() => router.push('/calendar')}
              className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95 flex items-center justify-center gap-1.5 px-4 font-bold text-sm"
            >
              <CalendarDays className="w-5 h-5" />
              <span className="hidden sm:inline">カレンダー</span>
            </button>
            {!loading && (
              <button 
                onClick={user ? signOut : signIn}
                className={`p-2.5 rounded-full transition-colors active:scale-95 ${
                  user ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title={user ? `Signed in as ${user.displayName}` : "Sign in to sync to cloud"}
              >
                {user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </button>
            )}
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-4">
          <button 
            onClick={() => setActiveTab("plan")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "plan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            PLAN
          </button>
          <button 
            onClick={() => setActiveTab("both")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "both" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            BOTH
          </button>
          <button 
            onClick={() => setActiveTab("actual")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "actual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ACTUAL
          </button>
        </div>
      </header>

      {/* Scrollable Timeline Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <Timeline 
          startHour={shiftConfig.startHour} 
          duration={shiftConfig.duration} 
          events={blocks}
          categories={categories}
          activeTab={activeTab}
          onUpdateBlock={updateBlock}
          onAddBlockRequest={handleAddBlockRequest}
          onBlockClick={handleBlockClick}
          isOverviewMode={isOverviewMode}
        />
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 left-0 right-0 z-30 flex items-center justify-center pointer-events-none px-6">
        <button 
          onClick={() => { setEditingBlock(null); setInitialOffset(undefined); setIsAddModalOpen(true); }}
          className="pointer-events-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-7 py-4 rounded-full font-bold shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
        >
          Add Block
        </button>

        <button
          onClick={() => setIsOverviewMode(!isOverviewMode)}
          className="pointer-events-auto absolute right-6 flex items-center justify-center p-3.5 bg-white text-slate-700 rounded-full shadow-lg shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all border border-slate-100 flex-shrink-0"
          aria-label={isOverviewMode ? "詳細表示" : "全体表示"}
        >
          {isOverviewMode ? <ZoomIn className="w-5 h-5" /> : <Rows4 className="w-5 h-5" />}
        </button>
      </div>

      {/* Modals */}
      <BlockModal 
        isOpen={isAddModalOpen} 
        onClose={closeBlockModal} 
        shiftConfig={shiftConfig}
        categories={categories}
        initialStartOffset={initialOffset}
        initialType={activeTab === "both" ? "actual" : activeTab}
        editingBlock={editingBlock}
        onAdd={addBlock}
        onUpdate={updateBlock}
        onDelete={removeBlock}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        shiftTypes={shiftTypes}
        onAddShiftType={addShiftType}
        onUpdateShiftType={updateShiftType}
        onDeleteShiftType={removeShiftType}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={removeCategory}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
