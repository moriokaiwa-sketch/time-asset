import React, { useState, useEffect } from "react";
import { Category } from "@/types";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface CategorySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSelect: (parentId: string, childId?: string) => void;
}

export function CategorySelectModal({ isOpen, onClose, categories, onSelect }: CategorySelectModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedParentId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleParentSelect = (cat: Category) => {
    if (!cat.children || cat.children.length === 0) {
      onSelect(cat.id);
      onClose();
    } else {
      setSelectedParentId(cat.id);
      setStep(2);
    }
  };

  const handleChildSelect = (childId?: string) => {
    if (selectedParentId) {
      onSelect(selectedParentId, childId);
      onClose();
    }
  };

  const selectedParent = categories.find(c => c.id === selectedParentId);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300 flex flex-col max-h-[85vh] h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 bg-white border-b border-slate-100 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {step === 1 ? "カテゴリを選択" : selectedParent?.name}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleParentSelect(cat)}
                  className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 text-left shadow-sm group"
                >
                  <div className="w-5 h-5 rounded-full shadow-sm shrink-0 border border-black/5" style={{ backgroundColor: cat.color }} />
                  <span className="font-bold text-[13px] text-slate-800 flex-1 truncate">{cat.name}</span>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-indigo-400 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              {selectedParent?.children?.map(child => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child.id)}
                  className="w-full flex items-center p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 text-left shadow-sm"
                >
                  <div className="w-2.5 h-2.5 rounded-full mr-4 border border-black/5" style={{ backgroundColor: selectedParent?.color }} />
                  <span className="font-bold text-[14px] text-slate-800">{child.name}</span>
                </button>
              ))}
              
              <button
                onClick={() => handleChildSelect(undefined)}
                className="w-full flex items-center justify-center p-4 mt-4 bg-transparent border-2 border-dashed border-slate-300 rounded-2xl hover:border-slate-400 hover:bg-slate-100 transition-all active:scale-95 text-center"
              >
                <span className="font-bold text-sm text-slate-500">子カテゴリを指定しない</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
