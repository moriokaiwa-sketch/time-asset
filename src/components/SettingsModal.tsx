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
  onReorderCategories: (categories: Category[]) => void;
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
  onReorderCategories,
  shiftTypes,
  onAddShiftType,
  onUpdateShiftType,
  onDeleteShiftType
}: SettingsModalProps) {
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);
  const [activeShiftColorPickerId, setActiveShiftColorPickerId] = useState<string | null>(null);

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    if (direction === 'up' && index > 0) {
      [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    } else if (direction === 'down' && index < newCategories.length - 1) {
      [newCategories[index + 1], newCategories[index]] = [newCategories[index], newCategories[index + 1]];
    }
    onReorderCategories(newCategories);
  };

  const moveChildCategory = (parentId: string, childIndex: number, direction: 'up' | 'down') => {
    const parent = categories.find(c => c.id === parentId);
    if (!parent || !parent.children) return;
    const newChildren = [...parent.children];
    if (direction === 'up' && childIndex > 0) {
      [newChildren[childIndex - 1], newChildren[childIndex]] = [newChildren[childIndex], newChildren[childIndex - 1]];
    } else if (direction === 'down' && childIndex < newChildren.length - 1) {
      [newChildren[childIndex + 1], newChildren[childIndex]] = [newChildren[childIndex], newChildren[childIndex + 1]];
    }
    onUpdateCategory(parentId, { children: newChildren });
  };

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
                シフト
              </button>
              
              {isShiftOpen && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                {shiftTypes.map(shift => (
                  <div key={shift.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveShiftColorPickerId(activeShiftColorPickerId === shift.id ? null : shift.id);
                        }}
                        className={`w-10 h-10 shrink-0 rounded-lg shadow-sm border transition-transform active:scale-95 flex items-center justify-center ${shift.color}`}
                        aria-label="色を変更"
                      />
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
                        <div className="flex gap-1">
                          <select 
                            value={(() => {
                              let val = shift.startHour + shift.duration;
                              return Math.floor(val / 24) * 24;
                            })()}
                            onChange={(e) => {
                              const newOffset = Number(e.target.value);
                              const currentAbs = shift.startHour + shift.duration;
                              const currentDisplay = currentAbs % 24;
                              const newAbs = newOffset + currentDisplay;
                              let newDuration = newAbs - shift.startHour;
                              if (newDuration <= 0) newDuration += 24;
                              onUpdateShiftType(shift.id, { duration: newDuration });
                            }}
                            className="w-[45%] p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value={0}>当日</option>
                            <option value={24}>翌日</option>
                            <option value={48}>翌々日</option>
                          </select>
                          <select 
                            value={(() => {
                              let val = shift.startHour + shift.duration;
                              return val % 24;
                            })()}
                            onChange={(e) => {
                              const newDisplay = Number(e.target.value);
                              const currentAbs = shift.startHour + shift.duration;
                              const currentOffset = Math.floor(currentAbs / 24) * 24;
                              const newAbs = currentOffset + newDisplay;
                              let newDuration = newAbs - shift.startHour;
                              if (newDuration <= 0) newDuration += 24;
                              onUpdateShiftType(shift.id, { duration: newDuration });
                            }}
                            className="w-[55%] p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          >
                            {Array.from({ length: 24 }).map((_, i) => (
                              <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                            ))}
                          </select>
                        </div>
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
                シフトを追加
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
                カテゴリ
              </button>
              
              {isCategoryOpen && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                {categories.map((cat, index) => (
                  <div key={cat.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5 mr-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveCategory(index, 'up')}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        </button>
                        <button
                          type="button"
                          disabled={index === categories.length - 1}
                          onClick={() => moveCategory(index, 'down')}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveColorPickerId(activeColorPickerId === cat.id ? null : cat.id);
                        }}
                        className="w-10 h-10 shrink-0 rounded-lg shadow-sm border border-slate-200 transition-transform active:scale-95 flex items-center justify-center"
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
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
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
                    {/* 子カテゴリ */}
                    <div className="pl-14 pr-2 space-y-2">
                      {(cat.children || []).map((child, childIndex) => (
                        <div key={child.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full border-2" style={{ borderColor: cat.color }} />
                          <input 
                            type="text"
                            value={child.name}
                            onChange={(e) => {
                              const newChildren = [...(cat.children || [])];
                              newChildren[childIndex] = { ...child, name: e.target.value };
                              onUpdateCategory(cat.id, { children: newChildren });
                            }}
                            className="flex-1 p-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="子カテゴリ名"
                          />
                          <div className="flex flex-col gap-0 shrink-0">
                            <button
                              type="button"
                              disabled={childIndex === 0}
                              onClick={() => moveChildCategory(cat.id, childIndex, 'up')}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 px-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            </button>
                            <button
                              type="button"
                              disabled={childIndex === (cat.children?.length || 0) - 1}
                              onClick={() => moveChildCategory(cat.id, childIndex, 'down')}
                              className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 px-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => {
                              const newChildren = (cat.children || []).filter(c => c.id !== child.id);
                              onUpdateCategory(cat.id, { children: newChildren });
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => {
                          const newChild = { id: crypto.randomUUID(), name: "新しい子カテゴリ" };
                          onUpdateCategory(cat.id, { children: [...(cat.children || []), newChild] });
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        子カテゴリを追加
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="button"
                onClick={() => onAddCategory({ name: "新しいカテゴリ", color: "#e2e8f0" })}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-colors active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                親カテゴリを追加
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
