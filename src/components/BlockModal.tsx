"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Clock, Copy } from "lucide-react";
import { TimeBlock, ShiftConfig, Category, TimeBlockType } from "@/types";

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftConfig: ShiftConfig;
  categories: Category[];
  initialStartOffset?: number;
  initialType?: TimeBlockType;
  editingBlock?: TimeBlock | null;
  onAdd: (block: Omit<TimeBlock, "id" | "column" | "totalColumns">) => void;
  onUpdate?: (id: string, updates: Partial<TimeBlock>) => void;
  onDelete?: (id: string) => void;
}

export function BlockModal({ isOpen, onClose, shiftConfig, categories, initialStartOffset, initialType = "plan", editingBlock, onAdd, onUpdate, onDelete }: BlockModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TimeBlockType>("plan");
  const [categoryId, setCategoryId] = useState("");
  
  const [startHourInput, setStartHourInput] = useState(shiftConfig.startHour);
  const [startMinuteInput, setStartMinuteInput] = useState(0);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (editingBlock) {
      setTitle(editingBlock.title);
      setType(editingBlock.type);
      setCategoryId(editingBlock.categoryId || categories[0]?.id || "");
      
      const absStartMins = Math.max(0, shiftConfig.startHour * 60 + editingBlock.startOffset);
      const absStartH = Math.floor(absStartMins / 60);
      setStartHourInput(absStartH);
      setStartMinuteInput(absStartMins % 60);

      setDurationHours(Math.floor(editingBlock.duration / 60));
      setDurationMinutes(editingBlock.duration % 60);
    } else if (initialStartOffset !== undefined) {
      const absStartMins = Math.max(0, shiftConfig.startHour * 60 + initialStartOffset);
      const absStartH = Math.floor(absStartMins / 60);
      setStartHourInput(absStartH);
      setStartMinuteInput(absStartMins % 60);
      setTitle("");
      setType(initialType);
      setCategoryId(categories[0]?.id || "");
      setDurationHours(1);
      setDurationMinutes(0);
    } else {
      setStartHourInput(shiftConfig.startHour);
      setStartMinuteInput(0);
      setTitle("");
      setType(initialType);
      setCategoryId(categories[0]?.id || "");
      setDurationHours(1);
      setDurationMinutes(0);
    }
  }, [isOpen, initialStartOffset, shiftConfig.startHour, editingBlock, categories, initialType]);

  if (!isOpen) return null;

  // Compute End Time
  const totalStartMinutes = startHourInput * 60 + startMinuteInput;
  const totalDurationMinutes = durationHours * 60 + durationMinutes;
  const endTotalMinutes = totalStartMinutes + totalDurationMinutes;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;

  const handleEndChange = (newEndHour: number, newEndMin: number) => {
    let diff = (newEndHour * 60 + newEndMin) - totalStartMinutes;
    if (diff < 0) diff = 0; // Prevent negative duration
    setDurationHours(Math.floor(diff / 60));
    setDurationMinutes(diff % 60);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [h, m] = e.target.value.split(':').map(Number);
    setStartHourInput(h);
    setStartMinuteInput(m);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [h, m] = e.target.value.split(':').map(Number);
    handleEndChange(h, m);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const totalMins = Number(e.target.value);
    setDurationHours(Math.floor(totalMins / 60));
    setDurationMinutes(totalMins % 60);
  };

  const handleSetNow = () => {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    
    // Snap to nearest 5 minutes
    m = Math.round(m / 5) * 5;
    if (m === 60) {
      h = (h + 1) % 24;
      m = 0;
    }
    
    // Calculate absolute hour based on shiftConfig.startHour
    let absH = h;
    if (h < shiftConfig.startHour) {
      absH += 24; // assume next day
    }
    
    setStartHourInput(absH);
    setStartMinuteInput(m);
  };

  const handleSetNowEnd = () => {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    
    // Snap to nearest 5 minutes
    m = Math.round(m / 5) * 5;
    if (m === 60) {
      h = (h + 1) % 24;
      m = 0;
    }
    
    // Calculate absolute hour based on startHourInput
    let absH = h;
    if (h < startHourInput % 24 || h < shiftConfig.startHour) {
      absH += 24;
    }
    
    handleEndChange(absH, m);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let startOffset = (startHourInput * 60 + startMinuteInput) - (shiftConfig.startHour * 60);
    if (startOffset < 0) startOffset = 0;
    
    const duration = durationHours * 60 + durationMinutes;

    const blockData = { title, categoryId, startOffset, duration, type };

    if (editingBlock && onUpdate) {
      onUpdate(editingBlock.id, blockData);
    } else {
      onAdd(blockData);
    }
    onClose();
  };

  const handleCopy = () => {
    if (!editingBlock) return;

    let hourDiff = startHourInput - shiftConfig.startHour;
    if (hourDiff < 0) {
      hourDiff += 24;
    }
    const startOffset = hourDiff * 60 + startMinuteInput;
    const duration = durationHours * 60 + durationMinutes;

    onAdd({ title, categoryId, startOffset, duration, type });
    onClose();
  };

  const handleDelete = () => {
    if (editingBlock && onDelete) {
      onDelete(editingBlock.id);
      onClose();
    }
  };

  const isEditing = !!editingBlock;

  // Format times for input[type="time"]
  const startValue = `${startHourInput.toString().padStart(2, '0')}:${startMinuteInput.toString().padStart(2, '0')}`;
  const endValue = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

  // Generate duration options (every 5 mins up to 1 hour)
  const durationOptions = [];
  for (let i = 5; i <= 60; i += 5) {
    const h = Math.floor(i / 60);
    const m = i % 60;
    let label = '';
    if (h > 0) label += `${h}時間`;
    if (m > 0) label += `${m.toString().padStart(2, '0')}分`;
    if (h > 0 && m === 0) label = `${h}時間`;
    durationOptions.push({ value: i, label });
  }

  // If the current duration is not in the generated list, append it so the select UI doesn't break
  if (!durationOptions.find(opt => opt.value === totalDurationMinutes)) {
    const h = Math.floor(totalDurationMinutes / 60);
    const m = totalDurationMinutes % 60;
    let label = '';
    if (h > 0) label += `${h}時間`;
    if (m > 0) label += `${m.toString().padStart(2, '0')}分`;
    if (h > 0 && m === 0) label = `${h}時間`;
    if (totalDurationMinutes === 0) label = "0分";
    durationOptions.push({ value: totalDurationMinutes, label });
    durationOptions.sort((a, b) => a.value - b.value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300 max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            {isEditing ? "Edit Block" : "Add Block"}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <form id="block-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Type Toggle */}
            <div className="flex p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => setType("plan")}
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                  type === "plan" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
                }`}
              >
                PLAN (計画)
              </button>
              <button
                type="button"
                onClick={() => setType("actual")}
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                  type === "actual" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
                }`}
              >
                ACTUAL (実績)
              </button>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">カテゴリ</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Title / Details */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">詳細</label>
              <input 
                type="text" 
                placeholder="例: 会議、睡眠、休憩など"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
              />
            </div>

            {/* Time Settings Container */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-3.5">
              
              {/* Start Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">開始時間</label>
                  <button 
                    type="button" 
                    onClick={handleSetNow}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors active:scale-95"
                  >
                    <Clock className="w-3 h-3" />
                    現在時刻
                  </button>
                </div>
                <div className="flex w-full gap-1">
                  <select
                    value={Math.floor(startHourInput / 24) * 24}
                    onChange={(e) => {
                      const offset = Number(e.target.value);
                      const displayHour = startHourInput % 24;
                      setStartHourInput(offset + displayHour);
                    }}
                    className="w-[35%] p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                  >
                    <option value={0}>当日</option>
                    <option value={24}>翌日</option>
                    <option value={48}>翌々日</option>
                  </select>
                  <select
                    value={(startHourInput % 24).toString().padStart(2, '0')}
                    onChange={(e) => {
                      const displayHour = Number(e.target.value);
                      const offset = Math.floor(startHourInput / 24) * 24;
                      setStartHourInput(offset + displayHour);
                    }}
                    className="w-[35%] p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}時</option>
                    ))}
                  </select>
                  <select
                    value={startMinuteInput.toString().padStart(2, '0')}
                    onChange={(e) => setStartMinuteInput(Number(e.target.value))}
                    className="w-[30%] p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                  >
                    {Array.from({ length: 60 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}分</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full" />

              {/* End Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">終了時間</label>
                  <button 
                    type="button" 
                    onClick={handleSetNowEnd}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors active:scale-95"
                  >
                    <Clock className="w-3 h-3" />
                    現在時刻
                  </button>
                </div>
                <div className="flex w-full gap-1">
                  <select
                    value={Math.floor(endHour / 24) * 24}
                    onChange={(e) => {
                      const offset = Number(e.target.value);
                      const displayHour = endHour % 24;
                      handleEndChange(offset + displayHour, endMinute);
                    }}
                    className="w-[35%] p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                  >
                    <option value={0}>当日</option>
                    <option value={24}>翌日</option>
                    <option value={48}>翌々日</option>
                  </select>
                  <select
                    value={(endHour % 24).toString().padStart(2, '0')}
                    onChange={(e) => {
                      const displayHour = Number(e.target.value);
                      const offset = Math.floor(endHour / 24) * 24;
                      handleEndChange(offset + displayHour, endMinute);
                    }}
                    className="w-[35%] p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}時</option>
                    ))}
                  </select>
                  <select
                    value={endMinute.toString().padStart(2, '0')}
                    onChange={(e) => handleEndChange(endHour, Number(e.target.value))}
                    className="w-[30%] p-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center"
                  >
                    {Array.from({ length: 60 }).map((_, i) => (
                      <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}分</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">所要時間</label>
                <select 
                  value={totalDurationMinutes} 
                  onChange={handleDurationChange}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center appearance-none"
                  style={{ textAlignLast: 'center' }}
                >
                  {durationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0 flex gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors active:scale-[0.98] shrink-0"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            form="block-form"
            type="submit"
            className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold tracking-wider hover:bg-slate-800 transition-colors active:scale-[0.98]"
          >
            {isEditing ? "SAVE" : "ADD"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-100 transition-colors active:scale-[0.98] shrink-0 flex items-center justify-center"
            >
              <Copy className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
