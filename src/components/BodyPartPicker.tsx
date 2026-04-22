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
        {BODY_PARTS.map((bp, i) => (
          <button
            key={bp.id}
            onClick={() => onSelect(bp.id)}
            style={{ animationDelay: `${i * 40}ms` }}
            className="group relative aspect-square rounded-3xl bg-surface border border-border overflow-hidden flex flex-col items-center justify-end p-4 tap-scale transition-all duration-300 hover:border-foreground/30 hover:bg-surface-elevated animate-scale-in opacity-0 [animation-fill-mode:forwards]"
          >
            <img
              src={bp.image}
              alt={bp.label}
              loading="lazy"
              width={512}
              height={512}
              className="absolute inset-0 w-full h-full object-contain p-3 opacity-90 transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <span className="relative text-sm font-medium tracking-tight z-10">
              {bp.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BodyPartPicker;
