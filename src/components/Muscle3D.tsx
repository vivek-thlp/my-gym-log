import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type Highlight =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "full-body";

interface Props {
  highlight: Highlight;
  spinning?: boolean;
}

// Read primary color from CSS var (HSL "h s% l%")
const useThemeColors = () => {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return { primary: new THREE.Color("#c8f24a"), base: new THREE.Color("#1a1a1a") };
    }
    const root = getComputedStyle(document.documentElement);
    const p = root.getPropertyValue("--primary").trim() || "73 91% 58%";
    const primary = new THREE.Color(`hsl(${p.replace(/\s+/g, ", ")})`);
    return { primary, base: new THREE.Color("#141414") };
  }, []);
};

interface PartProps {
  active: boolean;
  primary: THREE.Color;
  base: THREE.Color;
}

const Part = ({
  active,
  primary,
  base,
  children,
  ...rest
}: PartProps & React.ComponentProps<"mesh"> & { children: React.ReactNode }) => {
  return (
    <mesh {...rest} castShadow receiveShadow>
      {children}
      <meshStandardMaterial
        color={active ? primary : base}
        emissive={active ? primary : new THREE.Color("#000000")}
        emissiveIntensity={active ? 0.9 : 0}
        roughness={active ? 0.3 : 0.55}
        metalness={active ? 0.4 : 0.2}
      />
    </mesh>
  );
};

const Figure = ({ highlight, spinning = true }: Props) => {
  const group = useRef<THREE.Group>(null);
  const { primary, base } = useThemeColors();

  useFrame((_, dt) => {
    if (group.current && spinning) group.current.rotation.y += dt * 0.4;
  });

  const isFull = highlight === "full-body" || highlight === "cardio";
  const on = (k: Highlight) => isFull || highlight === k;

  return (
    <group ref={group} position={[0, -0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 2.15, 0]} castShadow>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color={base} roughness={0.6} metalness={0.15} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.78, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.25, 16]} />
        <meshStandardMaterial color={base} roughness={0.6} />
      </mesh>

      {/* Torso base */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.95, 1.1, 0.55]} />
        <meshStandardMaterial color={base} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Chest (pecs) */}
      <Part active={on("chest")} primary={primary} base={base} position={[-0.24, 1.45, 0.3]}>
        <sphereGeometry args={[0.28, 24, 24]} />
      </Part>
      <Part active={on("chest")} primary={primary} base={base} position={[0.24, 1.45, 0.3]}>
        <sphereGeometry args={[0.28, 24, 24]} />
      </Part>

      {/* Abs (core) - 6 pack */}
      {[0, 1, 2].map((row) => (
        <group key={row}>
          <Part
            active={on("core")}
            primary={primary}
            base={base}
            position={[-0.14, 1.05 - row * 0.22, 0.3]}
          >
            <boxGeometry args={[0.2, 0.18, 0.12]} />
          </Part>
          <Part
            active={on("core")}
            primary={primary}
            base={base}
            position={[0.14, 1.05 - row * 0.22, 0.3]}
          >
            <boxGeometry args={[0.2, 0.18, 0.12]} />
          </Part>
        </group>
      ))}

      {/* Back (lats) - shown on back side */}
      <Part active={on("back")} primary={primary} base={base} position={[-0.32, 1.2, -0.3]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.35, 0.9, 0.2]} />
      </Part>
      <Part active={on("back")} primary={primary} base={base} position={[0.32, 1.2, -0.3]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.35, 0.9, 0.2]} />
      </Part>

      {/* Shoulders (deltoids) */}
      <Part active={on("shoulders")} primary={primary} base={base} position={[-0.6, 1.55, 0]}>
        <sphereGeometry args={[0.27, 24, 24]} />
      </Part>
      <Part active={on("shoulders")} primary={primary} base={base} position={[0.6, 1.55, 0]}>
        <sphereGeometry args={[0.27, 24, 24]} />
      </Part>

      {/* Upper arms (biceps/triceps) */}
      <Part active={on("arms")} primary={primary} base={base} position={[-0.7, 1.05, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.18, 0.55, 8, 16]} />
      </Part>
      <Part active={on("arms")} primary={primary} base={base} position={[0.7, 1.05, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.18, 0.55, 8, 16]} />
      </Part>

      {/* Forearms */}
      <Part active={on("arms")} primary={primary} base={base} position={[-0.78, 0.4, 0]}>
        <capsuleGeometry args={[0.14, 0.5, 8, 16]} />
      </Part>
      <Part active={on("arms")} primary={primary} base={base} position={[0.78, 0.4, 0]}>
        <capsuleGeometry args={[0.14, 0.5, 8, 16]} />
      </Part>

      {/* Hips */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.85, 0.35, 0.5]} />
        <meshStandardMaterial color={base} roughness={0.6} />
      </mesh>

      {/* Thighs (quads) */}
      <Part active={on("legs")} primary={primary} base={base} position={[-0.22, -0.2, 0.05]}>
        <capsuleGeometry args={[0.22, 0.7, 8, 16]} />
      </Part>
      <Part active={on("legs")} primary={primary} base={base} position={[0.22, -0.2, 0.05]}>
        <capsuleGeometry args={[0.22, 0.7, 8, 16]} />
      </Part>

      {/* Calves */}
      <Part active={on("legs")} primary={primary} base={base} position={[-0.22, -1.0, 0]}>
        <capsuleGeometry args={[0.17, 0.55, 8, 16]} />
      </Part>
      <Part active={on("legs")} primary={primary} base={base} position={[0.22, -1.0, 0]}>
        <capsuleGeometry args={[0.17, 0.55, 8, 16]} />
      </Part>

      {/* Feet */}
      <mesh position={[-0.22, -1.45, 0.1]}>
        <boxGeometry args={[0.2, 0.12, 0.36]} />
        <meshStandardMaterial color={base} />
      </mesh>
      <mesh position={[0.22, -1.45, 0.1]}>
        <boxGeometry args={[0.2, 0.12, 0.36]} />
        <meshStandardMaterial color={base} />
      </mesh>
    </group>
  );
};

const Muscle3D = ({ highlight, spinning = true }: Props) => {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.6], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#88aaff" />
      <pointLight position={[0, 1, 3]} intensity={0.6} />
      <Suspense fallback={null}>
        <Figure highlight={highlight} spinning={spinning} />
      </Suspense>
    </Canvas>
  );
};

export default Muscle3D;
