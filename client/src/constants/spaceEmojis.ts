// ARC-aligned space emoji palette
// -------------------------------------------------------------
// Every list is exactly length-10, enabling a direct mapping of
// emoji index → ARC colour digit (0-9).  This avoids null cells
// in our grids: colour-0 (black) is explicitly the first emoji.
// -------------------------------------------------------------
export const SPACE_EMOJIS = {
  // Status - Main Set
  status_main: ['⬛', '🟡', '🔴', '🟠', '🔵', '🟣', '⚪', '🟢', '🟤', '🚫'],

  // Celestial Bodies - Set 1
  celestial_set1: ['⬛', '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒'],

  // Celestial Bodies - Set 2  
  celestial_set2: ['⬛', '🌓', '🌔', '☀️', '⭐', '🌟', '✨', '💫', '🌠', '🪐'],

  // Technology & Equipment - Set 1
  tech_set1: ['⬛', '🛩️', '📡', '🔭', '⚡', '🔋', '💻', '📱', '🖥️', '⌨️'],

  // Technology & Equipment - Set 2
  tech_set2: ['⬛', '🖱️', '📺', '📻', '🎛️', '⚙️', '🔧', '🔨', '🛠️', '⚛️'],

  // Navigation & Alerts
  nav_alerts: ['⬛', '⬆️', '⬇️', '⬅️', '➡️', '↗️', '↖️', '↘️', '↙️', '🧭'],

  // Status & Alerts
  status_alerts: ['⬛', '✅', '❌', '⚠️', '🚨', '🦺', '🔥', '❄️', '📍', '🎯'],

  // Weather & Climate
  weather_climate: ['⬛', '🌞', '🌝', '🌛', '🌜', '🌧️', '⛈️', '🌩️', '🌨️', '❄️']
} as const;

export type EmojiSet = keyof typeof SPACE_EMOJIS;
export type SpaceEmoji = typeof SPACE_EMOJIS[EmojiSet][number];
