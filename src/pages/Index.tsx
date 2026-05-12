import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BodyModel3D from "@/components/BodyModel3D";
import LogExercise from "@/components/LogExercise";
import ProgressView from "@/components/Progress";
import MusclePerformance from "@/components/MusclePerformance";
import CalendarView from "@/components/CalendarView";
import { Dumbbell, BarChart3, Activity, LogOut, CalendarDays } from "lucide-react";

type Tab = "log" | "progress" | "muscles" | "calendar";
type LogStep = "pick" | "logging";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("log");
  const [step, setStep] = useState<LogStep>("pick");
  const [bodyPart, setBodyPart] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }

  const handleSelectBody = (id: string) => {
    setBodyPart(id);
    setStep("logging");
  };

  const handleFinish = () => {
    setStep("pick");
    setBodyPart(null);
    setTab("progress");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-10 border-b border-border/60">
        <div className="max-w-md mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-background" strokeWidth={2.4} />
            </div>
            <span className="font-semibold tracking-tight">Lift</span>
          </div>
          <button
            onClick={signOut}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-6 pb-28">
        {tab === "log" && step === "pick" && (
          <BodyModel3D onSelect={handleSelectBody} />
        )}
        {tab === "log" && step === "logging" && bodyPart && (
          <LogExercise
            bodyPart={bodyPart}
            onBack={() => {
              setStep("pick");
              setBodyPart(null);
            }}
            onLogged={handleFinish}
          />
        )}
        {tab === "progress" && <ProgressView />}
        {tab === "muscles" && <MusclePerformance />}
        {tab === "calendar" && <CalendarView />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 glass border-t border-border/60 safe-bottom z-10">
        <div className="max-w-md mx-auto grid grid-cols-4">
          <TabButton
            active={tab === "log"}
            onClick={() => {
              setTab("log");
              setStep("pick");
            }}
            icon={<Dumbbell className="w-5 h-5" strokeWidth={2.2} />}
            label="Log"
          />
          <TabButton
            active={tab === "progress"}
            onClick={() => setTab("progress")}
            icon={<BarChart3 className="w-5 h-5" strokeWidth={2.2} />}
            label="Progress"
          />
          <TabButton
            active={tab === "calendar"}
            onClick={() => setTab("calendar")}
            icon={<CalendarDays className="w-5 h-5" strokeWidth={2.2} />}
            label="Calendar"
          />
          <TabButton
            active={tab === "muscles"}
            onClick={() => setTab("muscles")}
            icon={<Activity className="w-5 h-5" strokeWidth={2.2} />}
            label="Muscles"
          />
        </div>
      </nav>
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors tap-scale ${
      active ? "text-foreground" : "text-muted-foreground"
    }`}
  >
    {icon}
    <span className="text-[11px] font-medium">{label}</span>
  </button>
);

export default Index;
