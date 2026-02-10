'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Chinese/Vietnamese-style serpentine dragon built from primitives.
 * Long sinuous body, big horns, whiskers, dorsal spikes, and fire breath.
 */
function Dragon({ position, scale = 1, speed = 1, color, accent }: {
  position: [number, number, number];
  scale?: number;
  speed?: number;
  color: string;
  accent: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodySegments = useRef<THREE.Mesh[]>([]);
  const fireRef = useRef<THREE.Group>(null);

  const bodyMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    }),
    [color],
  );

  const bellyMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    }),
    [accent],
  );

  const eyeMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: '#ffd700',
      emissive: '#ff8c00',
      emissiveIntensity: 1.2,
    }),
    [],
  );

  const hornMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: '#d4a574',
      roughness: 0.3,
      metalness: 0.4,
    }),
    [],
  );

  const fireMat = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: '#ff4500',
      emissive: '#ff6600',
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.7,
    }),
    [],
  );

  const addBodyRef = useCallback((el: THREE.Mesh | null, idx: number) => {
    if (el) bodySegments.current[idx] = el;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;

    if (groupRef.current) {
      // Serpentine swimming motion through air
      groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.4;
      groupRef.current.position.x = position[0] + Math.sin(t * 0.3) * 0.8;
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.2;
    }

    // Undulate body segments like a snake
    bodySegments.current.forEach((seg, i) => {
      if (seg) {
        const wave = Math.sin(t * 2 + i * 0.8) * 0.12;
        seg.position.y = wave;
        seg.rotation.z = Math.sin(t * 1.5 + i * 0.6) * 0.15;
      }
    });

    // Flicker fire breath
    if (fireRef.current) {
      fireRef.current.scale.setScalar(0.8 + Math.sin(t * 8) * 0.3);
      fireRef.current.rotation.z = Math.sin(t * 6) * 0.2;
    }
  });

  // Body segment positions along a curve (12 segments for a long serpentine body)
  const segments = useMemo(() => {
    const segs = [];
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      segs.push({
        x: -2.4 + t * 4.8,  // spread along x-axis
        radius: 0.18 - Math.abs(t - 0.35) * 0.12, // thicker in middle, tapers at ends
      });
    }
    return segs;
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* === SERPENTINE BODY === */}
      {segments.map((seg, i) => (
        <mesh
          key={`body-${i}`}
          ref={(el) => addBodyRef(el, i)}
          position={[seg.x, 0, 0]}
          material={bodyMat}
        >
          <sphereGeometry args={[seg.radius, 10, 10]} />
        </mesh>
      ))}

      {/* Belly stripe (lighter underbelly along body) */}
      {segments.slice(1, 10).map((seg, i) => (
        <mesh
          key={`belly-${i}`}
          position={[seg.x, -seg.radius * 0.6, 0]}
          material={bellyMat}
        >
          <sphereGeometry args={[seg.radius * 0.5, 8, 8]} />
        </mesh>
      ))}

      {/* === DRAGON HEAD === */}
      <group position={[2.4, 0, 0]}>
        {/* Main head - elongated */}
        <mesh material={bodyMat} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.45, 0.28, 0.32]} />
        </mesh>

        {/* Upper jaw / snout */}
        <mesh position={[0.3, 0.04, 0]} material={bodyMat} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[0.3, 0.14, 0.24]} />
        </mesh>

        {/* Lower jaw */}
        <mesh position={[0.25, -0.1, 0]} material={bodyMat} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.25, 0.08, 0.2]} />
        </mesh>

        {/* Nostrils */}
        <mesh position={[0.46, 0.08, 0.06]} material={eyeMat}>
          <sphereGeometry args={[0.025, 6, 6]} />
        </mesh>
        <mesh position={[0.46, 0.08, -0.06]} material={eyeMat}>
          <sphereGeometry args={[0.025, 6, 6]} />
        </mesh>

        {/* Eyes - big and glowing */}
        <mesh position={[0.12, 0.15, 0.16]} material={eyeMat}>
          <sphereGeometry args={[0.055, 8, 8]} />
        </mesh>
        <mesh position={[0.12, 0.15, -0.16]} material={eyeMat}>
          <sphereGeometry args={[0.055, 8, 8]} />
        </mesh>

        {/* Eye pupils */}
        <mesh position={[0.15, 0.16, 0.19]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#1a0000" />
        </mesh>
        <mesh position={[0.15, 0.16, -0.19]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#1a0000" />
        </mesh>

        {/* Eyebrow ridges */}
        <mesh position={[0.08, 0.22, 0.13]} material={bodyMat} rotation={[0.3, 0, 0.4]}>
          <boxGeometry args={[0.18, 0.04, 0.08]} />
        </mesh>
        <mesh position={[0.08, 0.22, -0.13]} material={bodyMat} rotation={[-0.3, 0, 0.4]}>
          <boxGeometry args={[0.18, 0.04, 0.08]} />
        </mesh>

        {/* HORNS - big curved antler-style (Vietnamese dragon) */}
        <mesh position={[-0.05, 0.3, 0.1]} material={hornMat} rotation={[0.4, 0.3, -0.8]}>
          <coneGeometry args={[0.04, 0.45, 6]} />
        </mesh>
        <mesh position={[-0.05, 0.3, -0.1]} material={hornMat} rotation={[-0.4, -0.3, -0.8]}>
          <coneGeometry args={[0.04, 0.45, 6]} />
        </mesh>
        {/* Horn branch tips */}
        <mesh position={[-0.15, 0.55, 0.18]} material={hornMat} rotation={[0.6, 0.4, -0.3]}>
          <coneGeometry args={[0.02, 0.2, 5]} />
        </mesh>
        <mesh position={[-0.15, 0.55, -0.18]} material={hornMat} rotation={[-0.6, -0.4, -0.3]}>
          <coneGeometry args={[0.02, 0.2, 5]} />
        </mesh>

        {/* Whiskers (Vietnamese dragon feature!) */}
        <mesh position={[0.35, -0.02, 0.12]} rotation={[0.2, 0.5, -0.3]}>
          <cylinderGeometry args={[0.008, 0.003, 0.5, 4]} />
          <meshStandardMaterial color={accent} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.35, -0.02, -0.12]} rotation={[-0.2, -0.5, -0.3]}>
          <cylinderGeometry args={[0.008, 0.003, 0.5, 4]} />
          <meshStandardMaterial color={accent} transparent opacity={0.7} />
        </mesh>

        {/* Mane/beard tufts under chin */}
        {[0, 1, 2].map(i => (
          <mesh key={`beard-${i}`} position={[0.1 - i * 0.1, -0.18, 0]} material={bellyMat} rotation={[0, 0, 0.3 + i * 0.15]}>
            <coneGeometry args={[0.03, 0.15, 5]} />
          </mesh>
        ))}

        {/* FIRE BREATH */}
        <group ref={fireRef} position={[0.55, 0, 0]}>
          {[0, 1, 2, 3, 4].map(i => (
            <mesh
              key={`fire-${i}`}
              position={[i * 0.12, Math.sin(i * 1.2) * 0.04, Math.cos(i * 1.5) * 0.03]}
              material={fireMat}
            >
              <sphereGeometry args={[0.06 - i * 0.008, 6, 6]} />
            </mesh>
          ))}
          {/* Inner bright core */}
          <mesh position={[0.1, 0, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffdd00" emissiveIntensity={3} transparent opacity={0.9} />
          </mesh>
        </group>
      </group>

      {/* === DORSAL SPIKES along the spine === */}
      {segments.slice(0, 10).map((seg, i) => (
        <mesh
          key={`spike-${i}`}
          position={[seg.x, seg.radius * 0.8, 0]}
          material={bodyMat}
          rotation={[0, 0, -0.2 + (i * 0.03)]}
        >
          <coneGeometry args={[0.025, 0.1 + (i < 5 ? i * 0.015 : (9 - i) * 0.015), 4]} />
        </mesh>
      ))}

      {/* === LEGS (4 small legs, Vietnamese/Chinese dragon style) === */}
      {/* Front legs */}
      <group position={[1.2, -0.15, 0]}>
        <mesh position={[0, -0.08, 0.15]} material={bodyMat} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.025, 0.2, 6]} />
        </mesh>
        <mesh position={[0, -0.08, -0.15]} material={bodyMat} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.025, 0.2, 6]} />
        </mesh>
        {/* Claws */}
        <mesh position={[0.02, -0.2, 0.18]} material={hornMat} rotation={[0.5, 0, 0.3]}>
          <coneGeometry args={[0.02, 0.06, 4]} />
        </mesh>
        <mesh position={[0.02, -0.2, -0.18]} material={hornMat} rotation={[-0.5, 0, 0.3]}>
          <coneGeometry args={[0.02, 0.06, 4]} />
        </mesh>
      </group>

      {/* Back legs */}
      <group position={[-0.8, -0.15, 0]}>
        <mesh position={[0, -0.08, 0.13]} material={bodyMat} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.18, 6]} />
        </mesh>
        <mesh position={[0, -0.08, -0.13]} material={bodyMat} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.02, 0.18, 6]} />
        </mesh>
        {/* Claws */}
        <mesh position={[0.02, -0.19, 0.16]} material={hornMat} rotation={[0.5, 0, 0.3]}>
          <coneGeometry args={[0.018, 0.05, 4]} />
        </mesh>
        <mesh position={[0.02, -0.19, -0.16]} material={hornMat} rotation={[-0.5, 0, 0.3]}>
          <coneGeometry args={[0.018, 0.05, 4]} />
        </mesh>
      </group>

      {/* === TAIL END — pointed with fin === */}
      <group position={[-2.6, 0, 0]}>
        <mesh material={bodyMat} rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.08, 0.5, 6]} />
        </mesh>
        {/* Tail fin/tuft */}
        <mesh position={[-0.2, 0.1, 0]} material={bellyMat} rotation={[0, 0, 0.8]}>
          <coneGeometry args={[0.06, 0.2, 4]} />
        </mesh>
        <mesh position={[-0.15, 0.15, 0.05]} material={bellyMat} rotation={[0.3, 0, 1.0]}>
          <coneGeometry args={[0.04, 0.15, 4]} />
        </mesh>
        <mesh position={[-0.15, 0.15, -0.05]} material={bellyMat} rotation={[-0.3, 0, 1.0]}>
          <coneGeometry args={[0.04, 0.15, 4]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Floating sparkle particles for magical atmosphere
 */
function Sparkles({ count = 50 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return { positions: pos };
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.001;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffd700"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Floating embers / fire particles that drift upward
 */
function Embers({ count = 15 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return { positions: pos };
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        // Drift upward slowly
        positions[i * 3 + 1] += 0.005;
        // Gentle sway
        positions[i * 3] += Math.sin(state.clock.elapsedTime + i * 2) * 0.002;
        // Reset when too high
        if (positions[i * 3 + 1] > 5) {
          positions[i * 3 + 1] = -5;
          positions[i * 3] = (Math.random() - 0.5) * 10;
        }
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ff6b35"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Clouds of mist / smoke for atmosphere
 */
function MistOrbs({ count = 6 }: { count?: number }) {
  const orbs = useMemo(() =>
    Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        -2 - Math.random() * 3,
      ] as [number, number, number],
      speed: 0.2 + Math.random() * 0.3,
      size: 0.3 + Math.random() * 0.4,
    })),
    [count],
  );

  return (
    <>
      {orbs.map((orb, i) => (
        <Float key={i} speed={orb.speed} floatIntensity={0.3} rotationIntensity={0.1}>
          <mesh position={orb.position}>
            <sphereGeometry args={[orb.size, 12, 12]} />
            <meshStandardMaterial
              color="#ffd700"
              transparent
              opacity={0.04}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export function DragonScene() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.55 }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffd700" />
        <pointLight position={[-4, 3, 3]} intensity={0.5} color="#ff6b35" />
        <pointLight position={[4, -2, 2]} intensity={0.3} color="#ff4500" />

        {/* Main dragon — large red Vietnamese serpentine dragon */}
        <Dragon
          position={[-1.5, 1.5, -1]}
          scale={0.65}
          speed={0.7}
          color="#c0392b"
          accent="#f0c040"
        />

        {/* Second smaller dragon in background */}
        <Dragon
          position={[2.5, -1.5, -3]}
          scale={0.4}
          speed={1.0}
          color="#8b1a1a"
          accent="#e8a030"
        />

        {/* Magical sparkles */}
        <Sparkles count={50} />

        {/* Rising embers */}
        <Embers count={20} />

        {/* Misty atmosphere orbs */}
        <MistOrbs count={8} />
      </Canvas>
    </div>
  );
}
