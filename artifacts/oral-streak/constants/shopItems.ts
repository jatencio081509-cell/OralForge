export type ShopCategory =
  | "themes"
  | "motivational"
  | "badge_frames"
  | "timer_styles"
  | "toothbrushes"
  | "streak_effects";

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export const SHOP_CATEGORIES: Array<{ id: ShopCategory; label: string; icon: string }> = [
  { id: "themes", label: "Themes", icon: "color-palette-outline" },
  { id: "motivational", label: "Messages", icon: "chatbubble-outline" },
  { id: "badge_frames", label: "Frames", icon: "ribbon-outline" },
  { id: "timer_styles", label: "Timer", icon: "timer-outline" },
  { id: "toothbrushes", label: "Brushes", icon: "water-outline" },
  { id: "streak_effects", label: "Effects", icon: "flame-outline" },
];

export const ALL_SHOP_ITEMS: ShopItem[] = [
  // Themes
  {
    id: "theme_midnight",
    category: "themes",
    name: "Midnight Blue",
    description: "Deep navy and indigo tones for night owls.",
    cost: 100,
    icon: "moon",
    color: "#3b5bdb",
  },
  {
    id: "theme_sunrise",
    category: "themes",
    name: "Warm Sunrise",
    description: "Soft orange and amber warm the whole app.",
    cost: 150,
    icon: "sunny",
    color: "#f76707",
  },
  {
    id: "theme_forest",
    category: "themes",
    name: "Forest",
    description: "Calm greens inspired by nature.",
    cost: 150,
    icon: "leaf",
    color: "#2f9e44",
  },
  {
    id: "theme_ocean",
    category: "themes",
    name: "Ocean Breeze",
    description: "Soft teals and ocean blues.",
    cost: 150,
    icon: "water",
    color: "#1098ad",
  },
  {
    id: "theme_neon",
    category: "themes",
    name: "Neon Clean",
    description: "Vibrant electric accents on dark.",
    cost: 200,
    icon: "flash",
    color: "#7950f2",
  },
  {
    id: "theme_dark_pro",
    category: "themes",
    name: "Dark Mode Pro",
    description: "Premium near-black OLED-friendly theme.",
    cost: 200,
    icon: "contrast",
    color: "#212529",
  },

  // Motivational Packs
  {
    id: "msg_discipline",
    category: "motivational",
    name: "Discipline Pack",
    description: '"Consistency beats motivation." No-fluff messages.',
    cost: 75,
    icon: "barbell",
    color: "#495057",
  },
  {
    id: "msg_coach",
    category: "motivational",
    name: "Coach Pack",
    description: '"You showed up again." Encouraging athletic energy.',
    cost: 75,
    icon: "trophy",
    color: "#f59f00",
  },
  {
    id: "msg_clinical",
    category: "motivational",
    name: "Clinical Pack",
    description: '"Daily plaque removal completed." Clean and medical.',
    cost: 75,
    icon: "medical",
    color: "#0ea5e9",
  },
  {
    id: "msg_funny",
    category: "motivational",
    name: "Funny Pack",
    description: '"Your dentist would be proud." Light humor.',
    cost: 75,
    icon: "happy",
    color: "#f76707",
  },

  // Badge Frames
  {
    id: "frame_bronze",
    category: "badge_frames",
    name: "Bronze Frame",
    description: "Classic bronze border around your streak card.",
    cost: 80,
    icon: "medal",
    color: "#cd7f32",
  },
  {
    id: "frame_silver",
    category: "badge_frames",
    name: "Silver Frame",
    description: "Polished silver border — earned, not given.",
    cost: 120,
    icon: "medal",
    color: "#868e96",
  },
  {
    id: "frame_gold",
    category: "badge_frames",
    name: "Gold Frame",
    description: "Premium gold border for the dedicated.",
    cost: 200,
    icon: "medal",
    color: "#f59f00",
  },
  {
    id: "frame_diamond",
    category: "badge_frames",
    name: "Diamond Frame",
    description: "The rarest frame. Show your discipline.",
    cost: 300,
    icon: "diamond",
    color: "#74c0fc",
  },
  {
    id: "frame_flame",
    category: "badge_frames",
    name: "Flame Frame",
    description: "For those on fire with consistency.",
    cost: 180,
    icon: "flame",
    color: "#f03e3e",
  },

  // Timer Visual Styles
  {
    id: "timer_radar",
    category: "timer_styles",
    name: "Radar Pulse",
    description: "Rippling radar rings pulse with each second.",
    cost: 120,
    icon: "radio-outline",
    color: "#00b896",
  },
  {
    id: "timer_liquid",
    category: "timer_styles",
    name: "Liquid Fill",
    description: "Timer fills like water rising in a tube.",
    cost: 150,
    icon: "beaker-outline",
    color: "#1098ad",
  },
  {
    id: "timer_segmented",
    category: "timer_styles",
    name: "Segmented Ring",
    description: "Discrete arc segments tick off each second.",
    cost: 100,
    icon: "pie-chart-outline",
    color: "#7950f2",
  },

  // Toothbrush Collection
  {
    id: "brush_sonic",
    category: "toothbrushes",
    name: "Sonic Blue",
    description: "A sleek electric-blue sonic brush.",
    cost: 60,
    icon: "water",
    color: "#3b9eff",
  },
  {
    id: "brush_gold",
    category: "toothbrushes",
    name: "Gold Edition",
    description: "Premium gold brush for the dedicated.",
    cost: 150,
    icon: "star",
    color: "#f59f00",
  },
  {
    id: "brush_carbon",
    category: "toothbrushes",
    name: "Carbon Black",
    description: "Matte black carbon fibre aesthetic.",
    cost: 100,
    icon: "shield",
    color: "#343a40",
  },
  {
    id: "brush_crystal",
    category: "toothbrushes",
    name: "Crystal Brush",
    description: "Translucent crystal handle with mint accents.",
    cost: 200,
    icon: "diamond",
    color: "#74c0fc",
  },

  // Streak Effects
  {
    id: "effect_electric",
    category: "streak_effects",
    name: "Electric Sparks",
    description: "Subtle electric sparks around your streak number.",
    cost: 80,
    icon: "flash",
    color: "#f59f00",
  },
  {
    id: "effect_icy",
    category: "streak_effects",
    name: "Icy Aura",
    description: "A cool frost effect framing your streak.",
    cost: 100,
    icon: "snow",
    color: "#74c0fc",
  },
  {
    id: "effect_pulse",
    category: "streak_effects",
    name: "Pulsing Light",
    description: "Gentle mint pulse rings your streak card.",
    cost: 80,
    icon: "radio",
    color: "#00b896",
  },
  {
    id: "effect_fire",
    category: "streak_effects",
    name: "Fire Glow",
    description: "Warm ember glow for streaks on fire.",
    cost: 150,
    icon: "flame",
    color: "#f76707",
  },
];

export function getItemsByCategory(category: ShopCategory): ShopItem[] {
  return ALL_SHOP_ITEMS.filter((item) => item.category === category);
}
