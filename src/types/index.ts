export type TimeBlockType = "plan" | "actual";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  categoryId?: string; 
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

export interface ShiftType {
  id: string;
  name: string;
  color: string;
  startHour: number;
  duration: number;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  shiftTypeId: string | null;
  blocks: TimeBlock[];
}

export interface GlobalSettings {
  categories: Category[];
  shiftTypes: ShiftType[];
}

export const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  { id: "day", name: "日勤", color: "bg-orange-100 text-orange-700 border-orange-200", startHour: 9, duration: 12 }, // 9:00 - 21:00 (12h表示)
  { id: "late", name: "遅番", color: "bg-yellow-100 text-yellow-700 border-yellow-200", startHour: 12, duration: 12 }, // 12:00 - 24:00
  { id: "night", name: "夜勤", color: "bg-indigo-100 text-indigo-700 border-indigo-200", startHour: 21, duration: 12 }, // 21:00 - 9:00
  { id: "post-night", name: "明け", color: "bg-teal-100 text-teal-700 border-teal-200", startHour: 9, duration: 24 }, // 9:00 - 9:00
  { id: "off", name: "休", color: "bg-slate-100 text-slate-700 border-slate-200", startHour: 9, duration: 24 }, // 9:00 - 9:00
];

export const DEFAULT_CATEGORIES: Category[] = [
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
