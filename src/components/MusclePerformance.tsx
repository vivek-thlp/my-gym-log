import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EXERCISES, type Muscle } from "@/lib/exercises";
import { format, parseISO, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface Workout {
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number | null;
  workout_date: string;
}

// Group sub-muscles into primary muscle groups the user thinks in.
type PrimaryMuscle =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "quads" | "hamstrings" | "glutes" | "calves" | "adductors"
  | "abs" | "obliques" | "lower_back" | "traps" | "cardio";

const PRIMARY_LABELS: Record<PrimaryMuscle, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
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
  lower_back: "Lower back",
  traps: "Traps",
  cardio: "Cardio",
};

const toPrimary = (m: Muscle): PrimaryMuscle => {
  switch (m) {
    case "chest_upper":
    case "chest_lower":
      return "chest";
    case "lats":
    case "rhomboids":
      return "back";
    case "front_delts":
    case "side_delts":
    case "rear_delts":
      return "shoulders";
    default:
      return m as PrimaryMuscle;
  }
};

// Pre-compute the PRIMARY muscle for each exercise (the muscle group with the largest combined share).
const primaryByExercise = new Map<string, PrimaryMuscle>();
EXERCISES.forEach((e) => {
  const sums = new Map<PrimaryMuscle, number>();
  Object.entries(e.targets).forEach(([m, share]) => {
    const p = toPrimary(m as Muscle);
    sums.set(p, (sums.get(p) ?? 0) + (share ?? 0));
  });
  let best: PrimaryMuscle | null = null;
  let bestVal = 0;
  sums.forEach((v, k) => {
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  });
  if (best) primaryByExercise.set(e.name.toLowerCase(), best);
});

const MusclePerformance = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<PrimaryMuscle | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("workouts")
        .select("exercise_name, sets, reps, weight, workout_date")
        .order("workout_date", { ascending: true });
      if (error) toast.error(error.message);
      else setWorkouts(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // Volume per primary muscle = sets * reps * weight, attributed only to the primary muscle of the exercise.
  const trainedMuscles = useMemo(() => {
    const totals = new Map<PrimaryMuscle, number>();
    workouts.forEach((w) => {
      const primary = primaryByExercise.get(w.exercise_name.toLowerCase());
      if (!primary) return;
      const load = w.sets * w.reps * (w.weight ?? 1);
      totals.set(primary, (totals.get(primary) ?? 0) + load);
    });
    return Array.from(totals.entries())
      .map(([muscle, volume]) => ({ muscle, volume }))
      .sort((a, b) => b.volume - a.volume);
  }, [workouts]);

  useEffect(() => {
    if (!selectedMuscle && trainedMuscles.length > 0) {
      setSelectedMuscle(trainedMuscles[0].muscle);
    }
  }, [trainedMuscles, selectedMuscle]);

  // Daily volume series for selected primary muscle.
  const series = useMemo(() => {
    if (!selectedMuscle) return [];
    const byDate = new Map<string, number>();
    workouts.forEach((w) => {
      const primary = primaryByExercise.get(w.exercise_name.toLowerCase());
      if (primary !== selectedMuscle) return;
      const load = w.sets * w.reps * (w.weight ?? 1);
      byDate.set(w.workout_date, (byDate.get(w.workout_date) ?? 0) + load);
    });
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, volume]) => ({
        date,
        volume: Math.round(volume),
        label: format(parseISO(date), "MMM d"),
      }));
  }, [workouts, selectedMuscle]);

  // Stats: last 30 days vs previous 30 days.
  const stats = useMemo(() => {
    if (!selectedMuscle) return null;
    const now = new Date();
    const last30 = subDays(now, 30);
    const prev30 = subDays(now, 60);

    let recent = 0;
    let previous = 0;
    let totalSessions = 0;
    let bestSession = 0;
    let totalVolume = 0;

    series.forEach((s) => {
      const d = parseISO(s.date);
      totalSessions += 1;
      totalVolume += s.volume;
      if (s.volume > bestSession) bestSession = s.volume;
      if (d >= last30) recent += s.volume;
      else if (d >= prev30) previous += s.volume;
    });

    const change = previous === 0 ? (recent > 0 ? 100 : 0) : ((recent - previous) / previous) * 100;
    return { recent, previous, change, totalSessions, bestSession, totalVolume };
  }, [series, selectedMuscle]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-24 bg-secondary rounded-2xl" />
        <div className="h-48 bg-secondary rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground font-medium">Muscle performance</p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">Track by muscle</h2>
      </div>

      {trainedMuscles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Log a few workouts to see muscle performance.</p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Select a muscle
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
              {trainedMuscles.map((t) => (
                <button
                  key={t.muscle}
                  onClick={() => setSelectedMuscle(t.muscle)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors tap-scale ${
                    selectedMuscle === t.muscle
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground hover:bg-secondary/70"
                  }`}
                >
                  {PRIMARY_LABELS[t.muscle]}
                </button>
              ))}
            </div>
          </div>

          {selectedMuscle && stats && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard
                  label="Last 30 days"
                  value={stats.recent.toLocaleString()}
                  unit="vol"
                  trend={stats.change}
                />
                <StatCard
                  label="Sessions"
                  value={String(stats.totalSessions)}
                  unit="total"
                />
                <StatCard
                  label="Best session"
                  value={stats.bestSession.toLocaleString()}
                  unit="vol"
                />
                <StatCard
                  label="Total volume"
                  value={stats.totalVolume.toLocaleString()}
                  unit="all time"
                />
              </div>

              {series.length > 1 ? (
                <div className="p-4 bg-surface rounded-2xl border border-border mb-5 animate-scale-in">
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-sm font-medium">{PRIMARY_LABELS[selectedMuscle]} volume</p>
                    <p className="text-xs text-muted-foreground">sets × reps × weight</p>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={series} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2.5}
                        dot={{ fill: "hsl(var(--accent))", r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-3 mb-5 text-xs text-muted-foreground text-center">
                  Train this muscle on more days to see a trend.
                </p>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Recent sessions
                </p>
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                  {series
                    .slice(-8)
                    .reverse()
                    .map((s, i, arr) => (
                      <div
                        key={s.date}
                        className={`flex items-center px-4 py-3 ${
                          i !== arr.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <p className="flex-1 text-sm font-medium">
                          {format(parseISO(s.date), "EEE, MMM d")}
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {s.volume.toLocaleString()}
                          <span className="text-muted-foreground font-normal ml-1">vol</span>
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: string;
  unit: string;
  trend?: number;
}) => {
  const TrendIcon = trend === undefined ? null : trend > 1 ? TrendingUp : trend < -1 ? TrendingDown : Minus;
  const trendColor =
    trend === undefined
      ? ""
      : trend > 1
        ? "text-emerald-500"
        : trend < -1
          ? "text-red-500"
          : "text-muted-foreground";
  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold tabular-nums mt-1">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        <p className="text-[11px] text-muted-foreground">{unit}</p>
        {TrendIcon && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ml-auto ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend!).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default MusclePerformance;
