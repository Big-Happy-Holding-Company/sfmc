// ARC-aligned space emoji palette
// -------------------------------------------------------------
// Every list is exactly length-10, enabling a direct mapping of
// emoji index → ARC colour digit (0-9).  This avoids null cells
// in our grids: colour-0 (black or 'empty') is explicitly the first emoji, represented by '⬛'.
// 
// Official ARC Color Mapping (RGB values):
// 0: (0, 0, 0)        - Black (background)
// 1: (0, 116, 217)    - Blue  
// 2: (255, 65, 54)    - Red
// 3: (46, 204, 64)    - Green
// 4: (255, 220, 0)    - Yellow
// 5: (128, 128, 128)  - Grey
// 6: (240, 18, 190)   - Magenta/Pink
// 7: (255, 133, 27)   - Orange
// 8: (127, 219, 255)  - Light Blue/Cyan
// 9: (128, 0, 0)      - Maroon
// -------------------------------------------------------------
export const SPACE_EMOJIS = {

  // Celestial Bodies - Set 1 (Earth and celestial bodies)
  celestial_set1: ['⬛', '🌍', '🌎', '🌏', '⭐', '🌟', '✨', '💫', '🌠', '🪐'],

  // Celestial Bodies - Set 2 (Moon phases)
  celestial_set2: ['⬛', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '☀️', ],

  // Technology & Equipment - Set 1 (power and fuel)
  tech_set1: ['⬛', '⚡', '🔋', '🔌', '⛽', '☢️', '⚛️', '🔗', '⚙️', '🔧'],

  // Technology & Equipment - Set 2 (communication)
  tech_set2: ['⬛', '📡', '🛰️', '📱', '⌨️', '📶', '📋', '💻', '🎚️', '🎧'],

  // Navigation & Alerts (directional and compass) - Avoid using!!
  nav_alerts: ['⬛', '⬆️', '⬇️', '⬅️', '➡️', '↗️', '↖️', '↘️', '↙️', '🧭'],

  // Status & Alerts (warning and safety systems)
  status_alerts: ['⬛', '✅', '❌', '⚠️', '🚨', '🦺', '🔥', '❄️', '📍', '🎯'],

  // Weather & Climate (atmospheric conditions)
  weather_climate: ['⬛', '🌞', '🌝', '🌛', '🌜', '🌧️', '⛈️', '🌩️', '🌨️', '❄️'],

  // Status - Human Crew and Coworkers
  status_emojis: ['⬛', '😂', '😶', '😐', '🙄', '😴', '😵', '🤗', '🤔', '😣'],

  // Status - AI and Computer Systems
  ai_emojis: ['⬛', '🤖', '💡', '🧠', '🔗', '⚙️', '🔧', '🔄', '⚡', '🚫'],

  // Vague Symbols - For the hardest tasks
  vague_symbols: ['⬛', '♊', '💕', '💢', '🆎', '🆒', '🈚', '🛃', '💠', '☣'],

  // Alien Language - For the hardest tasks
  alien_language: ['⬛', '👽', '👤', '🪐', '🌍', '🛸', '☄️', '♥️', '⚠️', '🛰'],
} as const;

// Emoji set metadata for UI display
export const EMOJI_SET_INFO = {
  celestial_set1: {
    name: 'Planetary Bodies',
    description: 'Earth variants and lunar phases',
    theme: 'Celestial Navigation'
  },
  celestial_set2: {
    name: 'Stellar Objects',
    description: 'Stars, cosmic phenomena, and distant planets',
    theme: 'Deep Space'
  },
  tech_set1: {
    name: 'Power & Fuel Systems',
    description: 'Power & Fuel systems',
    theme: 'Power & Fuel'
  },
  tech_set2: {
    name: 'Communication Systems',
    description: 'Communication arrays and signal relays',
    theme: 'Communication'
  },
  nav_alerts: {
    name: 'Navigation Vectors',
    description: 'Directional indicators and compass systems',
    theme: 'Navigation'
  },
  status_alerts: {
    name: 'Alert Systems',
    description: 'Warnings, confirmations, and safety indicators',
    theme: 'Mission Safety'
  },
  weather_climate: {
    name: 'Atmospheric Data',
    description: 'Weather patterns and climate conditions',
    theme: 'Environmental'
  },
  status_emojis: {
    name: 'Human Crew and Coworkers',
    description: 'Human crew and coworkers',
    theme: 'Mission Safety'
  },
  ai_emojis: {
    name: 'AI and Computer Systems',
    description: 'AI and computer systems',
    theme: 'Mission Safety'
  },
  vague_symbols: {
    name: 'Vague Symbols',
    description: 'Vague symbols',
    theme: 'Officer Candidate'
  },
  alien_language: {
    name: 'Alien Language',
    description: 'Alien language',
    theme: 'Officer Candidate'
  }
} as const;

export type EmojiSet = keyof typeof SPACE_EMOJIS;
export type SpaceEmoji = typeof SPACE_EMOJIS[EmojiSet][number];

// Official ARC Color Constants (for when users switch to color display mode)
export const ARC_COLORS = {
  0: [0, 0, 0],        // Black (background)
  1: [0, 116, 217],    // Blue
  2: [255, 65, 54],    // Red
  3: [46, 204, 64],    // Green
  4: [255, 220, 0],    // Yellow
  5: [128, 128, 128],  // Grey
  6: [240, 18, 190],   // Magenta/Pink
  7: [255, 133, 27],   // Orange
  8: [127, 219, 255],  // Light Blue/Cyan
  9: [128, 0, 0],      // Maroon
} as const;

// Helper function to convert ARC color index to CSS RGB string
export const getARCColorCSS = (colorIndex: number): string => {
  const color = ARC_COLORS[colorIndex as keyof typeof ARC_COLORS];
  if (!color) return 'rgb(0, 0, 0)'; // Default to black
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
};

// Helper function to get ARC color as hex string
export const getARCColorHex = (colorIndex: number): string => {
  const color = ARC_COLORS[colorIndex as keyof typeof ARC_COLORS];
  if (!color) return '#000000'; // Default to black
  const [r, g, b] = color;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
