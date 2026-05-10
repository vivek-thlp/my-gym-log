import { useEffect, useRef, useState } from "react";
import { BODY_PARTS } from "@/lib/bodyParts";
import Muscle3D from "@/components/Muscle3D";

interface Props {
  onSelect: (id: string) => void;
}

const BodyPartPicker = ({ onSelect }: Props) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Center the initially active item on mount
  useEffect(() => {
    const el = itemRefs.current[0];
    el?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
  }, []);

  // Track which item is closest to center while scrolling
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let raf = 0;
    const update = () => {
      const center = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      setActiveIndex(bestIdx);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToIndex = (i: number) => {
    itemRefs.current[i]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const handleItemClick = (i: number) => {
    if (i === activeIndex) {
      onSelect(BODY_PARTS[i].id);
    } else {
      scrollToIndex(i);
    }
  };

  const active = BODY_PARTS[activeIndex];

  return (
    <div className="animate-fade-in -mx-5">
      <div className="px-5 mb-6">
        <p className="text-sm text-muted-foreground font-medium">Today</p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">
          What are you training?
        </h2>
      </div>

      <div
        ref={scrollerRef}
        className="flex items-center overflow-x-auto snap-x snap-mandatory scrollbar-none px-[25%] gap-4 py-6"
        style={{ scrollPaddingInline: "25%" }}
      >
        {BODY_PARTS.map((bp, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={bp.id}
              ref={(el) => (itemRefs.current[i] = el)}
              className="snap-center shrink-0 w-[55%] flex justify-center"
            >
              <button
                onClick={() => handleItemClick(i)}
                aria-label={bp.label}
                className={`relative aspect-square w-full flex items-center justify-center tap-scale transition-all duration-500 ease-out ${
                  isActive
                    ? "scale-100 opacity-100 drop-shadow-[0_0_30px_hsl(var(--primary)/0.45)]"
                    : "scale-[0.65] opacity-40"
                }`}
              >
                <div className="w-full h-full">
                  <Muscle3D highlight={bp.id as any} spinning={isActive} />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-5 mt-2 flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-2xl font-semibold tracking-tight">{active.label}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {activeIndex + 1} of {BODY_PARTS.length}
          </p>
        </div>

        <button
          onClick={() => onSelect(active.id)}
          className="w-full max-w-xs h-12 rounded-full bg-primary text-primary-foreground font-semibold tap-scale hover:bg-primary/90"
        >
          Train {active.label}
        </button>

        <div className="flex gap-1.5 mt-1">
          {BODY_PARTS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to ${BODY_PARTS[i].label}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BodyPartPicker;
