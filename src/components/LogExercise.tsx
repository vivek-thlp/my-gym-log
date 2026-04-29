import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getBodyPart } from "@/lib/bodyParts";
import { getExercisesByBodyPart, type Exercise } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, Plus, Check, Search } from "lucide-react";

const schema = z.object({
  exercise_name: z.string().trim().min(1, "Pick an exercise").max(80),
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
  const allExercises = useMemo(() => getExercisesByBodyPart(bodyPart), [bodyPart]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [logCount, setLogCount] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allExercises;
    return allExercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [allExercises, query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;

    // For bodyweight exercises: total load per rep = bodyweight + added weight (if any).
    let effectiveWeight: string | number = weight;
    if (selected.bodyweight) {
      const bw = parseFloat(bodyWeight);
      if (!bw || bw <= 0) {
        toast.error("Enter your body weight");
        return;
      }
      const added = weight === "" ? 0 : parseFloat(weight);
      effectiveWeight = bw + (isNaN(added) ? 0 : added);
    }

    const parsed = schema.safeParse({ exercise_name: selected.name, sets, reps, weight: effectiveWeight });
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
    setWeight("");
  };

  return (
    <div className="animate-fade-in">
      <button
        onClick={selected ? () => setSelected(null) : onBack}
        className="flex items-center text-sm text-muted-foreground -ml-2 mb-4 hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {selected ? "Change exercise" : "Back"}
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-border overflow-hidden shrink-0">
          <img src={bp.image} alt={bp.label} width={48} height={48} className="w-full h-full object-contain p-1" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">{bp.label} day</p>
          <h2 className="text-3xl font-semibold tracking-tight mt-0.5 truncate">
            {selected ? selected.name : "Pick an exercise"}
          </h2>
        </div>
      </div>

      {!selected ? (
        <div className="space-y-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${bp.label.toLowerCase()} exercises…`}
              className="h-12 pl-10 rounded-xl border-border bg-secondary text-base"
            />
          </div>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                No exercises match.
              </p>
            )}
            {filtered.map((ex, i) => (
              <button
                key={ex.id}
                onClick={() => setSelected(ex)}
                className={`w-full flex items-center px-4 py-3.5 text-left tap-scale hover:bg-surface-elevated transition-colors ${
                  i !== filtered.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ex.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {Object.keys(ex.targets).slice(0, 3).map((m) => m.replace(/_/g, " ")).join(" · ")}
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
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
            <Field label={selected.bodyweight ? "Added" : "Weight"}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={selected.bodyweight ? "+kg" : "kg"}
                className="h-12 rounded-xl border-border bg-secondary text-base text-center"
              />
            </Field>
          </div>

          {selected.bodyweight && (
            <Field label="Body weight">
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="kg"
                className="h-12 rounded-xl border-border bg-secondary text-base"
                required
              />
            </Field>
          )}

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
      )}
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
