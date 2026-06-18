import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category, ShiftType, DEFAULT_CATEGORIES, DEFAULT_SHIFT_TYPES } from "@/types";

const STORAGE_KEY_CATEGORIES = "time-asset-categories";
const STORAGE_KEY_SHIFTTYPES = "time-asset-shift-types";

export function useGlobalSettings() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>(DEFAULT_SHIFT_TYPES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      // Local Mode
      try {
        const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
        if (storedCategories) setCategories(JSON.parse(storedCategories));

        const storedShiftTypes = localStorage.getItem(STORAGE_KEY_SHIFTTYPES);
        if (storedShiftTypes) {
          let parsed = JSON.parse(storedShiftTypes);
          if (parsed.length === 3 && !parsed.some((s: any) => s.id === "late")) {
            parsed = DEFAULT_SHIFT_TYPES;
            localStorage.setItem(STORAGE_KEY_SHIFTTYPES, JSON.stringify(parsed));
          }
          setShiftTypes(parsed);
        }
      } catch (e) {
        console.error("Failed to load global settings from localStorage", e);
      } finally {
        setIsLoaded(true);
      }
      return;
    }

    // Cloud Mode
    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) return;

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategories(data.categories || DEFAULT_CATEGORIES);
        
        let loadedShiftTypes = data.shiftTypes || DEFAULT_SHIFT_TYPES;
        // Migration to 5 defaults
        if (loadedShiftTypes.length === 3 && !loadedShiftTypes.some((s: any) => s.id === "late")) {
          loadedShiftTypes = DEFAULT_SHIFT_TYPES;
          setDoc(docRef, { shiftTypes: loadedShiftTypes }, { merge: true });
        }
        
        setShiftTypes(loadedShiftTypes);
        setIsLoaded(true);
      } else {
        // Migration of global settings to Firestore
        try {
          let localCategories = DEFAULT_CATEGORIES;
          const storedCategories = localStorage.getItem(STORAGE_KEY_CATEGORIES);
          if (storedCategories) localCategories = JSON.parse(storedCategories);

          let localShiftTypes = DEFAULT_SHIFT_TYPES;
          const storedShiftTypes = localStorage.getItem(STORAGE_KEY_SHIFTTYPES);
          if (storedShiftTypes) {
            localShiftTypes = JSON.parse(storedShiftTypes);
            if (localShiftTypes.length === 3 && !localShiftTypes.some((s: any) => s.id === "late")) {
              localShiftTypes = DEFAULT_SHIFT_TYPES;
            }
          }

          // We use merge: true so we don't overwrite daily data if it happens to exist
          await setDoc(docRef, {
            categories: localCategories,
            shiftTypes: localShiftTypes,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          setCategories(localCategories);
          setShiftTypes(localShiftTypes);
          setIsLoaded(true);
        } catch (error) {
          console.error("Migration failed:", error);
          setIsLoaded(true);
        }
      }
    }, (error) => {
      console.error("Firestore error in useGlobalSettings:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);

  const saveSettings = async (c: Category[], s: ShiftType[]) => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(c));
    localStorage.setItem(STORAGE_KEY_SHIFTTYPES, JSON.stringify(s));

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          categories: c,
          shiftTypes: s,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Failed to save global settings to Firestore", error);
      }
    }
  };

  const addCategory = (category: Omit<Category, "id">) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    saveSettings(newCategories, shiftTypes);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const newCategories = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    setCategories(newCategories);
    saveSettings(newCategories, shiftTypes);
  };

  const removeCategory = (id: string) => {
    const newCategories = categories.filter(c => c.id !== id);
    setCategories(newCategories);
    saveSettings(newCategories, shiftTypes);
  };

  const reorderCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    saveSettings(newCategories, shiftTypes);
  };

  const addShiftType = (shiftType: Omit<ShiftType, "id">) => {
    const newShiftType = { ...shiftType, id: crypto.randomUUID() };
    const newShiftTypes = [...shiftTypes, newShiftType];
    setShiftTypes(newShiftTypes);
    saveSettings(categories, newShiftTypes);
  };

  const updateShiftType = (id: string, updates: Partial<ShiftType>) => {
    const newShiftTypes = shiftTypes.map(s => s.id === id ? { ...s, ...updates } : s);
    setShiftTypes(newShiftTypes);
    saveSettings(categories, newShiftTypes);
  };

  const removeShiftType = (id: string) => {
    const newShiftTypes = shiftTypes.filter(s => s.id !== id);
    setShiftTypes(newShiftTypes);
    saveSettings(categories, newShiftTypes);
  };

  return {
    categories,
    shiftTypes,
    isLoaded,
    addCategory,
    updateCategory,
    removeCategory,
    reorderCategories,
    addShiftType,
    updateShiftType,
    removeShiftType,
  };
}
