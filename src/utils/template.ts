import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TimeBlock } from "@/types";

/**
 * Copies the PLAN blocks from the most recent past date that had the same shiftTypeId.
 * Returns the blocks array to be saved.
 */
export async function getTemplateBlocks(userId: string | null, shiftTypeId: string, targetDateStr: string): Promise<TimeBlock[]> {
  if (!userId) {
    // Local Mode: Search all localStorage keys for time-asset-shift-*
    let mostRecentDate = "";
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("time-asset-shift-")) {
        const storedShiftId = localStorage.getItem(key);
        if (storedShiftId === shiftTypeId) {
          const dateStr = key.replace("time-asset-shift-", "");
          if (dateStr < targetDateStr && dateStr > mostRecentDate) {
            // Check if it has PLAN blocks
            const blocksStr = localStorage.getItem(`time-asset-blocks-${dateStr}`);
            if (blocksStr) {
              const blocks = JSON.parse(blocksStr) as TimeBlock[];
              if (blocks.some(b => b.type === "plan")) {
                mostRecentDate = dateStr;
              }
            }
          }
        }
      }
    }

    if (mostRecentDate) {
      const blocksStr = localStorage.getItem(`time-asset-blocks-${mostRecentDate}`);
      if (blocksStr) {
        const blocks = JSON.parse(blocksStr) as TimeBlock[];
        // Extract only plan blocks and generate new IDs
        return blocks
          .filter(b => b.type === "plan")
          .map(b => ({ ...b, id: crypto.randomUUID() }));
      }
    }
    
    return [];
  }

  // Cloud Mode
  try {
    const daysRef = collection(db, "users", userId, "days");
    
    // In Firestore, we can query by shiftTypeId and order by __name__ (document ID, which is the date)
    // We want the most recent date before targetDateStr
    // Unfortunately, querying by __name__ with < and ordering by __name__ descending along with where("shiftTypeId", "==") requires a composite index.
    // To avoid making the user create an index, we can just fetch all documents with this shiftTypeId (which should be small) and find the closest one in memory.
    
    const q = query(daysRef, where("shiftTypeId", "==", shiftTypeId));
    const snapshot = await getDocs(q);
    
    let mostRecentDate = "";
    let mostRecentBlocks: TimeBlock[] = [];
    
    snapshot.forEach(docSnap => {
      const dateStr = docSnap.id;
      if (dateStr < targetDateStr && dateStr > mostRecentDate) {
        const data = docSnap.data();
        const blocks = (data.blocks || []) as TimeBlock[];
        if (blocks.some(b => b.type === "plan")) {
          mostRecentDate = dateStr;
          mostRecentBlocks = blocks;
        }
      }
    });

    if (mostRecentBlocks.length > 0) {
      return mostRecentBlocks
        .filter(b => b.type === "plan")
        .map(b => ({ ...b, id: crypto.randomUUID() }));
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch template blocks:", error);
    return [];
  }
}
