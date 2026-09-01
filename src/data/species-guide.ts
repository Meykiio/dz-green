/**
 * Curated planting guide for Algeria (2026-09-01): climate classes per wilaya
 * (hand-curated from Algeria's standard climate geography — coastal/Tell
 * humid north, semi-arid high plateaus, arid Sahara) and a species×climate
 * matrix of defensible, well-known fits. Evidence from GBIF (wilaya-species.ts)
 * boosts species that are recorded growing in the wilaya. Suggestions only —
 * local advice always wins.
 */

export type ClimateClass = "mediterranean" | "semi-arid" | "arid";

export const WILAYA_CLIMATE: Record<string, ClimateClass> = {
  "01": "arid", "02": "mediterranean", "03": "semi-arid", "04": "semi-arid",
  "05": "semi-arid", "06": "mediterranean", "07": "semi-arid", "08": "arid",
  "09": "mediterranean", "10": "mediterranean", "11": "arid", "12": "semi-arid",
  "13": "semi-arid", "14": "semi-arid", "15": "mediterranean", "16": "mediterranean",
  "17": "semi-arid", "18": "mediterranean", "19": "semi-arid", "20": "semi-arid",
  "21": "mediterranean", "22": "semi-arid", "23": "mediterranean", "24": "mediterranean",
  "25": "mediterranean", "26": "mediterranean", "27": "mediterranean", "28": "semi-arid",
  "29": "semi-arid", "30": "arid", "31": "mediterranean", "32": "semi-arid",
  "33": "arid", "34": "semi-arid", "35": "mediterranean", "36": "mediterranean",
  "37": "arid", "38": "semi-arid", "39": "arid", "40": "semi-arid",
  "41": "mediterranean", "42": "mediterranean", "43": "mediterranean", "44": "mediterranean",
  "45": "semi-arid", "46": "mediterranean", "47": "semi-arid", "48": "semi-arid",
  "49": "arid", "50": "arid", "51": "semi-arid", "52": "arid",
  "53": "arid", "54": "arid", "55": "arid", "56": "arid",
  "57": "arid", "58": "arid", "59": "semi-arid", "60": "semi-arid",
  "61": "semi-arid", "62": "semi-arid", "63": "semi-arid", "64": "semi-arid",
  "65": "semi-arid", "66": "semi-arid", "67": "semi-arid", "68": "semi-arid",
  "69": "semi-arid",
};

export interface GuideSpecies {
  latin: string;
  ar: string;
  en: string;
  fits: ClimateClass[];
  noteAr: string;
  noteEn: string;
  cautionAr?: string;
  cautionEn?: string;
}

export const SPECIES_GUIDE: GuideSpecies[] = [
  { latin: "Pinus halepensis", ar: "صنوبر حلبي", en: "Aleppo pine", fits: ["mediterranean", "semi-arid"], noteAr: "صنوبر التشجير الأول في الجزائر — يتحمل الجفاف", noteEn: "Algeria's main reforestation pine — drought-tolerant" },
  { latin: "Pinus pinaster", ar: "صنوبر بحري", en: "Maritime pine", fits: ["mediterranean"], noteAr: "خشب سريع النمو — يحتاج الشمال الرطب", noteEn: "Fast timber — needs the humid north" },
  { latin: "Cedrus atlantica", ar: "أرز أطلسي", en: "Atlas cedar", fits: ["mediterranean"], noteAr: "للجبال العالية فقط — الأطلس والأوراس", noteEn: "High mountains only — Atlas and Aurès ranges" },
  { latin: "Quercus suber", ar: "بلوط فليني", en: "Cork oak", fits: ["mediterranean"], noteAr: "شجرة القبيلة والشراقة — لحاء الفلين", noteEn: "Kabylie and the far north-east — cork bark" },
  { latin: "Quercus ilex", ar: "بلوط كبير", en: "Holm oak", fits: ["mediterranean", "semi-arid"], noteAr: "بلوط صلب دائم الخضرة", noteEn: "Hardy evergreen oak" },
  { latin: "Olea europaea", ar: "زيتون", en: "Olive", fits: ["mediterranean", "semi-arid"], noteAr: "أيقونة الجزائر — مقاوم للجفاف ومثمر", noteEn: "Algeria's icon — drought-hardy and productive" },
  { latin: "Ceratonia siliqua", ar: "خروب", en: "Carob", fits: ["mediterranean"], noteAr: "مقاوم جدًا للجفاف — تلال الساحل", noteEn: "Very drought-tolerant — coastal hills" },
  { latin: "Ficus carica", ar: "تين", en: "Fig", fits: ["mediterranean", "semi-arid"], noteAr: "فاكهة قليلة الماء وشديدة التحمل", noteEn: "Water-frugal, very hardy fruit tree" },
  { latin: "Prunus dulcis", ar: "لوز", en: "Almond", fits: ["mediterranean", "semi-arid"], noteAr: "يزهر مبكرًا — يناسب الهضاب", noteEn: "Early blossom — suits the high plateaus" },
  { latin: "Pistacia lentiscus", ar: "مصطكى", en: "Mastic", fits: ["mediterranean", "semi-arid"], noteAr: "شجيرة محلية شديدة التحمل", noteEn: "Native, extremely hardy shrub" },
  { latin: "Pistacia vera", ar: "فستق", en: "Pistachio", fits: ["semi-arid", "arid"], noteAr: "قيمة عالية للهضاب الجافة", noteEn: "High-value crop for dry plateaus", cautionAr: "يحتاج سقيًا تكميليًا في المناطق الجافة", cautionEn: "Needs irrigation in dry zones" },
  { latin: "Phoenix dactylifera", ar: "نخلة", en: "Date palm", fits: ["arid"], noteAr: "سيّدة الواحات الصحراوية", noteEn: "The Saharan oasis staple", cautionAr: "تحتاج مياهًا جوفية — للواحات فقط", cautionEn: "Needs groundwater — oases only" },
  { latin: "Argania spinosa", ar: "أركان", en: "Argan", fits: ["semi-arid"], noteAr: "كنز مستوطن للسغاية الجنوبية الغربية", noteEn: "Endemic treasure of the south-western steppe" },
  { latin: "Ziziphus lotus", ar: "سدر", en: "Christ's thorn jujube", fits: ["semi-arid", "arid"], noteAr: "محلي — من أشد الأشجار تحملًا للجفاف", noteEn: "Native — among the most drought-hardy trees" },
  { latin: "Tamarix aphylla", ar: "أثل", en: "Tamarisk", fits: ["semi-arid", "arid"], noteAr: "مصد رياح يتحمل الملوحة والجفاف", noteEn: "Salt- and drought-tolerant windbreak" },
  { latin: "Vachellia tortilis", ar: "سنط مظلي", en: "Umbrella thorn acacia", fits: ["arid"], noteAr: "شجرة الصحراء العميقة الجذور", noteEn: "Deep-rooted desert tree" },
  { latin: "Eucalyptus globulus", ar: "كالبتوس", en: "Eucalyptus", fits: ["mediterranean"], noteAr: "سريع النمو جدًا", noteEn: "Very fast growing", cautionAr: "شره للماء — لا تغرسه قرب مصادر المياه", cautionEn: "Water-hungry — keep away from water sources" },
  { latin: "Cupressus sempervirens", ar: "سرو", en: "Italian cypress", fits: ["mediterranean", "semi-arid"], noteAr: "مصد رياح قليل الماء", noteEn: "Low-water windbreak" },
  { latin: "Juniperus phoenicea", ar: "عرعر فينيقي", en: "Phoenician juniper", fits: ["semi-arid", "arid"], noteAr: "صنوبرية محلية لجبال الأطلس والأوراس", noteEn: "Native conifer of the Atlas and Aurès mountains" },
];
