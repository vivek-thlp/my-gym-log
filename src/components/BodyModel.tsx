import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Muscle } from "@/lib/exercises";

interface Props {
  /** 0–1 intensity per muscle, normalized */
  intensity: Partial<Record<Muscle, number>>;
}

// Map intensity (0–1) → HSL color: dark gray → accent blue → hot orange/red.
const colorForIntensity = (v: number): THREE.Color => {
  const c = new THREE.Color();
  if (v <= 0.001) {
    c.setHSL(0, 0, 0.18); // muted dark
  } else if (v < 0.5) {
    // dark → blue accent
    const t = v / 0.5;
    c.setHSL(0.58, 0.6, 0.2 + t * 0.25);
  } else {
    // blue → orange/red hot
    const t = (v - 0.5) / 0.5;
    const hue = 0.58 - t * 0.55; // 0.58 (blue) → 0.03 (red-orange)
    c.setHSL(hue, 0.85, 0.45 + t * 0.1);
  }
  return c;
};

interface MeshProps {
  intensity: Partial<Record<Muscle, number>>;
}

const HumanFigure = ({ intensity }: MeshProps) => {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // gentle idle spin only when user not interacting handled by OrbitControls dampening
    if (group.current && !group.current.userData.touched) {
      group.current.rotation.y += delta * 0.15;
    }
  });

  const get = (m: Muscle) => intensity[m] ?? 0;

  // Skin / neutral material for non-muscle parts
  const skin = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0, 0, 0.14), roughness: 0.7, metalness: 0.05 }),
    []
  );

  // Memoized muscle materials
  const mat = (m: Muscle) =>
    new THREE.MeshStandardMaterial({
      color: colorForIntensity(get(m)),
      roughness: 0.55,
      metalness: 0.1,
      emissive: colorForIntensity(get(m)).clone().multiplyScalar(get(m) > 0.3 ? 0.25 : 0),
    });

  return (
    <group
      ref={group}
      position={[0, -0.2, 0]}
      onPointerDown={() => {
        if (group.current) group.current.userData.touched = true;
      }}
    >
      {/* HEAD */}
      <mesh position={[0, 2.55, 0]} material={skin}>
        <sphereGeometry args={[0.32, 32, 32]} />
      </mesh>
      {/* NECK */}
      <mesh position={[0, 2.18, 0]} material={skin}>
        <cylinderGeometry args={[0.13, 0.16, 0.2, 16]} />
      </mesh>

      {/* TRAPS - top of shoulders */}
      <mesh position={[0, 2.0, -0.05]} material={mat("traps")}>
        <boxGeometry args={[0.7, 0.18, 0.35]} />
      </mesh>

      {/* TORSO BASE (skin behind muscles) */}
      <mesh position={[0, 1.45, 0]} material={skin}>
        <boxGeometry args={[0.95, 1.15, 0.55]} />
      </mesh>

      {/* CHEST UPPER */}
      <mesh position={[-0.22, 1.85, 0.28]} material={mat("chest_upper")}>
        <boxGeometry args={[0.36, 0.22, 0.08]} />
      </mesh>
      <mesh position={[0.22, 1.85, 0.28]} material={mat("chest_upper")}>
        <boxGeometry args={[0.36, 0.22, 0.08]} />
      </mesh>
      {/* CHEST LOWER */}
      <mesh position={[-0.22, 1.62, 0.28]} material={mat("chest_lower")}>
        <boxGeometry args={[0.36, 0.28, 0.09]} />
      </mesh>
      <mesh position={[0.22, 1.62, 0.28]} material={mat("chest_lower")}>
        <boxGeometry args={[0.36, 0.28, 0.09]} />
      </mesh>

      {/* ABS - 6-pack tiles */}
      {[0, 1, 2].map((row) =>
        [-1, 1].map((side) => (
          <mesh
            key={`abs-${row}-${side}`}
            position={[side * 0.13, 1.35 - row * 0.22, 0.29]}
            material={mat("abs")}
          >
            <boxGeometry args={[0.22, 0.18, 0.06]} />
          </mesh>
        ))
      )}
      {/* OBLIQUES */}
      <mesh position={[-0.45, 1.2, 0.18]} material={mat("obliques")} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.12, 0.55, 0.32]} />
      </mesh>
      <mesh position={[0.45, 1.2, 0.18]} material={mat("obliques")} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.12, 0.55, 0.32]} />
      </mesh>

      {/* LATS - sides of upper back */}
      <mesh position={[-0.5, 1.65, -0.05]} material={mat("lats")}>
        <boxGeometry args={[0.14, 0.7, 0.45]} />
      </mesh>
      <mesh position={[0.5, 1.65, -0.05]} material={mat("lats")}>
        <boxGeometry args={[0.14, 0.7, 0.45]} />
      </mesh>

      {/* RHOMBOIDS - mid back */}
      <mesh position={[0, 1.75, -0.3]} material={mat("rhomboids")}>
        <boxGeometry args={[0.55, 0.4, 0.06]} />
      </mesh>
      {/* LOWER BACK */}
      <mesh position={[0, 1.15, -0.3]} material={mat("lower_back")}>
        <boxGeometry args={[0.55, 0.4, 0.06]} />
      </mesh>

      {/* SHOULDERS - delts (3 heads each side) */}
      {/* Front delts */}
      <mesh position={[-0.55, 1.95, 0.14]} material={mat("front_delts")}>
        <sphereGeometry args={[0.16, 24, 24]} />
      </mesh>
      <mesh position={[0.55, 1.95, 0.14]} material={mat("front_delts")}>
        <sphereGeometry args={[0.16, 24, 24]} />
      </mesh>
      {/* Side delts */}
      <mesh position={[-0.62, 1.92, 0]} material={mat("side_delts")}>
        <sphereGeometry args={[0.17, 24, 24]} />
      </mesh>
      <mesh position={[0.62, 1.92, 0]} material={mat("side_delts")}>
        <sphereGeometry args={[0.17, 24, 24]} />
      </mesh>
      {/* Rear delts */}
      <mesh position={[-0.55, 1.95, -0.14]} material={mat("rear_delts")}>
        <sphereGeometry args={[0.16, 24, 24]} />
      </mesh>
      <mesh position={[0.55, 1.95, -0.14]} material={mat("rear_delts")}>
        <sphereGeometry args={[0.16, 24, 24]} />
      </mesh>

      {/* UPPER ARMS - biceps (front) and triceps (back) */}
      <mesh position={[-0.7, 1.55, 0.1]} material={mat("biceps")}>
        <capsuleGeometry args={[0.12, 0.4, 8, 16]} />
      </mesh>
      <mesh position={[0.7, 1.55, 0.1]} material={mat("biceps")}>
        <capsuleGeometry args={[0.12, 0.4, 8, 16]} />
      </mesh>
      <mesh position={[-0.7, 1.55, -0.12]} material={mat("triceps")}>
        <capsuleGeometry args={[0.12, 0.4, 8, 16]} />
      </mesh>
      <mesh position={[0.7, 1.55, -0.12]} material={mat("triceps")}>
        <capsuleGeometry args={[0.12, 0.4, 8, 16]} />
      </mesh>

      {/* FOREARMS */}
      <mesh position={[-0.72, 1.0, 0]} material={mat("forearms")}>
        <capsuleGeometry args={[0.1, 0.45, 8, 16]} />
      </mesh>
      <mesh position={[0.72, 1.0, 0]} material={mat("forearms")}>
        <capsuleGeometry args={[0.1, 0.45, 8, 16]} />
      </mesh>
      {/* hands */}
      <mesh position={[-0.72, 0.7, 0]} material={skin}>
        <sphereGeometry args={[0.1, 16, 16]} />
      </mesh>
      <mesh position={[0.72, 0.7, 0]} material={skin}>
        <sphereGeometry args={[0.1, 16, 16]} />
      </mesh>

      {/* HIPS / GLUTES */}
      <mesh position={[0, 0.75, 0]} material={skin}>
        <boxGeometry args={[0.85, 0.35, 0.5]} />
      </mesh>
      <mesh position={[-0.22, 0.7, -0.22]} material={mat("glutes")}>
        <sphereGeometry args={[0.22, 24, 24]} />
      </mesh>
      <mesh position={[0.22, 0.7, -0.22]} material={mat("glutes")}>
        <sphereGeometry args={[0.22, 24, 24]} />
      </mesh>

      {/* THIGHS - quads (front) and hamstrings (back) */}
      <mesh position={[-0.22, 0.25, 0.08]} material={mat("quads")}>
        <capsuleGeometry args={[0.18, 0.55, 8, 16]} />
      </mesh>
      <mesh position={[0.22, 0.25, 0.08]} material={mat("quads")}>
        <capsuleGeometry args={[0.18, 0.55, 8, 16]} />
      </mesh>
      <mesh position={[-0.22, 0.25, -0.1]} material={mat("hamstrings")}>
        <capsuleGeometry args={[0.16, 0.55, 8, 16]} />
      </mesh>
      <mesh position={[0.22, 0.25, -0.1]} material={mat("hamstrings")}>
        <capsuleGeometry args={[0.16, 0.55, 8, 16]} />
      </mesh>
      {/* ADDUCTORS - inner thigh */}
      <mesh position={[0, 0.3, 0]} material={mat("adductors")}>
        <boxGeometry args={[0.18, 0.5, 0.18]} />
      </mesh>

      {/* KNEES (skin) */}
      <mesh position={[-0.22, -0.2, 0]} material={skin}>
        <sphereGeometry args={[0.16, 16, 16]} />
      </mesh>
      <mesh position={[0.22, -0.2, 0]} material={skin}>
        <sphereGeometry args={[0.16, 16, 16]} />
      </mesh>

      {/* CALVES */}
      <mesh position={[-0.22, -0.55, -0.05]} material={mat("calves")}>
        <capsuleGeometry args={[0.14, 0.45, 8, 16]} />
      </mesh>
      <mesh position={[0.22, -0.55, -0.05]} material={mat("calves")}>
        <capsuleGeometry args={[0.14, 0.45, 8, 16]} />
      </mesh>
      {/* Shins (skin front) */}
      <mesh position={[-0.22, -0.55, 0.08]} material={skin}>
        <capsuleGeometry args={[0.1, 0.45, 8, 16]} />
      </mesh>
      <mesh position={[0.22, -0.55, 0.08]} material={skin}>
        <capsuleGeometry args={[0.1, 0.45, 8, 16]} />
      </mesh>

      {/* FEET */}
      <mesh position={[-0.22, -1.0, 0.1]} material={skin}>
        <boxGeometry args={[0.2, 0.1, 0.4]} />
      </mesh>
      <mesh position={[0.22, -1.0, 0.1]} material={skin}>
        <boxGeometry args={[0.2, 0.1, 0.4]} />
      </mesh>
    </group>
  );
};

const BodyModel = ({ intensity }: Props) => {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 5], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      <pointLight position={[0, 1, 3]} intensity={0.4} color={"#5fa8ff"} />
      <HumanFigure intensity={intensity} />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
};

export default BodyModel;
