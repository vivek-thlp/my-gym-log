import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getBodyPart } from "@/lib/bodyParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, Plus, Check } from "lucide-react";

const schema = z.object({
  exercise_name: z.string().trim().min(1, "Exercise name required").max(80),
  sets: z.coerce.number().int().min(1, "Sets ≥ 1").max(50),
  reps: z.coerce.number().int().min(1, "Reps ≥ 1").max(500),
  weight: z.union([z.literal(""), z.coerce.number().min(0).max(2000)]).optional(),
});

interface Props {
  bodyPart: string;
  onBack: () => void;
  onLogged: () => void;
}

const LogExercise = ({ bodyPart, onBack, onLogged }: Props) => {
  const { user } = useAuth();
  const bp = getBodyPart(bodyPart);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [logCount, setLogCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = schema.safeParse({ exercise_name: exerciseName, sets, reps, weight });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id,
      body_part: bodyPart,
      exercise_name: parsed.data.exercise_name,
      sets: parsed.data.sets,
      reps: parsed.data.reps,
      weight: parsed.data.weight === "" || parsed.data.weight === undefined ? null : parsed.data.weight,
      workout_date: date,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setLogCount((c) => c + 1);
    toast.success(`${parsed.data.exercise_name} logged`);
    setExerciseName("");
    setWeight("");
  };

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-muted-foreground -ml-2 mb-4 hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <span>{bp.emoji}</span> {bp.label} day
        </p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">
          Log a set
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Exercise">
          <Input
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Bench press"
            className="h-12 rounded-xl border-border bg-secondary text-base"
            required
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Sets">
            <Input
              type="number"
              inputMode="numeric"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className="h-12 rounded-xl border-border bg-secondary text-base text-center"
              required
            />
          </Field>
          <Field label="Reps">
            <Input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="h-12 rounded-xl border-border bg-secondary text-base text-center"
              required
            />
          </Field>
          <Field label="Weight">
            <Input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="kg"
              className="h-12 rounded-xl border-border bg-secondary text-base text-center"
            />
          </Field>
        </div>

        <Field label="Date">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 rounded-xl border-border bg-secondary text-base"
            required
          />
        </Field>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-13 py-4 rounded-xl text-base font-medium tap-scale mt-6"
        >
          <Plus className="w-5 h-5 mr-1" />
          {submitting ? "Saving…" : "Log set"}
        </Button>

        {logCount > 0 && (
          <button
            type="button"
            onClick={onLogged}
            className="w-full text-center text-sm text-accent font-medium py-3 flex items-center justify-center gap-2 animate-fade-in"
          >
            <Check className="w-4 h-4" />
            {logCount} logged · Finish workout
          </button>
        )}
      </form>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </Label>
    {children}
  </div>
);

export default LogExercise;
