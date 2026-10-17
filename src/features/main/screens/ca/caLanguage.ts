/**
 * Roman Urdu and Urdu support for the Personal CA's own rules (the AI model reads both natively).
 * Urdu-script messages are first turned into the Roman spellings the rules already know, so
 * "کل 800 روپے کا کھانا کھایا" is read like "kal 800 rupay ka khana khaya".
 */

export type CaLanguage = 'en' | 'roman-ur' | 'ur';

// Urdu / Arabic-Indic digits → 0-9.
const DIGITS: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

// Common Urdu-script words in money messages → their usual Roman Urdu spelling.
const WORDS: Record<string, string> = {
  کل: 'kal', آج: 'aaj', پرسوں: 'parson', روپے: 'rupay', روپیہ: 'rupay', روپئے: 'rupay', ہزار: 'hazar', لاکھ: 'lakh',
  کروڑ: 'crore', کا: 'ka', کی: 'ki', کے: 'ke', کو: 'ko', سے: 'se', پر: 'par', میں: 'mein', اور: 'aur',
  خرچ: 'kharch', خرچہ: 'kharcha', خرچے: 'kharche', کیا: 'kiya', کیے: 'kiye', کئے: 'kiye', کرو: 'karo', کریں: 'karo',
  کر: 'kar', دو: 'do', دیا: 'diya', دیے: 'diye', دیئے: 'diye', لیا: 'liya', لیے: 'liye', لی: 'li', کھایا: 'khaya',
  کھانا: 'khana', کھانے: 'khana', چائے: 'chai', ناشتہ: 'nashta', سبزی: 'sabzi', دودھ: 'doodh', راشن: 'rashan',
  پیٹرول: 'petrol', بجلی: 'bijli', گیس: 'gas', پانی: 'pani', بل: 'bill', کرایہ: 'kiraya', تنخواہ: 'tankhwah',
  ملے: 'mile', ملی: 'mili', ملا: 'mila', آئے: 'aaye', آئی: 'aayi', نہیں: 'nahi', مت: 'mat', کتنا: 'kitna',
  کتنی: 'kitni', کتنے: 'kitne', کیسے: 'kaise', بتاؤ: 'batao', میرا: 'mera', میری: 'meri', میرے: 'mere',
  ہے: 'hai', ہیں: 'hain', ہوں: 'hoon', شامل: 'add', درج: 'darj', بجٹ: 'budget', ہدف: 'goal', گول: 'goal',
  بچت: 'savings', ٹیکس: 'tax', زکوٰۃ: 'zakat', زکات: 'zakat', آمدنی: 'aamdani', فائلر: 'filer', بچے: 'bachay',
  مہینے: 'mahine', سال: 'saal', بناؤ: 'banao', بنا: 'bana',
};

/** Urdu digits and common Urdu-script words become ASCII / Roman Urdu; anything else is kept. */
export function normalizeLocal(text: string): string {
  return text
    .replace(/[۰-۹٠-٩]/g, d => DIGITS[d] ?? d)
    .replace(/؟/g, '?')
    .replace(/،/g, ',')
    .replace(/[؀-ۿ]+/g, w => WORDS[w] ?? w);
}

// Words that are common in Roman Urdu and rare in English messages.
const ROMAN_MARKERS = new Set([
  'hai', 'hain', 'hoon', 'hun', 'mein', 'mera', 'meri', 'mere', 'ka', 'ki', 'ke', 'ko', 'kya', 'kitna', 'kitni',
  'kitne', 'karo', 'kar', 'kardo', 'kal', 'aaj', 'nahi', 'nahin', 'se', 'pe', 'par', 'liye', 'diya', 'diye', 'liya',
  'khaya', 'wala', 'wali', 'bhi', 'tha', 'thi', 'aur', 'kaise', 'kese', 'batao', 'rupay', 'rupaye', 'hazar', 'hazaar',
  'tankhwah', 'tankha', 'kharcha', 'kharch', 'kiya', 'kiye', 'mujhe', 'apna', 'apni', 'banao', 'daalo', 'chahiye',
  'sakta', 'sakti', 'hua', 'hue', 'gaya', 'mahine', 'saal', 'bachat', 'paise', 'paisay', 'abhi', 'yeh', 'woh',
]);

/** The language a message is written in: Urdu script, Roman Urdu (2+ Urdu words), else English. */
export function detectLanguage(text: string): CaLanguage {
  if (/[؀-ۿ]/.test(text)) return 'ur';
  const words = new Set(text.toLowerCase().match(/[a-z]+/g) ?? []);
  let hits = 0;
  for (const w of words) if (ROMAN_MARKERS.has(w)) hits++;
  return hits >= 2 ? 'roman-ur' : 'en';
}
