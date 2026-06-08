import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface DayOverview {
  date: string;
  shiftTypeId: string | null;
  hasPlan: boolean;
  hasActual: boolean;
}

export function useMonthlyDays(year: number, month: number) {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<Record<string, DayOverview>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`; // e.g. 2026-06

    if (!user) {
      // Local Mode
      try {
        const newData: Record<string, DayOverview> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("time-asset-shift-") && key.includes(monthStr)) {
            const dateStr = key.replace("time-asset-shift-", "");
            const shiftTypeId = localStorage.getItem(key);
            
            // Check for blocks
            const blocksStr = localStorage.getItem(`time-asset-blocks-${dateStr}`);
            let hasPlan = false;
            let hasActual = false;
            if (blocksStr) {
              const blocks = JSON.parse(blocksStr);
              hasPlan = blocks.some((b: any) => b.type === "plan");
              hasActual = blocks.some((b: any) => b.type === "actual");
            }
            
            newData[dateStr] = {
              date: dateStr,
              shiftTypeId,
              hasPlan,
              hasActual
            };
          }
        }
        setMonthlyData(newData);
      } catch (e) {
        console.error("Failed to load monthly data from localStorage", e);
      } finally {
        setIsLoaded(true);
      }
      return;
    }

    // Cloud Mode
    // We query by the document ID (__name__) which corresponds to the date "YYYY-MM-DD"
    // Since we can't easily query __name__ with startsWith, we can query range
    const startDate = `${monthStr}-01`;
    const endDate = `${monthStr}-31`;
    
    // In Firebase V9+, to query by document ID, we use documentId()
    // However, it's easier to just store `date` field in the document and query it
    // Let's assume all documents saved via useTimeBlocks have a `date` field? No, we didn't add it in useTimeBlocks.
    // Wait, in useTimeBlocks we only used doc(db, "users", user.uid, "days", dateStr).
    // Let's query all days for this user and filter in memory since it's a small dataset, or we can just fetch all and cache.
    // To scale better, let's just fetch all 'days' for now. It won't exceed a few hundred docs for a year.
    
    const q = query(collection(db, "users", user.uid, "days"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData: Record<string, DayOverview> = {};
      snapshot.forEach(docSnap => {
        const dateStr = docSnap.id;
        if (dateStr.startsWith(monthStr)) {
          const data = docSnap.data();
          const blocks = data.blocks || [];
          newData[dateStr] = {
            date: dateStr,
            shiftTypeId: data.shiftTypeId || null,
            hasPlan: blocks.some((b: any) => b.type === "plan"),
            hasActual: blocks.some((b: any) => b.type === "actual")
          };
        }
      });
      setMonthlyData(newData);
      setIsLoaded(true);
    }, (error) => {
      console.error("Firestore error in useMonthlyDays:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user, year, month]);

  return { monthlyData, isLoaded };
}
