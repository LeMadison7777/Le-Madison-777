import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT =
  typeof window !== "undefined"
    ? window.innerWidth < 768
      ? 500
      : window.innerWidth < 1024
      ? 1100
      : 2200
    : 2200;

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));

  const { positions, originals } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originals = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere distribution
      const t = i / PARTICLE_COUNT;
      const phi = Math.acos(1 - 2 * t);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.6;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions.set([x, y, z], i * 3);
      originals.set([x, y, z], i * 3);
    }
    return { positions, originals };
  }, []);

  const colors = useMemo(() => {
    const c = new Float32Array(PARTICLE_COUNT * 3);
    const orange = new THREE.Color("#FF5C00");
    const violet = new THREE.Color("#7B2FBE");
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mix = Math.random();
      const col = orange.clone().lerp(violet, mix);
      c.set([col.r, col.g, col.b], i * 3);
    }
    return c;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    mouse.current.lerp(state.pointer, 0.08);

    const breathing = 1 + Math.sin(time * 0.6) * 0.06;
    const geom = ref.current.geometry as THREE.BufferGeometry;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    // mouse vector projected into sphere space
    const mx = mouse.current.x * 2.5;
    const my = mouse.current.y * 2.5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ox = originals[i * 3];
      const oy = originals[i * 3 + 1];
      const oz = originals[i * 3 + 2];

      // liquid noise distortion
      const n =
        Math.sin(ox * 1.8 + time * 0.8) *
        Math.cos(oy * 1.8 + time * 0.6) *
        Math.sin(oz * 1.8 + time * 0.5);
      const wave = 0.12 * n;

      let x = ox * (breathing + wave * 0.3);
      let y = oy * (breathing + wave * 0.3);
      let z = oz * (breathing + wave * 0.3);

      // mouse repulsion in xy plane
      const dx = x - mx;
      const dy = y - my;
      const d2 = dx * dx + dy * dy;
      const influence = Math.exp(-d2 * 1.2) * 0.55;
      x += (dx / (Math.sqrt(d2) + 0.001)) * influence;
      y += (dy / (Math.sqrt(d2) + 0.001)) * influence;

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    pos.needsUpdate = true;

    ref.current.rotation.y = time * 0.06;
    ref.current.rotation.x = Math.sin(time * 0.2) * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

const ParticleSphere = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <Particles />
    </Canvas>
  );
};

export default ParticleSphere;
