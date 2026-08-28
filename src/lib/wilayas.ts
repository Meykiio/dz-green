// All 58 Algerian wilayas (48 historic + 10 created in 2019).
// Map geometry only covers the 48 historic polygons; the newer wilayas are
// listed here so people can still label a submission accurately.
import { getLocale } from "@/i18n/locale";
export interface Wilaya {
  code: string;
  name: string;
  nameAr: string;
  /** Wilaya whose polygon contains this territory, for map placement. */
  mapCode: string;
}

export const WILAYAS: Wilaya[] = [
  { code: "01", name: "Adrar", nameAr: "أدرار", mapCode: "01" },
  { code: "02", name: "Chlef", nameAr: "الشلف", mapCode: "02" },
  { code: "03", name: "Laghouat", nameAr: "الأغواط", mapCode: "03" },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", mapCode: "04" },
  { code: "05", name: "Batna", nameAr: "باتنة", mapCode: "05" },
  { code: "06", name: "Béjaïa", nameAr: "بجاية", mapCode: "06" },
  { code: "07", name: "Biskra", nameAr: "بسكرة", mapCode: "07" },
  { code: "08", name: "Béchar", nameAr: "بشار", mapCode: "08" },
  { code: "09", name: "Blida", nameAr: "البليدة", mapCode: "09" },
  { code: "10", name: "Bouira", nameAr: "البويرة", mapCode: "10" },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست", mapCode: "11" },
  { code: "12", name: "Tébessa", nameAr: "تبسة", mapCode: "12" },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان", mapCode: "13" },
  { code: "14", name: "Tiaret", nameAr: "تيارت", mapCode: "14" },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", mapCode: "15" },
  { code: "16", name: "Alger", nameAr: "الجزائر", mapCode: "16" },
  { code: "17", name: "Djelfa", nameAr: "الجلفة", mapCode: "17" },
  { code: "18", name: "Jijel", nameAr: "جيجل", mapCode: "18" },
  { code: "19", name: "Sétif", nameAr: "سطيف", mapCode: "19" },
  { code: "20", name: "Saïda", nameAr: "سعيدة", mapCode: "20" },
  { code: "21", name: "Skikda", nameAr: "سكيكدة", mapCode: "21" },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", mapCode: "22" },
  { code: "23", name: "Annaba", nameAr: "عنابة", mapCode: "23" },
  { code: "24", name: "Guelma", nameAr: "قالمة", mapCode: "24" },
  { code: "25", name: "Constantine", nameAr: "قسنطينة", mapCode: "25" },
  { code: "26", name: "Médéa", nameAr: "المدية", mapCode: "26" },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم", mapCode: "27" },
  { code: "28", name: "M'Sila", nameAr: "المسيلة", mapCode: "28" },
  { code: "29", name: "Mascara", nameAr: "معسكر", mapCode: "29" },
  { code: "30", name: "Ouargla", nameAr: "ورقلة", mapCode: "30" },
  { code: "31", name: "Oran", nameAr: "وهران", mapCode: "31" },
  { code: "32", name: "El Bayadh", nameAr: "البيض", mapCode: "32" },
  { code: "33", name: "Illizi", nameAr: "إليزي", mapCode: "33" },
  { code: "34", name: "Bordj Bou Arréridj", nameAr: "برج بوعريريج", mapCode: "34" },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس", mapCode: "35" },
  { code: "36", name: "El Tarf", nameAr: "الطارف", mapCode: "36" },
  { code: "37", name: "Tindouf", nameAr: "تندوف", mapCode: "37" },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت", mapCode: "38" },
  { code: "39", name: "El Oued", nameAr: "الوادي", mapCode: "39" },
  { code: "40", name: "Khenchela", nameAr: "خنشلة", mapCode: "40" },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", mapCode: "41" },
  { code: "42", name: "Tipaza", nameAr: "تيبازة", mapCode: "42" },
  { code: "43", name: "Mila", nameAr: "ميلة", mapCode: "43" },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى", mapCode: "44" },
  { code: "45", name: "Naâma", nameAr: "النعامة", mapCode: "45" },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت", mapCode: "46" },
  { code: "47", name: "Ghardaïa", nameAr: "غرداية", mapCode: "47" },
  { code: "48", name: "Relizane", nameAr: "غليزان", mapCode: "48" },
  { code: "49", name: "Timimoun", nameAr: "تيميمون", mapCode: "01" },
  { code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", mapCode: "01" },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", mapCode: "07" },
  { code: "52", name: "Béni Abbès", nameAr: "بني عباس", mapCode: "08" },
  { code: "53", name: "In Salah", nameAr: "عين صالح", mapCode: "11" },
  { code: "54", name: "In Guezzam", nameAr: "عين قزام", mapCode: "11" },
  { code: "55", name: "Touggourt", nameAr: "تقرت", mapCode: "30" },
  { code: "56", name: "Djanet", nameAr: "جانت", mapCode: "33" },
  { code: "57", name: "El M'Ghair", nameAr: "المغير", mapCode: "39" },
  { code: "58", name: "El Meniaa", nameAr: "المنيعة", mapCode: "47" },
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

export function mapCodeFor(code: string | null | undefined): string | null {
  if (!code) return null;
  return WILAYA_BY_CODE[code]?.mapCode ?? null;
}