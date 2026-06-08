"use client";

import React, { useState } from "react";
import { Timeline } from "@/components/Timeline";
import { Clock, Calendar, Settings } from "lucide-react";
import { useTimeBlocks, TimeBlock } from "@/hooks/useTimeBlocks";
import { BlockModal } from "@/components/BlockModal";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  const { 
    blocks, 
    categories,
    shiftConfig, 
    isLoaded, 
    addBlock, 
    updateBlock, 
    removeBlock, 
    setShiftConfig,
    addCategory,
    updateCategory,
    removeCategory
  } = useTimeBlocks();
  
  const [activeTab, setActiveTab] = useState<"plan" | "actual">("plan");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialOffset, setInitialOffset] = useState<number | undefined>(undefined);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  if (!isLoaded) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  // Calculate shift end hour for display
  const endHour = (shiftConfig.startHour + shiftConfig.duration) % 24;

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
      {/* Header Area */}
      <header className="sticky top-0 px-5 pt-6 pb-4 bg-white/90 backdrop-blur-xl shrink-0 z-50 shadow-sm border-b border-slate-100/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Time Asset
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Today's Shift: {shiftConfig.startHour.toString().padStart(2, '0')}:00 - {endHour.toString().padStart(2, '0')}:00
            </p>
          </div>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-slate-100/80 rounded-2xl">
          <button 
            onClick={() => setActiveTab("plan")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "plan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            PLAN
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
        />
      </div>

      {/* Floating Action Button for adding time blocks */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <button 
          onClick={() => { setEditingBlock(null); setInitialOffset(undefined); setIsAddModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Clock className="w-5 h-5" />
          Add Block
        </button>
      </div>

      {/* Modals */}
      <BlockModal 
        isOpen={isAddModalOpen} 
        onClose={closeBlockModal} 
        shiftConfig={shiftConfig}
        categories={categories}
        initialStartOffset={initialOffset}
        editingBlock={editingBlock}
        onAdd={addBlock}
        onUpdate={updateBlock}
        onDelete={removeBlock}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentConfig={shiftConfig}
        onSave={setShiftConfig}
        categories={categories}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={removeCategory}
      />
    </main>
  );
}
