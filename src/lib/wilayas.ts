// All 69 Algerian wilayas (48 historic + 10 from 2019 + 11 from the 2025
// division, Law 26-06 / JO No. 25). Every wilaya has its own polygon in
// data/algeria-wilayas.ts, so mapCode is the identity mapping (kept for
// interface compatibility with pre-69 code paths).
import { getLocale } from "@/i18n/locale";
export interface Wilaya {
  code: string;
  name: string;
  nameAr: string;
  /** Kept for compatibility; equals code everywhere since the 69-polygon map. */
  mapCode: string;
}

export const WILAYAS: Wilaya[] = [
  { code: "01", name: "Adrar", nameAr: "أدرار", mapCode: "01" },
  { code: "02", name: "Chlef", nameAr: "الشلف", mapCode: "02" },
  { code: "03", name: "Laghouat", nameAr: "الأغواط", mapCode: "03" },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", mapCode: "04" },
  { code: "05", name: "Batna", nameAr: "باتنة", mapCode: "05" },
  { code: "06", name: "Bejaia", nameAr: "بجاية", mapCode: "06" },
  { code: "07", name: "Biskra", nameAr: "بسكرة", mapCode: "07" },
  { code: "08", name: "Bechar", nameAr: "بشار", mapCode: "08" },
  { code: "09", name: "Blida", nameAr: "البليدة", mapCode: "09" },
  { code: "10", name: "Bouira", nameAr: "البويرة", mapCode: "10" },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست", mapCode: "11" },
  { code: "12", name: "Tebessa", nameAr: "تبسة", mapCode: "12" },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان", mapCode: "13" },
  { code: "14", name: "Tiaret", nameAr: "تيارت", mapCode: "14" },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", mapCode: "15" },
  { code: "16", name: "Alger", nameAr: "الجزائر", mapCode: "16" },
  { code: "17", name: "Djelfa", nameAr: "الجلفة", mapCode: "17" },
  { code: "18", name: "Jijel", nameAr: "جيجل", mapCode: "18" },
  { code: "19", name: "Setif", nameAr: "سطيف", mapCode: "19" },
  { code: "20", name: "Saida", nameAr: "سعيدة", mapCode: "20" },
  { code: "21", name: "Skikda", nameAr: "سكيكدة", mapCode: "21" },
  { code: "22", name: "Sidi Bel Abbes", nameAr: "سيدي بلعباس", mapCode: "22" },
  { code: "23", name: "Annaba", nameAr: "عنابة", mapCode: "23" },
  { code: "24", name: "Guelma", nameAr: "قالمة", mapCode: "24" },
  { code: "25", name: "Constantine", nameAr: "قسنطينة", mapCode: "25" },
  { code: "26", name: "Medea", nameAr: "المدية", mapCode: "26" },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم", mapCode: "27" },
  { code: "28", name: "M'Sila", nameAr: "المسيلة", mapCode: "28" },
  { code: "29", name: "Mascara", nameAr: "معسكر", mapCode: "29" },
  { code: "30", name: "Ouargla", nameAr: "ورقلة", mapCode: "30" },
  { code: "31", name: "Oran", nameAr: "وهران", mapCode: "31" },
  { code: "32", name: "El Bayadh", nameAr: "البيض", mapCode: "32" },
  { code: "33", name: "Illizi", nameAr: "إليزي", mapCode: "33" },
  { code: "34", name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج", mapCode: "34" },
  { code: "35", name: "Boumerdes", nameAr: "بومرداس", mapCode: "35" },
  { code: "36", name: "El Tarf", nameAr: "الطارف", mapCode: "36" },
  { code: "37", name: "Tindouf", nameAr: "تندوف", mapCode: "37" },
  { code: "38", name: "Tissemsilt", nameAr: "تسمسيلت", mapCode: "38" },
  { code: "39", name: "El Oued", nameAr: "الوادي", mapCode: "39" },
  { code: "40", name: "Khenchela", nameAr: "خنشلة", mapCode: "40" },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", mapCode: "41" },
  { code: "42", name: "Tipaza", nameAr: "تيبازة", mapCode: "42" },
  { code: "43", name: "Mila", nameAr: "ميلة", mapCode: "43" },
  { code: "44", name: "Ain Defla", nameAr: "عين الدفلى", mapCode: "44" },
  { code: "45", name: "Naama", nameAr: "النعامة", mapCode: "45" },
  { code: "46", name: "Ain Temouchent", nameAr: "عين تموشنت", mapCode: "46" },
  { code: "47", name: "Ghardaia", nameAr: "غرداية", mapCode: "47" },
  { code: "48", name: "Relizane", nameAr: "غليزان", mapCode: "48" },
  { code: "49", name: "Timimoun", nameAr: "تيميمون", mapCode: "49" },
  { code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", mapCode: "50" },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", mapCode: "51" },
  { code: "52", name: "Beni Abbes", nameAr: "بني عباس", mapCode: "52" },
  { code: "53", name: "In Salah", nameAr: "عين صالح", mapCode: "53" },
  { code: "54", name: "In Guezzam", nameAr: "عين قزام", mapCode: "54" },
  { code: "55", name: "Touggourt", nameAr: "تقرت", mapCode: "55" },
  { code: "56", name: "Djanet", nameAr: "جانت", mapCode: "56" },
  { code: "57", name: "El M'Ghair", nameAr: "المغير", mapCode: "57" },
  { code: "58", name: "El Meniaa", nameAr: "المنيعة", mapCode: "58" },
  { code: "59", name: "Aflou", nameAr: "أفلو", mapCode: "59" },
  { code: "60", name: "Barika", nameAr: "بريكة", mapCode: "60" },
  { code: "61", name: "El Kantara", nameAr: "القنطرة", mapCode: "61" },
  { code: "62", name: "Bir El Ater", nameAr: "بئر العاتر", mapCode: "62" },
  { code: "63", name: "El Aricha", nameAr: "العريشة", mapCode: "63" },
  { code: "64", name: "Ksar Chellala", nameAr: "قصر الشلالة", mapCode: "64" },
  { code: "65", name: "Ain Oussara", nameAr: "عين وسارة", mapCode: "65" },
  { code: "66", name: "Messaad", nameAr: "مسعد", mapCode: "66" },
  { code: "67", name: "Ksar El Boukhari", nameAr: "قصر البخاري", mapCode: "67" },
  { code: "68", name: "Bou Saada", nameAr: "بوسعادة", mapCode: "68" },
  { code: "69", name: "El Abiodh Sidi Cheikh", nameAr: "الأبيض سيدي الشيخ", mapCode: "69" },
];

export const WILAYA_BY_CODE: Record<string, Wilaya> = Object.fromEntries(
  WILAYAS.map((w) => [w.code, w]),
);

/** Display name for the current UI language (Arabic names in AR mode). */
export function wilayaName(code: string | null | undefined): string {
  if (!code) return getLocale() === "ar" ? "غير معروف" : "Unknown";
  const w = WILAYA_BY_CODE[code];
  if (!w) return code;
  return getLocale() === "ar" ? w.nameAr : w.name;
}

/** Identity since the 69-polygon map (2026-09-01); null for empty/unknown. */
export function mapCodeFor(code: string | null | undefined): string | null {
  if (!code) return null;
  return WILAYA_BY_CODE[code]?.mapCode ?? null;
}
