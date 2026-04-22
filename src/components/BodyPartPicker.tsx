import { BODY_PARTS } from "@/lib/bodyParts";

interface Props {
  onSelect: (id: string) => void;
}

const BodyPartPicker = ({ onSelect }: Props) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground font-medium">Today</p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">
          What are you training?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BODY_PARTS.map((bp) => (
          <button
            key={bp.id}
            onClick={() => onSelect(bp.id)}
            className="aspect-square rounded-3xl bg-surface border border-border flex flex-col items-center justify-center gap-3 tap-scale hover:border-foreground/20 transition-colors"
          >
            <span className="text-4xl">{bp.emoji}</span>
            <span className="text-base font-medium">{bp.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BodyPartPicker;
