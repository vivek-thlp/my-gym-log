import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useFBX, Center, Bounds, Html } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BODY_PARTS, BodyPartId } from "@/lib/bodyParts";

interface Hotspot {
  id: BodyPartId;
  label: string;
  // position in normalized model space (model is centered & scaled to ~height 3)
  pos: [number, number, number];
  radius: number;
}

// Hotspots tuned for a standing male body, height ~3 units, centered at origin.
const HOTSPOTS: Hotspot[] = [
  { id: "chest", label: "Chest", pos: [0, 0.55, 0.32], radius: 0.32 },
  { id: "shoulders", label: "Shoulders", pos: [0.45, 0.75, 0.05], radius: 0.22 },
  { id: "arms", label: "Arms", pos: [0.6, 0.25, 0.05], radius: 0.28 },
  { id: "core", label: "Core", pos: [0, 0.15, 0.32], radius: 0.28 },
  { id: "back", label: "Back", pos: [0, 0.5, -0.32], radius: 0.4 },
  { id: "legs", label: "Legs", pos: [0.18, -0.55, 0.05], radius: 0.35 },
  { id: "cardio", label: "Cardio", pos: [-0.45, 0.55, 0.05], radius: 0.18 },
  { id: "full-body", label: "Full Body", pos: [0, 1.35, 0], radius: 0.28 },
];

interface ModelProps {
  active: BodyPartId | null;
  hover: BodyPartId | null;
  onPick: (id: BodyPartId) => void;
  onHover: (id: BodyPartId | null) => void;
}

const BodyMesh = () => {
  const fbx = useFBX("/models/male_body.fbx");

  const cloned = useMemo(() => {
    const obj = fbx.clone(true);
    // Compute bounding box & normalize size + center
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 3;
    const scale = targetHeight / (size.y || 1);
    obj.scale.setScalar(scale);
    obj.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    // Apply a clean PBR-ish material so theme works
    obj.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#3a3f48"),
          roughness: 0.65,
          metalness: 0.15,
        });
      }
    });
    return obj;
  }, [fbx]);

  return <primitive object={cloned} />;
};

const Hotspots = ({ active, hover, onPick, onHover }: ModelProps) => {
  const primary = useMemo(() => {
    if (typeof window === "undefined") return new THREE.Color("#c8f24a");
    const p = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "73 91% 58%";
    return new THREE.Color(`hsl(${p.replace(/\s+/g, ", ")})`);
  }, []);

  return (
    <group>
      {HOTSPOTS.map((h) => {
        const isActive = active === h.id;
        const isHover = hover === h.id;
        const visible = isActive || isHover;
        return (
          <mesh
            key={h.id}
            position={h.pos}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover(h.id);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              onHover(null);
              document.body.style.cursor = "auto";
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onPick(h.id);
            }}
          >
            <sphereGeometry args={[h.radius, 24, 24]} />
            <meshStandardMaterial
              color={primary}
              emissive={primary}
              emissiveIntensity={isActive ? 1.2 : isHover ? 0.6 : 0}
              transparent
              opacity={visible ? (isActive ? 0.55 : 0.25) : 0.001}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const Loader = () => (
  <Html center>
    <div className="text-xs text-muted-foreground">Loading model…</div>
  </Html>
);

interface Props {
  onSelect: (id: string) => void;
}

const BodyModel3D = ({ onSelect }: Props) => {
  const [active, setActive] = useState<BodyPartId | null>(null);
  const [hover, setHover] = useState<BodyPartId | null>(null);

  const activePart = active ? BODY_PARTS.find((b) => b.id === active) : null;

  return (
    <div className="animate-fade-in -mx-5">
      <div className="px-5 mb-2">
        <p className="text-sm text-muted-foreground font-medium">Today</p>
        <h2 className="text-3xl font-semibold tracking-tight mt-1">
          What are you training?
        </h2>
        <p className="text-xs text-muted-foreground mt-2">
          Drag to rotate · pinch / scroll to zoom · tap a muscle to select
        </p>
      </div>

      <div className="relative h-[60vh] min-h-[420px] w-full">
        <Canvas
          shadows
          camera={{ position: [0, 0.4, 4.5], fov: 38 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 4, 5]} intensity={1.1} castShadow />
          <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#88aaff" />
          <pointLight position={[0, 1, 3]} intensity={0.4} />

          <Suspense fallback={<Loader />}>
            <BodyMesh />
            <Hotspots
              active={active}
              hover={hover}
              onPick={setActive}
              onHover={setHover}
            />
          </Suspense>

          <OrbitControls
            enablePan={false}
            minDistance={2.2}
            maxDistance={8}
            target={[0, 0, 0]}
            makeDefault
          />
        </Canvas>
      </div>

      <div className="px-5 mt-2 flex flex-col items-center gap-3">
        <div className="text-center min-h-[2.5rem]">
          {activePart ? (
            <>
              <h3 className="text-2xl font-semibold tracking-tight">
                {activePart.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tap “Train” to start logging
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hover
                ? BODY_PARTS.find((b) => b.id === hover)?.label
                : "Tap a muscle on the model"}
            </p>
          )}
        </div>

        <button
          onClick={() => activePart && onSelect(activePart.id)}
          disabled={!activePart}
          className="w-full max-w-xs h-12 rounded-full bg-primary text-primary-foreground font-semibold tap-scale hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {activePart ? `Train ${activePart.label}` : "Select a muscle"}
        </button>
      </div>
    </div>
  );
};

// Preload model
useFBX.preload("/models/male_body.fbx");

export default BodyModel3D;
