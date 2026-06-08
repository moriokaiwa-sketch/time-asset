"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { ShiftConfig, TimeBlockType, TimeBlock } from "@/hooks/useTimeBlocks";

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftConfig: ShiftConfig;
  initialStartOffset?: number;
  editingBlock?: TimeBlock | null;
  onAdd: (block: Omit<TimeBlock, "id" | "column" | "totalColumns">) => void;
  onUpdate?: (id: string, updates: Partial<TimeBlock>) => void;
  onDelete?: (id: string) => void;
}

export function BlockModal({ isOpen, onClose, shiftConfig, initialStartOffset, editingBlock, onAdd, onUpdate, onDelete }: BlockModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TimeBlockType>("plan");
  const [startHourInput, setStartHourInput] = useState(shiftConfig.startHour);
  const [startMinuteInput, setStartMinuteInput] = useState(0);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    if (editingBlock) {
      setTitle(editingBlock.title);
      setType(editingBlock.type);
      
      const totalStartMins = editingBlock.startOffset;
      const h = Math.floor(totalStartMins / 60);
      const m = totalStartMins % 60;
      setStartHourInput((shiftConfig.startHour + h) % 24);
      setStartMinuteInput(m);

      setDurationHours(Math.floor(editingBlock.duration / 60));
      setDurationMinutes(editingBlock.duration % 60);
    } else if (initialStartOffset !== undefined) {
      const totalMins = initialStartOffset;
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      setStartHourInput((shiftConfig.startHour + h) % 24);
      setStartMinuteInput(m);
      setTitle("");
      setType("plan");
      setDurationHours(1);
      setDurationMinutes(0);
    } else {
      setStartHourInput(shiftConfig.startHour);
      setStartMinuteInput(0);
      setTitle("");
      setType("plan");
      setDurationHours(1);
      setDurationMinutes(0);
    }
  }, [isOpen, initialStartOffset, shiftConfig.startHour, editingBlock]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Calculate startOffset
    let hourDiff = startHourInput - shiftConfig.startHour;
    if (hourDiff < 0) {
      hourDiff += 24;
    }
    const startOffset = hourDiff * 60 + startMinuteInput;
    const duration = durationHours * 60 + durationMinutes;

    if (editingBlock && onUpdate) {
      onUpdate(editingBlock.id, {
        title,
        startOffset,
        duration,
        type,
      });
    } else {
      onAdd({
        title,
        startOffset,
        duration,
        type,
      });
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (editingBlock && onDelete) {
      onDelete(editingBlock.id);
      onClose();
    }
  };

  const isEditing = !!editingBlock;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? "ブロックを編集" : "ブロックを追加"}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">タイトル</label>
            <input 
              required
              type="text" 
              placeholder="例: 会議、睡眠、休憩など"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Type Toggle */}
          <div className="flex p-1 bg-slate-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => setType("plan")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                type === "plan" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"
              }`}
            >
              PLAN (計画)
            </button>
            <button
              type="button"
              onClick={() => setType("actual")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                type === "actual" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
              }`}
            >
              ACTUAL (実績)
            </button>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">開始時間</label>
            <div className="flex items-center gap-2">
              <select 
                value={startHourInput} 
                onChange={(e) => setStartHourInput(Number(e.target.value))}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}時</option>
                ))}
              </select>
              <span className="font-bold text-slate-400">:</span>
              <select 
                value={startMinuteInput} 
                onChange={(e) => setStartMinuteInput(Number(e.target.value))}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}分</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">所要時間</label>
            <div className="flex items-center gap-2">
              <select 
                value={durationHours} 
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Array.from({ length: 25 }).map((_, i) => (
                  <option key={i} value={i}>{i}時間</option>
                ))}
              </select>
              <select 
                value={durationMinutes} 
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>{m}分</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors active:scale-[0.98] shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors active:scale-[0.98]"
            >
              {isEditing ? "保存する" : "追加する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
