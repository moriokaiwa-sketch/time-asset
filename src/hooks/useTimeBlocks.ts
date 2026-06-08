"use client";

import { useState, useEffect } from "react";

export type TimeBlockType = "plan" | "actual";

export interface TimeBlock {
  id: string;
  title: string;
  startOffset: number; // minutes from shift start
  duration: number; // minutes
  type: TimeBlockType;
  color?: string;
}

export interface ShiftConfig {
  startHour: number; // 0-23
  duration: number; // hours
}

const STORAGE_KEY_BLOCKS = "time-asset-blocks";
const STORAGE_KEY_SHIFT = "time-asset-shift";

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
        setBlocks(JSON.parse(storedBlocks));
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

  const addBlock = (block: Omit<TimeBlock, "id">) => {
    const newBlock: TimeBlock = {
      ...block,
      id: crypto.randomUUID(),
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return {
    blocks,
    shiftConfig,
    isLoaded,
    addBlock,
    removeBlock,
    setShiftConfig,
  };
}
