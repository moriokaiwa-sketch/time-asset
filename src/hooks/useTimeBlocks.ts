"use client";

import { useState, useEffect } from "react";

export type TimeBlockType = "plan" | "actual";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  categoryId?: string; // Using categoryId instead of category string for color linking
  category?: string; // Kept for backwards compatibility for older blocks
  startOffset: number; // minutes from shift start
  duration: number; // minutes
  type: TimeBlockType;
  color?: string;
  // Computed properties for layout
  column?: number;
  totalColumns?: number;
}

export interface ShiftConfig {
  startHour: number; // 0-23
  duration: number; // hours
}

const STORAGE_KEY_BLOCKS = "time-asset-blocks";
const STORAGE_KEY_SHIFT = "time-asset-shift";
const STORAGE_KEY_CATEGORIES = "time-asset-categories";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "仕事", name: "仕事", color: "#dbeafe" }, // blue-100
  { id: "会議", name: "会議", color: "#e0f2fe" }, // sky-100
  { id: "作業", name: "作業", color: "#e0e7ff" }, // indigo-100
  { id: "睡眠", name: "睡眠", color: "#ede9fe" }, // violet-100
  { id: "食事", name: "食事", color: "#fef3c7" }, // amber-100
  { id: "休憩", name: "休憩", color: "#d1fae5" }, // emerald-100
  { id: "移動", name: "移動", color: "#f1f5f9" }, // slate-100
  { id: "家事", name: "家事", color: "#ffe4e6" }, // rose-100
  { id: "趣味", name: "趣味", color: "#fce7f3" }, // pink-100
  { id: "その他", name: "その他", color: "#e2e8f0" }, // slate-200
];

// Helper to calculate overlaps within a specific type of blocks
function calculateOverlaps(blocks: TimeBlock[]): TimeBlock[] {
  if (blocks.length === 0) return [];
  
  const sorted = [...blocks].sort((a, b) => a.startOffset - b.startOffset);
  const result: TimeBlock[] = [];
  
  let currentGroup: TimeBlock[] = [];
  let groupEnd = 0;

  const processGroup = (group: TimeBlock[]) => {
    const columns: TimeBlock[][] = [];
    group.forEach(block => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        if (lastInCol.startOffset + lastInCol.duration <= block.startOffset) {
          columns[i].push(block);
          block.column = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([block]);
        block.column = columns.length - 1;
      }
    });
    
    const maxCols = columns.length;
    group.forEach(block => {
      block.totalColumns = maxCols;
      result.push(block);
    });
  };

  sorted.forEach(block => {
    if (currentGroup.length === 0) {
      currentGroup.push(block);
      groupEnd = block.startOffset + block.duration;
    } else {
      if (block.startOffset < groupEnd) {
        currentGroup.push(block);
        groupEnd = Math.max(groupEnd, block.startOffset + block.duration);
      } else {
        processGroup(currentGroup);
        currentGroup = [block];
        groupEnd = block.startOffset + block.duration;
      }
    }
  });

  if (currentGroup.length > 0) {
    processGroup(currentGroup);
  }

  return result;
}

export function useTimeBlocks() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>({
    startHour: 21,
    duration: 24,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedBlocks = localStorage.getItem(STORAGE_KEY_BLOCKS);
      if (storedBlocks) {
        const parsed = JSON.parse(storedBlocks);
        // Migration for older blocks: map 'category' string to 'categoryId'
        const migrated = parsed.map((b: any) => {
          if (b.category && !b.categoryId) {
            return { ...b, categoryId: b.category };
          }
          return b;
        });
        setBlocks(migrated);
      }

      const storedShift = localStorage.getItem(STORAGE_KEY_SHIFT);
      if (storedShift) {
        setShiftConfig(JSON.parse(storedShift));
      }

      const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save data to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(blocks));
      localStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(shiftConfig));
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    }
  }, [blocks, shiftConfig, categories, isLoaded]);

  const setAndProcessBlocks = (newBlocks: TimeBlock[]) => {
    const plans = calculateOverlaps(newBlocks.filter(b => b.type === "plan"));
    const actuals = calculateOverlaps(newBlocks.filter(b => b.type === "actual"));
    setBlocks([...plans, ...actuals]);
  };

  const addBlock = (block: Omit<TimeBlock, "id" | "column" | "totalColumns">) => {
    const newBlock: TimeBlock = {
      ...block,
      id: crypto.randomUUID(),
    };
    setAndProcessBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<TimeBlock>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    setAndProcessBlocks(newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setAndProcessBlocks(newBlocks);
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  return {
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
    removeCategory,
  };
}
