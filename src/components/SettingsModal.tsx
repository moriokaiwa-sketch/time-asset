"use client";

import React, { useState } from "react";
import { X, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Category, ShiftType } from "@/types";

const PRESET_COLORS = [
  "#fecaca", // red-200
  "#fed7aa", // orange-200
  "#fef08a", // yellow-200
  "#bbf7d0", // green-200
  "#bfdbfe", // blue-200
  "#dbeafe", // blue-100
  "#c7d2fe", // indigo-200
  "#e9d5ff", // purple-200
  "#fbcfe8", // pink-200
  "#e2e8f0", // slate-200
];

const PRESET_SHIFT_COLORS = [
  "bg-red-100 text-red-700 border-red-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-slate-100 text-slate-700 border-slate-200",
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, "id">) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  shiftTypes: ShiftType[];
  onAddShiftType: (shiftType: Omit<ShiftType, "id">) => void;
  onUpdateShiftType: (id: string, updates: Partial<ShiftType>) => void;
  onDeleteShiftType: (id: string) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  shiftTypes,
  onAddShiftType,
  onUpdateShiftType,
  onDeleteShiftType
}: SettingsModalProps) {
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);
  const [activeShiftColorPickerId, setActiveShiftColorPickerId] = useState<string | null>(null);

  if (!isOpen) return null;

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
          <div className="space-y-8">
            
            {/* Shift Settings */}
            <div className="space-y-4">
              <button 
                type="button"
                onClick={() => setIsShiftOpen(!isShiftOpen)}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider w-full text-left"
              >
                {isShiftOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                シフト種別
              </button>
              
              {isShiftOpen && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                {shiftTypes.map(shift => (
                  <div key={shift.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setActiveShiftColorPickerId(activeShiftColorPickerId === shift.id ? null : shift.id)}
                        className={`w-10 h-10 shrink-0 rounded-lg shadow-sm border transition-transform active:scale-95 flex items-center justify-center font-bold text-xs ${shift.color}`}
                        aria-label="色を変更"
                      >
                        色
                      </button>
                      <input 
                        type="text"
                        value={shift.name}
                        onChange={(e) => onUpdateShiftType(shift.id, { name: e.target.value })}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="シフト名"
                      />
                      <button 
                        type="button" 
                        onClick={() => onDeleteShiftType(shift.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {activeShiftColorPickerId === shift.id && (
                      <div className="flex flex-wrap gap-2 pt-1 pb-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {PRESET_SHIFT_COLORS.map(colorClass => (
                          <button
                            key={colorClass}
                            type="button"
                            onClick={() => {
                              onUpdateShiftType(shift.id, { color: colorClass });
                              setActiveShiftColorPickerId(null);
                            }}
                            className={`w-8 h-8 rounded-full border transition-transform active:scale-95 ${colorClass} ${shift.color === colorClass ? 'scale-110 ring-2 ring-slate-800 ring-offset-1' : 'shadow-sm border-transparent'}`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">前日の就寝時刻</label>
                        <select 
                          value={shift.startHour}
                          onChange={(e) => onUpdateShiftType(shift.id, { startHour: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">当日の就寝時刻</label>
                        <select 
                          value={(shift.startHour + shift.duration) % 24}
                          onChange={(e) => {
                            const endHour = Number(e.target.value);
                            let newDuration = endHour - shift.startHour;
                            if (newDuration <= 0) newDuration += 24;
                            // 24時間以上の表示に対応するため、もし以前のdurationが24より大きかった場合の考慮は一旦せずシンプルに24時間以内とする
                            onUpdateShiftType(shift.id, { duration: newDuration });
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* 勤務時間設定 */}
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">勤務開始</label>
                        <input
                          type="time"
                          value={shift.workStartTime ?? (shift.workStartHour != null ? `${shift.workStartHour.toString().padStart(2, '0')}:00` : `${shift.startHour.toString().padStart(2, '0')}:00`)}
                          onChange={(e) => onUpdateShiftType(shift.id, { workStartTime: e.target.value })}
                          className="w-full p-2 bg-slate-100 border-none rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">勤務終了</label>
                        <input
                          type="time"
                          value={shift.workEndTime ?? (shift.workEndHour != null ? `${shift.workEndHour.toString().padStart(2, '0')}:00` : `${((shift.startHour + shift.duration) % 24).toString().padStart(2, '0')}:00`)}
                          onChange={(e) => onUpdateShiftType(shift.id, { workEndTime: e.target.value })}
                          className="w-full p-2 bg-slate-100 border-none rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button"
                onClick={() => onAddShiftType({ name: "新規シフト", color: "bg-slate-100 text-slate-700 border-slate-200", startHour: 9, duration: 24 })}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-colors active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                シフト種別を追加
              </button>
              </div>
              )}
            </div>

            {/* Category Settings */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider w-full text-left"
              >
                {isCategoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                カテゴリ設定
              </button>
              
              {isCategoryOpen && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setActiveColorPickerId(activeColorPickerId === cat.id ? null : cat.id)}
                        className="w-10 h-10 shrink-0 rounded-lg shadow-sm border border-slate-200 transition-transform active:scale-95"
                        style={{ backgroundColor: cat.color }}
                        aria-label="色を変更"
                      />
                      <input 
                        type="text"
                        value={cat.name}
                        onChange={(e) => onUpdateCategory(cat.id, { name: e.target.value })}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {activeColorPickerId === cat.id && (
                      <div className="flex flex-wrap gap-2 pt-1 pb-1 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              onUpdateCategory(cat.id, { color });
                              setActiveColorPickerId(null);
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${cat.color === color ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
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
              )}
            </div>

          </div>
        </div>

        <div className="p-6 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold tracking-wider hover:bg-slate-800 transition-colors active:scale-[0.98]"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
}
