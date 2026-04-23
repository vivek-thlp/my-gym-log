import { Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getExerciseByName, MUSCLES, MUSCLE_LABELS, type Muscle } from "@/lib/exercises";
import { parseISO, subDays } from "date-fns";
import { toast } from "sonner";
import BodyModel from "./BodyModel";

interface Workout {
  exercise_name: string;
  sets: number;
  reps: number;
  workout_date: string;
}

const BodyCondition = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const cutoff = subDays(new Date(), 30).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("workouts")
        .select("exercise_name, sets, reps, workout_date")
        .gte("workout_date", cutoff);
      if (error) toast.error(error.message);
      else setWorkouts(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // Compute raw stimulus per muscle = Σ (sets × weight share)
  const muscleVolume = useMemo(() => {
    const totals: Record<string, number> = {};
    workouts.forEach((w) => {
      const ex = getExerciseByName(w.exercise_name);
      if (!ex) return;
      Object.entries(ex.targets).forEach(([m, share]) => {
        totals[m] = (totals[m] ?? 0) + w.sets * (share ?? 0);
      });
    });
    return totals;
  }, [workouts]);

  // Normalize 0–1 against the most-trained muscle for the visual heatmap.
  const intensity = useMemo(() => {
    const max = Math.max(1, ...Object.values(muscleVolume));
    const out: Partial<Record<Muscle, number>> = {};
    MUSCLES.forEach((m) => {
      out[m] = (muscleVolume[m] ?? 0) / max;
    });
    return out;
  }, [muscleVolume]);

  // Percentage (out of total volume) per muscle, for the list
  const percentages = useMemo(() => {
    const total = Object.values(muscleVolume).reduce((a, b) => a + b, 0);
    if (total === 0) return [] as { muscle: Muscle; pct: number }[];
    return MUSCLES.map((m) => ({
      muscle: m,
      pct: ((muscleVolume[m] ?? 0) / total) * 100,
    }))
      .filter((x) => x.pct > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [muscleVolume]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-72 bg-secondary rounded-3xl" />
        <div className="h-24 bg-secondary rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground font-medium">Body condition</p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">Last 30 days</h2>
      </div>

      <div className="relative h-[420px] w-full rounded-3xl bg-gradient-to-b from-surface to-background border border-border overflow-hidden mb-4">
        <Suspense fallback={null}>
          <BodyModel intensity={intensity} />
        </Suspense>
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium pointer-events-none">
          <span>Drag to rotate</span>
          <span>Pinch to zoom</span>
        </div>
        {/* Legend */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Cold</span>
          <div
            className="flex-1 h-1.5 rounded-full"
            style={{
              background:
                "linear-gradient(to right, hsl(0 0% 18%), hsl(209 60% 35%), hsl(180 80% 45%), hsl(40 90% 55%), hsl(10 90% 55%))",
            }}
          />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Hot</span>
        </div>
      </div>

      {percentages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No training logged in the last 30 days yet.</p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Muscle share
          </p>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {percentages.map((p, i) => (
              <div
                key={p.muscle}
                className={`px-4 py-3 ${i !== percentages.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{MUSCLE_LABELS[p.muscle]}</span>
                  <span className="text-sm font-semibold tabular-nums">{p.pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, p.pct)}%`,
                      background:
                        p.pct > 15
                          ? "hsl(10 90% 55%)"
                          : p.pct > 7
                            ? "hsl(40 90% 55%)"
                            : "hsl(209 80% 55%)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyCondition;
