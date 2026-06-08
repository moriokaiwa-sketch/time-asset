import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TimeBlock, TimeBlockType, DayData } from "@/types";

const STORAGE_KEY_BLOCKS_PREFIX = "time-asset-blocks-";
const STORAGE_KEY_SHIFT_PREFIX = "time-asset-shift-";

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

export function useTimeBlocks(dateStr: string) {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [shiftTypeId, setShiftTypeId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!dateStr) return;
    setIsLoaded(false);

    if (!user) {
      // Local Mode
      try {
        const storedBlocks = localStorage.getItem(`${STORAGE_KEY_BLOCKS_PREFIX}${dateStr}`);
        if (storedBlocks) {
          const parsed = JSON.parse(storedBlocks);
          setBlocks(parsed);
        } else {
          setBlocks([]);
        }

        const storedShiftType = localStorage.getItem(`${STORAGE_KEY_SHIFT_PREFIX}${dateStr}`);
        if (storedShiftType) {
          setShiftTypeId(storedShiftType);
        } else {
          setShiftTypeId(null);
        }
      } catch (e) {
        console.error("Failed to load daily data from localStorage", e);
      } finally {
        setIsLoaded(true);
      }
      return;
    }

    // Cloud Mode
    const docRef = doc(db, "users", user.uid, "days", dateStr);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) return;

      if (docSnap.exists()) {
        const data = docSnap.data();
        setBlocks(data.blocks || []);
        setShiftTypeId(data.shiftTypeId || null);
        setIsLoaded(true);
      } else {
        // Migration from local specific date data or global legacy data
        try {
          let localBlocks = [];
          const storedBlocks = localStorage.getItem(`${STORAGE_KEY_BLOCKS_PREFIX}${dateStr}`);
          
          // Check for legacy global block if today
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const legacyBlocksStr = localStorage.getItem("time-asset-blocks");
          
          if (storedBlocks) {
            localBlocks = JSON.parse(storedBlocks);
          } else if (isToday && legacyBlocksStr) {
            const parsed = JSON.parse(legacyBlocksStr);
            localBlocks = parsed.map((b: any) => {
              if (b.category && !b.categoryId) return { ...b, categoryId: b.category };
              return b;
            });
            // Clear legacy to prevent re-migration
            localStorage.removeItem("time-asset-blocks");
          }

          let localShiftType = null;
          const storedShiftType = localStorage.getItem(`${STORAGE_KEY_SHIFT_PREFIX}${dateStr}`);
          if (storedShiftType) {
            localShiftType = storedShiftType;
          }

          if (localBlocks.length > 0 || localShiftType) {
            await setDoc(docRef, {
              blocks: localBlocks,
              shiftTypeId: localShiftType,
              updatedAt: serverTimestamp()
            });
          }
          
          setBlocks(localBlocks);
          setShiftTypeId(localShiftType);
          setIsLoaded(true);
        } catch (error) {
          console.error("Migration failed:", error);
          setIsLoaded(true);
        }
      }
    }, (error) => {
      console.error("Firestore error in useTimeBlocks:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user, dateStr]);

  const saveData = async (b: TimeBlock[], sId: string | null) => {
    if (!dateStr) return;
    
    // Always save locally as backup
    localStorage.setItem(`${STORAGE_KEY_BLOCKS_PREFIX}${dateStr}`, JSON.stringify(b));
    if (sId) {
      localStorage.setItem(`${STORAGE_KEY_SHIFT_PREFIX}${dateStr}`, sId);
    } else {
      localStorage.removeItem(`${STORAGE_KEY_SHIFT_PREFIX}${dateStr}`);
    }

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "days", dateStr), {
          blocks: b,
          shiftTypeId: sId,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to save daily data to Firestore", error);
      }
    }
  };

  const setAndProcessBlocks = (newBlocks: TimeBlock[]) => {
    const plans = calculateOverlaps(newBlocks.filter(b => b.type === "plan"));
    const actuals = calculateOverlaps(newBlocks.filter(b => b.type === "actual"));
    const processed = [...plans, ...actuals];
    setBlocks(processed);
    saveData(processed, shiftTypeId);
  };

  const updateShiftTypeId = (newId: string | null) => {
    setShiftTypeId(newId);
    saveData(blocks, newId);
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
    shiftTypeId,
    isLoaded,
    addBlock,
    updateBlock,
    removeBlock,
    setShiftTypeId: updateShiftTypeId,
  };
}
