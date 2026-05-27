export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  iconSet: "Ionicons" | "MaterialCommunityIcons" | "Feather";
  color: string;
  requirement: (stats: {
    brushingStreak: number;
    fullCareStreak: number;
    totalFullDays: number;
    totalSessions: number;
    extraBrushes: number;
    isComeback: boolean;
  }) => boolean;
}

export const ALL_BADGES: Badge[] = [
  {
    id: "first_brush",
    name: "First Stroke",
    description: "Complete your very first brushing session",
    iconName: "star",
    iconSet: "Ionicons",
    color: "#00c4a7",
    requirement: ({ totalSessions }) => totalSessions >= 1,
  },
  {
    id: "first_full_day",
    name: "Clean Sweep",
    description: "Complete your first full oral care day",
    iconName: "checkmark-circle",
    iconSet: "Ionicons",
    color: "#00d97e",
    requirement: ({ totalFullDays }) => totalFullDays >= 1,
  },
  {
    id: "streak_3",
    name: "3-Day Streak",
    description: "Maintain a 3-day brushing streak",
    iconName: "flame",
    iconSet: "Ionicons",
    color: "#ff8c42",
    requirement: ({ brushingStreak }) => brushingStreak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day brushing streak",
    iconName: "trophy",
    iconSet: "Ionicons",
    color: "#f5c842",
    requirement: ({ brushingStreak }) => brushingStreak >= 7,
  },
  {
    id: "streak_14",
    name: "2-Week Champion",
    description: "Maintain a 14-day brushing streak",
    iconName: "medal",
    iconSet: "Ionicons",
    color: "#c0c0c0",
    requirement: ({ brushingStreak }) => brushingStreak >= 14,
  },
  {
    id: "streak_30",
    name: "30-Day Legend",
    description: "Maintain a 30-day brushing streak",
    iconName: "diamond",
    iconSet: "Ionicons",
    color: "#00c4a7",
    requirement: ({ brushingStreak }) => brushingStreak >= 30,
  },
  {
    id: "full_care_7",
    name: "Total Care 7",
    description: "Complete 7 full oral care days",
    iconName: "ribbon",
    iconSet: "Ionicons",
    color: "#9b59b6",
    requirement: ({ fullCareStreak }) => fullCareStreak >= 7,
  },
  {
    id: "full_care_30",
    name: "Perfect Month",
    description: "Complete 30 full oral care days",
    iconName: "planet",
    iconSet: "Ionicons",
    color: "#e74c3c",
    requirement: ({ totalFullDays }) => totalFullDays >= 30,
  },
  {
    id: "extra_credit",
    name: "Extra Credit",
    description: "Complete 5 extra brushing sessions",
    iconName: "add-circle",
    iconSet: "Ionicons",
    color: "#3498db",
    requirement: ({ extraBrushes }) => extraBrushes >= 5,
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Complete a full day after missing brushing",
    iconName: "refresh-circle",
    iconSet: "Ionicons",
    color: "#e67e22",
    requirement: ({ isComeback, totalFullDays }) =>
      isComeback && totalFullDays >= 1,
  },
];
