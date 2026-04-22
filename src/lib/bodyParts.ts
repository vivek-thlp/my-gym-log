export const BODY_PARTS = [
  { id: "chest", label: "Chest", emoji: "🔥" },
  { id: "back", label: "Back", emoji: "🪨" },
  { id: "legs", label: "Legs", emoji: "🦵" },
  { id: "shoulders", label: "Shoulders", emoji: "🎯" },
  { id: "arms", label: "Arms", emoji: "💪" },
  { id: "core", label: "Core", emoji: "⚡" },
  { id: "cardio", label: "Cardio", emoji: "🏃" },
  { id: "full-body", label: "Full Body", emoji: "✨" },
] as const;

export type BodyPartId = typeof BODY_PARTS[number]["id"];

export const getBodyPart = (id: string) =>
  BODY_PARTS.find((b) => b.id === id) ?? { id, label: id, emoji: "💪" };
