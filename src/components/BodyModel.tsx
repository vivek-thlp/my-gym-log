import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import type { Muscle } from "@/lib/exercises";

interface Props {
  intensity: Partial<Record<Muscle, number>>;
}

/* ---------- color ramp ---------- */
const colorForIntensity = (v: number): THREE.Color => {
  const c = new THREE.Color();
  if (v <= 0.001) c.setHSL(0, 0, 0.32); // resting muscle tone
  else if (v < 0.5) {
    const t = v / 0.5;
    c.setHSL(0.58, 0.55, 0.32 + t * 0.18);
  } else {
    const t = (v - 0.5) / 0.5;
    const hue = 0.58 - t * 0.55;
    c.setHSL(hue, 0.85, 0.5 + t * 0.08);
  }
  return c;
};

/* ---------- helpers ---------- */
const useMuscleMaterial = (intensity: number) =>
  useMemo(() => {
    const color = colorForIntensity(intensity);
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.05,
      emissive: color.clone().multiplyScalar(intensity > 0.3 ? 0.18 : 0),
    });
  }, [intensity]);

interface MProps {
  intensity: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  geometry?: THREE.BufferGeometry;
}

/* Sculpted muscle blob — organic ellipsoid */
const MuscleBlob = ({ intensity, position, rotation, scale = 1 }: MProps) => {
  const mat = useMuscleMaterial(intensity);
  return (
    <mesh position={position} rotation={rotation} scale={scale} material={mat} castShadow>
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  );
};

/* Skin / base body parts */
const skinMat = (l = 0.28) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.06, 0.25, l),
    roughness: 0.75,
    metalness: 0.02,
  });

/* ---------- the human ---------- */
const HumanFigure = ({ intensity }: Props) => {
  const group = useRef<THREE.Group>(null);
  const get = (m: Muscle) => intensity[m] ?? 0;

  useFrame((_, delta) => {
    if (group.current && !group.current.userData.touched) {
      group.current.rotation.y += delta * 0.18;
    }
  });

  const skinDark = useMemo(() => skinMat(0.18), []);
  const skinMid = useMemo(() => skinMat(0.26), []);

  return (
    <group
      ref={group}
      position={[0, -0.9, 0]}
      onPointerDown={() => {
        if (group.current) group.current.userData.touched = true;
      }}
    >
      {/* HEAD — egg shape */}
      <mesh position={[0, 3.3, 0]} material={skinMid} scale={[0.9, 1.05, 0.95]}>
        <sphereGeometry args={[0.34, 48, 48]} />
      </mesh>
      {/* Jaw */}
      <mesh position={[0, 3.05, 0.05]} material={skinMid} scale={[0.7, 0.5, 0.8]}>
        <sphereGeometry args={[0.3, 32, 32]} />
      </mesh>
      {/* NECK */}
      <mesh position={[0, 2.78, 0]} material={skinMid}>
        <cylinderGeometry args={[0.16, 0.22, 0.28, 24]} />
      </mesh>

      {/* TRAPEZIUS — diamond on upper back/shoulders */}
      <MuscleBlob intensity={get("traps")} position={[0, 2.62, -0.05]} scale={[0.55, 0.18, 0.32]} />
      <MuscleBlob intensity={get("traps")} position={[-0.28, 2.55, 0]} scale={[0.22, 0.14, 0.25]} rotation={[0, 0, -0.3]} />
      <MuscleBlob intensity={get("traps")} position={[0.28, 2.55, 0]} scale={[0.22, 0.14, 0.25]} rotation={[0, 0, 0.3]} />

      {/* TORSO BASE — tapered V-shape (skin) */}
      <mesh position={[0, 1.95, 0]} material={skinDark} scale={[1.05, 1, 0.55]}>
        <sphereGeometry args={[0.7, 48, 48]} />
      </mesh>
      <mesh position={[0, 1.3, 0]} material={skinDark} scale={[0.85, 0.7, 0.48]}>
        <sphereGeometry args={[0.65, 48, 48]} />
      </mesh>

      {/* PECTORALS — upper */}
      <MuscleBlob intensity={get("chest_upper")} position={[-0.27, 2.27, 0.38]} scale={[0.34, 0.13, 0.18]} rotation={[0, 0, 0.15]} />
      <MuscleBlob intensity={get("chest_upper")} position={[0.27, 2.27, 0.38]} scale={[0.34, 0.13, 0.18]} rotation={[0, 0, -0.15]} />
      {/* PECTORALS — lower (the main pec mass) */}
      <MuscleBlob intensity={get("chest_lower")} position={[-0.3, 2.0, 0.42]} scale={[0.4, 0.22, 0.22]} rotation={[0, 0.1, 0.1]} />
      <MuscleBlob intensity={get("chest_lower")} position={[0.3, 2.0, 0.42]} scale={[0.4, 0.22, 0.22]} rotation={[0, -0.1, -0.1]} />

      {/* RECTUS ABDOMINIS — six pack (3 rows × 2) */}
      {[0, 1, 2].map((row) =>
        [-1, 1].map((side) => (
          <MuscleBlob
            key={`abs-${row}-${side}`}
            intensity={get("abs")}
            position={[side * 0.13, 1.62 - row * 0.22, 0.46 - row * 0.02]}
            scale={[0.13, 0.1, 0.07]}
          />
        ))
      )}
      {/* Lower abs */}
      <MuscleBlob intensity={get("abs")} position={[0, 0.93, 0.42]} scale={[0.27, 0.12, 0.08]} />

      {/* OBLIQUES — flank slopes */}
      <MuscleBlob intensity={get("obliques")} position={[-0.48, 1.4, 0.18]} scale={[0.13, 0.42, 0.27]} rotation={[0, 0, 0.18]} />
      <MuscleBlob intensity={get("obliques")} position={[0.48, 1.4, 0.18]} scale={[0.13, 0.42, 0.27]} rotation={[0, 0, -0.18]} />
      {/* Serratus accents */}
      <MuscleBlob intensity={get("obliques")} position={[-0.46, 1.85, 0.3]} scale={[0.08, 0.07, 0.1]} />
      <MuscleBlob intensity={get("obliques")} position={[0.46, 1.85, 0.3]} scale={[0.08, 0.07, 0.1]} />

      {/* LATISSIMUS DORSI — wings */}
      <MuscleBlob intensity={get("lats")} position={[-0.55, 2.0, -0.1]} scale={[0.18, 0.55, 0.4]} rotation={[0, 0, 0.12]} />
      <MuscleBlob intensity={get("lats")} position={[0.55, 2.0, -0.1]} scale={[0.18, 0.55, 0.4]} rotation={[0, 0, -0.12]} />

      {/* RHOMBOIDS / mid-back */}
      <MuscleBlob intensity={get("rhomboids")} position={[-0.18, 2.15, -0.4]} scale={[0.22, 0.32, 0.07]} />
      <MuscleBlob intensity={get("rhomboids")} position={[0.18, 2.15, -0.4]} scale={[0.22, 0.32, 0.07]} />

      {/* LOWER BACK — erector spinae columns */}
      <MuscleBlob intensity={get("lower_back")} position={[-0.13, 1.45, -0.4]} scale={[0.13, 0.4, 0.08]} />
      <MuscleBlob intensity={get("lower_back")} position={[0.13, 1.45, -0.4]} scale={[0.13, 0.4, 0.08]} />

      {/* DELTOIDS — three heads each shoulder */}
      {/* Front delts */}
      <MuscleBlob intensity={get("front_delts")} position={[-0.66, 2.38, 0.18]} scale={[0.18, 0.2, 0.18]} />
      <MuscleBlob intensity={get("front_delts")} position={[0.66, 2.38, 0.18]} scale={[0.18, 0.2, 0.18]} />
      {/* Side / lateral delts — the cap */}
      <MuscleBlob intensity={get("side_delts")} position={[-0.78, 2.32, 0]} scale={[0.2, 0.24, 0.22]} />
      <MuscleBlob intensity={get("side_delts")} position={[0.78, 2.32, 0]} scale={[0.2, 0.24, 0.22]} />
      {/* Rear delts */}
      <MuscleBlob intensity={get("rear_delts")} position={[-0.66, 2.38, -0.18]} scale={[0.18, 0.2, 0.18]} />
      <MuscleBlob intensity={get("rear_delts")} position={[0.66, 2.38, -0.18]} scale={[0.18, 0.2, 0.18]} />

      {/* UPPER ARMS — biceps (front bulge) */}
      <MuscleBlob intensity={get("biceps")} position={[-0.85, 1.92, 0.1]} scale={[0.13, 0.28, 0.16]} rotation={[0, 0, 0.1]} />
      <MuscleBlob intensity={get("biceps")} position={[0.85, 1.92, 0.1]} scale={[0.13, 0.28, 0.16]} rotation={[0, 0, -0.1]} />
      {/* TRICEPS — back of arm horseshoe */}
      <MuscleBlob intensity={get("triceps")} position={[-0.86, 1.92, -0.13]} scale={[0.14, 0.32, 0.16]} rotation={[0, 0, 0.1]} />
      <MuscleBlob intensity={get("triceps")} position={[0.86, 1.92, -0.13]} scale={[0.14, 0.32, 0.16]} rotation={[0, 0, -0.1]} />
      {/* Inner upper-arm filler (skin) */}
      <mesh position={[-0.85, 1.92, 0]} material={skinMid} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.12, 0.42, 12, 20]} />
      </mesh>
      <mesh position={[0.85, 1.92, 0]} material={skinMid} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.12, 0.42, 12, 20]} />
      </mesh>

      {/* FOREARMS — flexor mass */}
      <MuscleBlob intensity={get("forearms")} position={[-0.92, 1.3, 0.05]} scale={[0.13, 0.3, 0.13]} rotation={[0, 0, 0.05]} />
      <MuscleBlob intensity={get("forearms")} position={[0.92, 1.3, 0.05]} scale={[0.13, 0.3, 0.13]} rotation={[0, 0, -0.05]} />
      {/* Lower forearm taper */}
      <mesh position={[-0.95, 0.95, 0]} material={skinMid}>
        <capsuleGeometry args={[0.09, 0.25, 12, 20]} />
      </mesh>
      <mesh position={[0.95, 0.95, 0]} material={skinMid}>
        <capsuleGeometry args={[0.09, 0.25, 12, 20]} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.98, 0.7, 0.05]} material={skinMid} scale={[0.7, 1, 0.4]}>
        <sphereGeometry args={[0.13, 24, 24]} />
      </mesh>
      <mesh position={[0.98, 0.7, 0.05]} material={skinMid} scale={[0.7, 1, 0.4]}>
        <sphereGeometry args={[0.13, 24, 24]} />
      </mesh>

      {/* HIPS / PELVIS (skin) */}
      <mesh position={[0, 0.7, 0]} material={skinDark} scale={[0.95, 0.55, 0.6]}>
        <sphereGeometry args={[0.6, 48, 48]} />
      </mesh>

      {/* GLUTES — round cheeks */}
      <MuscleBlob intensity={get("glutes")} position={[-0.22, 0.6, -0.3]} scale={[0.27, 0.27, 0.24]} />
      <MuscleBlob intensity={get("glutes")} position={[0.22, 0.6, -0.3]} scale={[0.27, 0.27, 0.24]} />

      {/* QUADRICEPS — front thigh, with rectus femoris ridge */}
      <MuscleBlob intensity={get("quads")} position={[-0.27, 0.05, 0.14]} scale={[0.22, 0.5, 0.2]} />
      <MuscleBlob intensity={get("quads")} position={[0.27, 0.05, 0.14]} scale={[0.22, 0.5, 0.2]} />
      {/* Vastus lateralis (outer quad sweep) */}
      <MuscleBlob intensity={get("quads")} position={[-0.42, 0.1, 0.1]} scale={[0.1, 0.36, 0.16]} />
      <MuscleBlob intensity={get("quads")} position={[0.42, 0.1, 0.1]} scale={[0.1, 0.36, 0.16]} />

      {/* HAMSTRINGS — back of thigh */}
      <MuscleBlob intensity={get("hamstrings")} position={[-0.27, 0.05, -0.18]} scale={[0.22, 0.45, 0.16]} />
      <MuscleBlob intensity={get("hamstrings")} position={[0.27, 0.05, -0.18]} scale={[0.22, 0.45, 0.16]} />

      {/* ADDUCTORS — inner thigh */}
      <MuscleBlob intensity={get("adductors")} position={[-0.13, 0.1, 0]} scale={[0.1, 0.4, 0.18]} />
      <MuscleBlob intensity={get("adductors")} position={[0.13, 0.1, 0]} scale={[0.1, 0.4, 0.18]} />

      {/* KNEES (skin) */}
      <mesh position={[-0.27, -0.45, 0.05]} material={skinMid}>
        <sphereGeometry args={[0.16, 24, 24]} />
      </mesh>
      <mesh position={[0.27, -0.45, 0.05]} material={skinMid}>
        <sphereGeometry args={[0.16, 24, 24]} />
      </mesh>

      {/* CALVES — gastrocnemius bulge */}
      <MuscleBlob intensity={get("calves")} position={[-0.27, -0.78, -0.1]} scale={[0.16, 0.28, 0.18]} />
      <MuscleBlob intensity={get("calves")} position={[0.27, -0.78, -0.1]} scale={[0.16, 0.28, 0.18]} />
      {/* Soleus lower */}
      <MuscleBlob intensity={get("calves")} position={[-0.27, -1.05, -0.05]} scale={[0.13, 0.18, 0.15]} />
      <MuscleBlob intensity={get("calves")} position={[0.27, -1.05, -0.05]} scale={[0.13, 0.18, 0.15]} />
      {/* Shin (skin front) */}
      <mesh position={[-0.27, -0.85, 0.1]} material={skinMid}>
        <capsuleGeometry args={[0.1, 0.55, 12, 20]} />
      </mesh>
      <mesh position={[0.27, -0.85, 0.1]} material={skinMid}>
        <capsuleGeometry args={[0.1, 0.55, 12, 20]} />
      </mesh>

      {/* ANKLES + FEET */}
      <mesh position={[-0.27, -1.28, 0]} material={skinMid}>
        <sphereGeometry args={[0.11, 16, 16]} />
      </mesh>
      <mesh position={[0.27, -1.28, 0]} material={skinMid}>
        <sphereGeometry args={[0.11, 16, 16]} />
      </mesh>
      <mesh position={[-0.27, -1.4, 0.13]} material={skinMid} scale={[1, 0.7, 1.6]}>
        <sphereGeometry args={[0.13, 20, 20]} />
      </mesh>
      <mesh position={[0.27, -1.4, 0.13]} material={skinMid} scale={[1, 0.7, 1.6]}>
        <sphereGeometry args={[0.13, 20, 20]} />
      </mesh>

      {/* Ground shadow disc */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="black" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

const BodyModel = ({ intensity }: Props) => {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 5.2], fov: 36 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <pointLight position={[0, 1, 4]} intensity={0.5} color={"#6fb3ff"} />
      <pointLight position={[0, 3, -3]} intensity={0.3} color={"#ff8a5b"} />
      <Environment preset="studio" />
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
        target={[0, 0, 0]}
      />
    </Canvas>
  );
};

export default BodyModel;
