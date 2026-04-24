import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getBodyPart } from "@/lib/bodyParts";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

interface Workout {
  id: string;
  body_part: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number | null;
  workout_date: string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const CalendarView = () => {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("workouts")
        .select("id, body_part, exercise_name, sets, reps, weight, workout_date")
        .order("workout_date", { ascending: false });
      if (error) toast.error(error.message);
      else setWorkouts(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // Map: yyyy-MM-dd -> unique body parts trained that day
  const byDay = useMemo(() => {
    const m = new Map<string, { parts: string[]; workouts: Workout[] }>();
    workouts.forEach((w) => {
      const key = w.workout_date;
      const entry = m.get(key) ?? { parts: [], workouts: [] };
      if (!entry.parts.includes(w.body_part)) entry.parts.push(w.body_part);
      entry.workouts.push(w);
      m.set(key, entry);
    });
    return m;
  }, [workouts]);

  // 6-week grid of days
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const out: Date[] = [];
    const d = new Date(start);
    while (d <= end) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [cursor]);

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : null;
  const selectedEntry = selectedKey ? byDay.get(selectedKey) : undefined;

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground font-medium">Calendar</p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">Training history</h2>
      </div>

      {/* Month switcher */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCursor(subMonths(cursor, 1))}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center tap-scale text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-base font-semibold tracking-tight">
          {format(cursor, "MMMM yyyy")}
        </div>
        <button
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center tap-scale text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const entry = byDay.get(key);
          const inMonth = isSameMonth(d, cursor);
          const today = isToday(d);
          const isSelected = selected && isSameDay(d, selected);
          const trained = !!entry;

          return (
            <button
              key={key}
              onClick={() => setSelected(d)}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all tap-scale border ${
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : trained
                    ? "border-border bg-surface hover:border-foreground/40"
                    : "border-transparent bg-secondary/40 hover:bg-secondary"
              } ${!inMonth ? "opacity-30" : ""}`}
            >
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  today && !isSelected ? "text-accent" : ""
                }`}
              >
                {format(d, "d")}
              </span>

              {trained && (
                <div className="flex -space-x-1.5">
                  {entry!.parts.slice(0, 3).map((pid) => {
                    const bp = getBodyPart(pid);
                    return (
                      <div
                        key={pid}
                        className={`w-5 h-5 rounded-full overflow-hidden ring-1 ${
                          isSelected ? "ring-background bg-background" : "ring-background bg-surface-elevated"
                        }`}
                        title={bp.label}
                      >
                        <img
                          src={bp.image}
                          alt={bp.label}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    );
                  })}
                  {entry!.parts.length > 3 && (
                    <div
                      className={`w-5 h-5 rounded-full ring-1 ring-background flex items-center justify-center text-[8px] font-semibold ${
                        isSelected ? "bg-background text-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      +{entry!.parts.length - 3}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend / empty state */}
      {!loading && workouts.length === 0 && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          No workouts logged yet. Start training to see your calendar fill up.
        </p>
      )}

      {/* Detail popup */}
      {selected && (
        <div
          className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface-elevated border border-border rounded-t-3xl sm:rounded-3xl p-5 safe-bottom animate-slide-up"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {format(selected, "EEEE")}
                </p>
                <h3 className="text-2xl font-semibold tracking-tight mt-0.5">
                  {format(selected, "MMM d, yyyy")}
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center tap-scale"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!selectedEntry ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No training on this day.</p>
              </div>
            ) : (
              <>
                {/* Body part chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedEntry.parts.map((pid) => {
                    const bp = getBodyPart(pid);
                    return (
                      <div
                        key={pid}
                        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-secondary"
                      >
                        <div className="w-7 h-7 rounded-full bg-white overflow-hidden flex items-center justify-center">
                          <img
                            src={bp.image}
                            alt={bp.label}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-xs font-medium">{bp.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Workout list */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                  {selectedEntry.workouts.map((w, i) => (
                    <div
                      key={w.id}
                      className={`px-4 py-3 ${
                        i !== selectedEntry.workouts.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{w.exercise_name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {w.sets} × {w.reps}
                          {w.weight ? ` · ${w.weight}kg` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
