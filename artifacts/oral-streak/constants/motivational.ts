export const MOTIVATIONAL_MESSAGES = {
  noStreak: [
    "Every great streak starts with one brushing session.",
    "Today is the perfect day to begin. Your smile is worth it.",
    "Small actions, lasting habits. Start now.",
    "The best time to brush was yesterday. The second best is now.",
  ],
  lowStreak: [
    "You're building something powerful. Keep going.",
    "Consistency is the secret weapon. You're using it.",
    "Each session makes the next one easier.",
    "Your teeth are thanking you. Keep it up.",
  ],
  midStreak: [
    "You're unstoppable. Don't let the streak die here.",
    "Over a week strong — that's real discipline.",
    "Your oral health is noticeably better. Don't stop now.",
    "Habits this strong are rare. You're exceptional.",
  ],
  highStreak: [
    "Legendary consistency. Your streak is an inspiration.",
    "30 days? You've made this a lifestyle, not a habit.",
    "Elite level dental hygiene. Keep the standard.",
    "You are the 1% who actually follows through. Remarkable.",
  ],
  comeback: [
    "You slipped, but you're back. That's what matters.",
    "Comeback mode activated. Show this streak who's boss.",
    "Missed yesterday, not today. That's the mindset.",
    "Resilience is brushing again after missing a day.",
  ],
  morning: [
    "Morning fresh. Set the tone for the day.",
    "Clean mouth, clear mind. Great morning choice.",
    "Starting strong. Your mouth will thank you all day.",
  ],
  night: [
    "End the day right. Your smile deserves protection overnight.",
    "Night brush locked in. Sleep clean.",
    "Finishing strong is how champions are made.",
  ],
  fullDay: [
    "Perfect day. Every task done. You're unstoppable.",
    "Full oral care complete. This is elite-level commitment.",
    "100% today. Keep stacking these wins.",
  ],
};

export function getMotivationalMessage(
  brushingStreak: number,
  isComeback: boolean
): string {
  let pool: string[];

  if (isComeback) {
    pool = MOTIVATIONAL_MESSAGES.comeback;
  } else if (brushingStreak === 0) {
    pool = MOTIVATIONAL_MESSAGES.noStreak;
  } else if (brushingStreak < 7) {
    pool = MOTIVATIONAL_MESSAGES.lowStreak;
  } else if (brushingStreak < 30) {
    pool = MOTIVATIONAL_MESSAGES.midStreak;
  } else {
    pool = MOTIVATIONAL_MESSAGES.highStreak;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
