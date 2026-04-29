// Detailed muscle catalog — used for the 3D body heatmap and exercise targeting.
export const MUSCLES = [
  "chest_upper", "chest_lower",
  "lats", "traps", "rhomboids", "lower_back",
  "front_delts", "side_delts", "rear_delts",
  "biceps", "triceps", "forearms",
  "quads", "hamstrings", "glutes", "calves", "adductors",
  "abs", "obliques",
  "cardio",
] as const;

export type Muscle = typeof MUSCLES[number];

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest_upper: "Upper chest",
  chest_lower: "Lower chest",
  lats: "Lats",
  traps: "Traps",
  rhomboids: "Rhomboids",
  lower_back: "Lower back",
  front_delts: "Front delts",
  side_delts: "Side delts",
  rear_delts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  adductors: "Adductors",
  abs: "Abs",
  obliques: "Obliques",
  cardio: "Cardio",
};

export interface Exercise {
  id: string;
  name: string;
  bodyPart: string; // matches BODY_PARTS id
  // weight 0–1: share of stimulus going to each muscle. Weights sum ≈ 1 per exercise.
  targets: Partial<Record<Muscle, number>>;
  // True for exercises where lifted load = bodyweight (+ optional added plate).
  bodyweight?: boolean;
}

export const EXERCISES: Exercise[] = [
  // ---------- CHEST ----------
  { id: "bench-press", name: "Barbell Bench Press", bodyPart: "chest", targets: { chest_lower: 0.55, chest_upper: 0.15, front_delts: 0.2, triceps: 0.1 } },
  { id: "incline-bench", name: "Incline Bench Press", bodyPart: "chest", targets: { chest_upper: 0.6, front_delts: 0.25, triceps: 0.15 } },
  { id: "decline-bench", name: "Decline Bench Press", bodyPart: "chest", targets: { chest_lower: 0.7, triceps: 0.2, front_delts: 0.1 } },
  { id: "db-bench", name: "Dumbbell Bench Press", bodyPart: "chest", targets: { chest_lower: 0.45, chest_upper: 0.2, front_delts: 0.2, triceps: 0.15 } },
  { id: "incline-db-press", name: "Incline DB Press", bodyPart: "chest", targets: { chest_upper: 0.6, front_delts: 0.25, triceps: 0.15 } },
  { id: "db-fly", name: "Dumbbell Fly", bodyPart: "chest", targets: { chest_lower: 0.55, chest_upper: 0.3, front_delts: 0.15 } },
  { id: "cable-crossover", name: "Cable Crossover", bodyPart: "chest", targets: { chest_lower: 0.5, chest_upper: 0.35, front_delts: 0.15 } },
  { id: "pec-deck", name: "Pec Deck", bodyPart: "chest", targets: { chest_lower: 0.5, chest_upper: 0.4, front_delts: 0.1 } },
  { id: "push-up", name: "Push Up", bodyPart: "chest", targets: { chest_lower: 0.5, chest_upper: 0.15, front_delts: 0.2, triceps: 0.15 }, bodyweight: true },
  { id: "dips-chest", name: "Chest Dips", bodyPart: "chest", targets: { chest_lower: 0.6, triceps: 0.25, front_delts: 0.15 }, bodyweight: true },
  { id: "weighted-dips-chest", name: "Weighted Chest Dips", bodyPart: "chest", targets: { chest_lower: 0.6, triceps: 0.25, front_delts: 0.15 }, bodyweight: true },

  // ---------- BACK ----------
  { id: "deadlift", name: "Deadlift", bodyPart: "back", targets: { lower_back: 0.3, glutes: 0.25, hamstrings: 0.2, traps: 0.15, forearms: 0.1 } },
  { id: "pull-up", name: "Pull Up", bodyPart: "back", targets: { lats: 0.6, biceps: 0.2, rhomboids: 0.15, forearms: 0.05 } },
  { id: "chin-up", name: "Chin Up", bodyPart: "back", targets: { lats: 0.5, biceps: 0.35, rhomboids: 0.15 } },
  { id: "lat-pulldown", name: "Lat Pulldown", bodyPart: "back", targets: { lats: 0.65, biceps: 0.2, rhomboids: 0.15 } },
  { id: "barbell-row", name: "Barbell Row", bodyPart: "back", targets: { lats: 0.4, rhomboids: 0.25, traps: 0.15, biceps: 0.1, lower_back: 0.1 } },
  { id: "db-row", name: "Dumbbell Row", bodyPart: "back", targets: { lats: 0.45, rhomboids: 0.25, traps: 0.15, biceps: 0.15 } },
  { id: "seated-row", name: "Seated Cable Row", bodyPart: "back", targets: { lats: 0.4, rhomboids: 0.3, traps: 0.15, biceps: 0.15 } },
  { id: "t-bar-row", name: "T-Bar Row", bodyPart: "back", targets: { lats: 0.4, rhomboids: 0.25, traps: 0.2, biceps: 0.15 } },
  { id: "face-pull", name: "Face Pull", bodyPart: "back", targets: { rear_delts: 0.5, traps: 0.25, rhomboids: 0.25 } },
  { id: "shrug", name: "Shrug", bodyPart: "back", targets: { traps: 0.85, forearms: 0.15 } },
  { id: "hyperextension", name: "Hyperextension", bodyPart: "back", targets: { lower_back: 0.6, glutes: 0.25, hamstrings: 0.15 } },
  { id: "good-morning", name: "Good Morning", bodyPart: "back", targets: { lower_back: 0.4, hamstrings: 0.4, glutes: 0.2 } },

  // ---------- LEGS ----------
  { id: "back-squat", name: "Back Squat", bodyPart: "legs", targets: { quads: 0.5, glutes: 0.3, hamstrings: 0.1, lower_back: 0.1 } },
  { id: "front-squat", name: "Front Squat", bodyPart: "legs", targets: { quads: 0.65, glutes: 0.2, abs: 0.1, lower_back: 0.05 } },
  { id: "romanian-deadlift", name: "Romanian Deadlift", bodyPart: "legs", targets: { hamstrings: 0.5, glutes: 0.35, lower_back: 0.15 } },
  { id: "leg-press", name: "Leg Press", bodyPart: "legs", targets: { quads: 0.55, glutes: 0.3, hamstrings: 0.15 } },
  { id: "lunge", name: "Lunge", bodyPart: "legs", targets: { quads: 0.45, glutes: 0.35, hamstrings: 0.2 } },
  { id: "bulgarian-split", name: "Bulgarian Split Squat", bodyPart: "legs", targets: { quads: 0.45, glutes: 0.4, hamstrings: 0.15 } },
  { id: "leg-extension", name: "Leg Extension", bodyPart: "legs", targets: { quads: 1.0 } },
  { id: "leg-curl", name: "Leg Curl", bodyPart: "legs", targets: { hamstrings: 1.0 } },
  { id: "hip-thrust", name: "Hip Thrust", bodyPart: "legs", targets: { glutes: 0.7, hamstrings: 0.2, quads: 0.1 } },
  { id: "calf-raise", name: "Calf Raise", bodyPart: "legs", targets: { calves: 1.0 } },
  { id: "seated-calf", name: "Seated Calf Raise", bodyPart: "legs", targets: { calves: 1.0 } },
  { id: "hack-squat", name: "Hack Squat", bodyPart: "legs", targets: { quads: 0.6, glutes: 0.3, hamstrings: 0.1 } },
  { id: "adductor-machine", name: "Adductor Machine", bodyPart: "legs", targets: { adductors: 1.0 } },
  { id: "goblet-squat", name: "Goblet Squat", bodyPart: "legs", targets: { quads: 0.55, glutes: 0.3, abs: 0.15 } },

  // ---------- SHOULDERS ----------
  { id: "ohp", name: "Overhead Press", bodyPart: "shoulders", targets: { front_delts: 0.55, side_delts: 0.2, triceps: 0.2, traps: 0.05 } },
  { id: "db-shoulder-press", name: "DB Shoulder Press", bodyPart: "shoulders", targets: { front_delts: 0.5, side_delts: 0.25, triceps: 0.2, traps: 0.05 } },
  { id: "arnold-press", name: "Arnold Press", bodyPart: "shoulders", targets: { front_delts: 0.45, side_delts: 0.35, triceps: 0.2 } },
  { id: "lateral-raise", name: "Lateral Raise", bodyPart: "shoulders", targets: { side_delts: 0.85, traps: 0.1, front_delts: 0.05 } },
  { id: "front-raise", name: "Front Raise", bodyPart: "shoulders", targets: { front_delts: 0.85, side_delts: 0.1, traps: 0.05 } },
  { id: "rear-delt-fly", name: "Rear Delt Fly", bodyPart: "shoulders", targets: { rear_delts: 0.7, rhomboids: 0.2, traps: 0.1 } },
  { id: "upright-row", name: "Upright Row", bodyPart: "shoulders", targets: { side_delts: 0.5, traps: 0.35, biceps: 0.15 } },
  { id: "cable-lateral", name: "Cable Lateral Raise", bodyPart: "shoulders", targets: { side_delts: 0.9, traps: 0.1 } },

  // ---------- ARMS ----------
  { id: "barbell-curl", name: "Barbell Curl", bodyPart: "arms", targets: { biceps: 0.85, forearms: 0.15 } },
  { id: "db-curl", name: "Dumbbell Curl", bodyPart: "arms", targets: { biceps: 0.85, forearms: 0.15 } },
  { id: "hammer-curl", name: "Hammer Curl", bodyPart: "arms", targets: { biceps: 0.6, forearms: 0.4 } },
  { id: "preacher-curl", name: "Preacher Curl", bodyPart: "arms", targets: { biceps: 0.9, forearms: 0.1 } },
  { id: "concentration-curl", name: "Concentration Curl", bodyPart: "arms", targets: { biceps: 0.95, forearms: 0.05 } },
  { id: "incline-curl", name: "Incline DB Curl", bodyPart: "arms", targets: { biceps: 0.9, forearms: 0.1 } },
  { id: "tricep-pushdown", name: "Tricep Pushdown", bodyPart: "arms", targets: { triceps: 1.0 } },
  { id: "skull-crusher", name: "Skull Crusher", bodyPart: "arms", targets: { triceps: 0.95, forearms: 0.05 } },
  { id: "overhead-tricep", name: "Overhead Tricep Extension", bodyPart: "arms", targets: { triceps: 1.0 } },
  { id: "close-grip-bench", name: "Close Grip Bench", bodyPart: "arms", targets: { triceps: 0.6, chest_lower: 0.25, front_delts: 0.15 } },
  { id: "dips-tricep", name: "Tricep Dips", bodyPart: "arms", targets: { triceps: 0.7, chest_lower: 0.2, front_delts: 0.1 } },
  { id: "wrist-curl", name: "Wrist Curl", bodyPart: "arms", targets: { forearms: 1.0 } },

  // ---------- CORE ----------
  { id: "crunch", name: "Crunch", bodyPart: "core", targets: { abs: 1.0 } },
  { id: "sit-up", name: "Sit Up", bodyPart: "core", targets: { abs: 0.85, obliques: 0.15 } },
  { id: "plank", name: "Plank", bodyPart: "core", targets: { abs: 0.7, obliques: 0.2, lower_back: 0.1 } },
  { id: "leg-raise", name: "Hanging Leg Raise", bodyPart: "core", targets: { abs: 0.85, obliques: 0.15 } },
  { id: "russian-twist", name: "Russian Twist", bodyPart: "core", targets: { obliques: 0.7, abs: 0.3 } },
  { id: "cable-crunch", name: "Cable Crunch", bodyPart: "core", targets: { abs: 0.9, obliques: 0.1 } },
  { id: "ab-wheel", name: "Ab Wheel Rollout", bodyPart: "core", targets: { abs: 0.7, obliques: 0.15, lower_back: 0.15 } },
  { id: "side-plank", name: "Side Plank", bodyPart: "core", targets: { obliques: 0.8, abs: 0.2 } },
  { id: "mountain-climber", name: "Mountain Climber", bodyPart: "core", targets: { abs: 0.5, obliques: 0.2, cardio: 0.3 } },

  // ---------- CARDIO ----------
  { id: "running", name: "Running", bodyPart: "cardio", targets: { cardio: 0.7, calves: 0.15, quads: 0.1, hamstrings: 0.05 } },
  { id: "cycling", name: "Cycling", bodyPart: "cardio", targets: { cardio: 0.6, quads: 0.25, hamstrings: 0.1, calves: 0.05 } },
  { id: "rowing", name: "Rowing", bodyPart: "cardio", targets: { cardio: 0.5, lats: 0.2, quads: 0.15, biceps: 0.1, lower_back: 0.05 } },
  { id: "elliptical", name: "Elliptical", bodyPart: "cardio", targets: { cardio: 0.7, quads: 0.15, hamstrings: 0.1, calves: 0.05 } },
  { id: "stair-master", name: "Stair Master", bodyPart: "cardio", targets: { cardio: 0.5, quads: 0.25, glutes: 0.2, calves: 0.05 } },
  { id: "jump-rope", name: "Jump Rope", bodyPart: "cardio", targets: { cardio: 0.7, calves: 0.25, forearms: 0.05 } },
  { id: "swimming", name: "Swimming", bodyPart: "cardio", targets: { cardio: 0.5, lats: 0.2, chest_upper: 0.1, triceps: 0.1, quads: 0.1 } },

  // ---------- FULL BODY ----------
  { id: "clean-and-jerk", name: "Clean & Jerk", bodyPart: "full-body", targets: { quads: 0.2, glutes: 0.15, traps: 0.15, front_delts: 0.15, lower_back: 0.15, hamstrings: 0.1, triceps: 0.1 } },
  { id: "snatch", name: "Snatch", bodyPart: "full-body", targets: { quads: 0.2, glutes: 0.15, traps: 0.15, front_delts: 0.15, lower_back: 0.15, hamstrings: 0.1, side_delts: 0.1 } },
  { id: "thruster", name: "Thruster", bodyPart: "full-body", targets: { quads: 0.3, glutes: 0.2, front_delts: 0.25, triceps: 0.15, abs: 0.1 } },
  { id: "burpee", name: "Burpee", bodyPart: "full-body", targets: { cardio: 0.4, chest_lower: 0.15, quads: 0.2, abs: 0.15, front_delts: 0.1 } },
  { id: "kettlebell-swing", name: "Kettlebell Swing", bodyPart: "full-body", targets: { glutes: 0.35, hamstrings: 0.25, lower_back: 0.15, front_delts: 0.15, abs: 0.1 } },
  { id: "turkish-get-up", name: "Turkish Get Up", bodyPart: "full-body", targets: { abs: 0.25, obliques: 0.2, front_delts: 0.2, glutes: 0.15, quads: 0.1, triceps: 0.1 } },
  { id: "farmer-walk", name: "Farmer's Walk", bodyPart: "full-body", targets: { forearms: 0.3, traps: 0.25, abs: 0.15, glutes: 0.15, quads: 0.15 } },
];

export const getExercisesByBodyPart = (bodyPart: string) =>
  EXERCISES.filter((e) => e.bodyPart === bodyPart);

export const getExerciseByName = (name: string) =>
  EXERCISES.find((e) => e.name.toLowerCase() === name.toLowerCase());
