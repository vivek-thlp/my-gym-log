import chestImg from "@/assets/body-chest.png";
import backImg from "@/assets/body-back.png";
import legsImg from "@/assets/body-legs.png";
import shouldersImg from "@/assets/body-shoulders.png";
import armsImg from "@/assets/body-arms.png";
import coreImg from "@/assets/body-core.png";
import cardioImg from "@/assets/body-cardio.png";
import fullBodyImg from "@/assets/body-full.png";

export const BODY_PARTS = [
  { id: "chest", label: "Chest", image: chestImg },
  { id: "back", label: "Back", image: backImg },
  { id: "legs", label: "Legs", image: legsImg },
  { id: "shoulders", label: "Shoulders", image: shouldersImg },
  { id: "arms", label: "Arms", image: armsImg },
  { id: "core", label: "Core", image: coreImg },
  { id: "cardio", label: "Cardio", image: cardioImg },
  { id: "full-body", label: "Full Body", image: fullBodyImg },
] as const;

export type BodyPartId = typeof BODY_PARTS[number]["id"];

export const getBodyPart = (id: string) =>
  BODY_PARTS.find((b) => b.id === id) ?? { id, label: id, image: fullBodyImg };
