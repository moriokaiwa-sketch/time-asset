"use client";

import React, { useState } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { ShiftConfig, Category } from "@/hooks/useTimeBlocks";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ShiftConfig;
  onSave: (config: ShiftConfig) => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, "id">) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  currentConfig, 
  onSave,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: SettingsModalProps) {
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
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">設定</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Shift Settings */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">シフト設定</h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  1日の開始時間
                </label>
                <div className="flex items-center gap-2">
                  <select 
                    value={startHour} 
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={12}>12時間</option>
                  <option value={24}>24時間</option>
                  <option value={48}>48時間</option>
                </select>
              </div>
            </div>

            {/* Category Settings */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">カテゴリ設定</h3>
              
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                      <input 
                        type="color" 
                        value={cat.color}
                        onChange={(e) => onUpdateCategory(cat.id, { color: e.target.value })}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                      />
                    </div>
                    <input 
                      type="text"
                      value={cat.name}
                      onChange={(e) => onUpdateCategory(cat.id, { name: e.target.value })}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                type="button"
                onClick={() => onAddCategory({ name: "新しいカテゴリ", color: "#e2e8f0" })}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-colors active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                カテゴリを追加
              </button>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 shrink-0">
          <button
            form="settings-form"
            type="submit"
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold tracking-wider hover:bg-slate-800 transition-colors active:scale-[0.98]"
          >
            SAVE
          </button>
        </div>

      </div>
    </div>
  );
}
