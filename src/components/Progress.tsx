import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getBodyPart } from "@/lib/bodyParts";
import { format, parseISO, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Workout {
  id: string;
  body_part: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number | null;
  workout_date: string;
  created_at: string;
}

const Progress = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .order("workout_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setWorkouts(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const exercises = useMemo(() => {
    const map = new Map<string, number>();
    workouts.forEach((w) => map.set(w.exercise_name, (map.get(w.exercise_name) ?? 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [workouts]);

  const chartData = useMemo(() => {
    if (!selectedExercise) return [];
    const filtered = workouts
      .filter((w) => w.exercise_name === selectedExercise && w.weight !== null)
      .sort((a, b) => a.workout_date.localeCompare(b.workout_date));

    // pick max weight per day
    const byDate = new Map<string, number>();
    filtered.forEach((w) => {
      const cur = byDate.get(w.workout_date) ?? 0;
      if ((w.weight ?? 0) > cur) byDate.set(w.workout_date, w.weight ?? 0);
    });
    return Array.from(byDate.entries()).map(([date, weight]) => ({
      date,
      weight,
      label: format(parseISO(date), "MMM d"),
    }));
  }, [workouts, selectedExercise]);

  const stats = useMemo(() => {
    const last7 = workouts.filter(
      (w) => parseISO(w.workout_date) >= subDays(new Date(), 7)
    );
    const totalReps = workouts.reduce((s, w) => s + w.sets * w.reps, 0);
    return {
      total: workouts.length,
      last7: last7.length,
      totalReps,
    };
  }, [workouts]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Workout[]>();
    workouts.forEach((w) => {
      const arr = groups.get(w.workout_date) ?? [];
      arr.push(w);
      groups.set(w.workout_date, arr);
    });
    return Array.from(groups.entries());
  }, [workouts]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setWorkouts((ws) => ws.filter((w) => w.id !== id));
    toast.success("Removed");
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-24 bg-secondary rounded-2xl" />
        <div className="h-24 bg-secondary rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground font-medium">Progress</p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">Your lifts</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Total" value={stats.total} />
        <Stat label="This week" value={stats.last7} />
        <Stat label="Reps" value={stats.totalReps} />
      </div>

      {workouts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No lifts yet. Log your first set to get started.</p>
        </div>
      )}

      {/* Exercise picker for chart */}
      {exercises.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Track an exercise
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {exercises.map((e) => (
              <button
                key={e.name}
                onClick={() => setSelectedExercise(selectedExercise === e.name ? null : e.name)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors tap-scale ${
                  selectedExercise === e.name
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>

          {selectedExercise && chartData.length > 1 && (
            <div className="mt-4 p-4 bg-surface rounded-2xl border border-border animate-scale-in">
              <p className="text-xs text-muted-foreground mb-2">Top weight (kg)</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
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
                    dataKey="weight"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--accent))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {selectedExercise && chartData.length <= 1 && (
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Log this exercise on more days to see a trend.
            </p>
          )}
        </div>
      )}

      {/* History */}
      {groupedByDate.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            History
          </p>
          <div className="space-y-5">
            {groupedByDate.map(([date, items]) => (
              <div key={date}>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {format(parseISO(date), "EEEE, MMM d")}
                </p>
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                  {items.map((w, i) => {
                    const bp = getBodyPart(w.body_part);
                    return (
                      <div
                        key={w.id}
                        className={`flex items-center px-4 py-3 ${
                          i !== items.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <span className="text-xl mr-3">{bp.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{w.exercise_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {w.sets} × {w.reps}
                            {w.weight !== null && ` · ${w.weight} kg`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="p-2 -mr-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-surface border border-border rounded-2xl p-3">
    <p className="text-2xl font-semibold tracking-tight">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
  </div>
);

export default Progress;
