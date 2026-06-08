"use client";

import { useState, useEffect } from "react";

export type TimeBlockType = "plan" | "actual";

export interface TimeBlock {
  id: string;
  title: string;
  category?: string;
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
        setBlocks(parsed);
      }

      const storedShift = localStorage.getItem(STORAGE_KEY_SHIFT);
      if (storedShift) {
        setShiftConfig(JSON.parse(storedShift));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save blocks to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(blocks));
    }
  }, [blocks, isLoaded]);

  // Save shift config to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(shiftConfig));
    }
  }, [shiftConfig, isLoaded]);

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

  return {
    blocks,
    shiftConfig,
    isLoaded,
    addBlock,
    updateBlock,
    removeBlock,
    setShiftConfig,
  };
}
