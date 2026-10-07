export const INK = '#2C3E5C';

export const PALETTES = [
  { k: 'abudhabi', en: 'Abu Dhabi', c: ['#038C84', '#326A82', '#80935A', '#2C3E5C'] },
  { k: 'sharjah', en: 'Sharjah', c: ['#C8685A', '#AB4C25', '#D78452', '#A86744'] },
  { k: 'dubai', en: 'Dubai', c: ['#326A82', '#5E93C4', '#2C3E5C', '#BDAABF'] },
  { k: 'heritage', en: 'Heritage', c: ['#2C3E5C', '#A86744', '#C9A23E', '#80935A'] },
];

export const ORDER = ['falcon', 'map', 'palm', 'tree'];

export const FF = {
  ar: "'Aref Ruqaa', 'Noto Naskh Arabic', serif",
  en: "'Caveat', cursive",
  num: "'Oswald', sans-serif",
};

// Sample family used for the design thumbnails before anyone has signed
export const DEMO_MEMBERS = [
  { kind: 'text', name: 'أحمد', script: 'ar' },
  { kind: 'text', name: 'Mariam', script: 'en' },
  { kind: 'text', name: 'سارة', script: 'ar' },
  { kind: 'text', name: 'Khalid', script: 'en' },
];

// Default pads shown on the signing screen, and the ink colour per pad
export const ROLES = ['Baba · بابا', 'Mama · ماما', 'Daughter · الابنة', 'Son · الابن'];
export const INKS = ['#2C3E5C', '#C8685A', '#038C84', '#A86744', '#326A82', '#80935A', '#AB4C25', '#5E93C4'];
export const MAX_MEMBERS = 8;

// Return to the welcome screen after this long without a touch
export const IDLE_MS = 120000;
