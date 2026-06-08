"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { ShiftConfig } from "@/hooks/useTimeBlocks";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ShiftConfig;
  onSave: (config: ShiftConfig) => void;
}

export function SettingsModal({ isOpen, onClose, currentConfig, onSave }: SettingsModalProps) {
  const [startHour, setStartHour] = useState(currentConfig.startHour);
  const [duration, setDuration] = useState(currentConfig.duration);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ startHour, duration });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">シフト設定</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              1日の開始時間
            </label>
            <div className="flex items-center gap-2">
              <select 
                value={startHour} 
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              夜勤の方は21:00開始、日勤の方は08:00開始のように設定します。
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              表示する長さ（時間）
            </label>
            <select 
              value={duration} 
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={12}>12時間</option>
              <option value={24}>24時間</option>
              <option value={48}>48時間</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors active:scale-[0.98]"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
