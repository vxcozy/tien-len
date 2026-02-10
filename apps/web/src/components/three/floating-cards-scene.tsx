'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Card face data — rank + suit + color
const CARD_FACES = [
  { rank: 'A', suit: '♠', color: '#1a1a2e' },
  { rank: 'K', suit: '♥', color: '#e11d48' },
  { rank: 'Q', suit: '♦', color: '#e11d48' },
  { rank: 'J', suit: '♣', color: '#1a1a2e' },
  { rank: '2', suit: '♥', color: '#e11d48' },
  { rank: '10', suit: '♠', color: '#1a1a2e' },
  { rank: '7', suit: '♦', color: '#e11d48' },
  { rank: '5', suit: '♣', color: '#1a1a2e' },
  { rank: '3', suit: '♠', color: '#1a1a2e' },
  { rank: '9', suit: '♥', color: '#e11d48' },
];

/**
 * Creates a canvas texture for a playing card face
 */
function createCardFaceTexture(rank: string, suit: string, suitColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // White card background with very slight warm tint
  ctx.fillStyle = '#faf8f3';
  ctx.beginPath();
  ctx.roundRect(0, 0, 256, 384, 16);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = '#d4d0c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(2, 2, 252, 380, 14);
  ctx.stroke();

  // Top-left rank
  ctx.fillStyle = suitColor;
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(rank, 16, 50);

  // Top-left suit (smaller, below rank)
  ctx.font = '32px system-ui, sans-serif';
  ctx.fillText(suit, 18, 84);

  // Center suit (large)
  ctx.font = '100px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(suit, 128, 220);

  // Bottom-right rank (rotated 180)
  ctx.save();
  ctx.translate(256, 384);
  ctx.rotate(Math.PI);
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(rank, 16, 50);
  ctx.font = '32px system-ui, sans-serif';
  ctx.fillText(suit, 18, 84);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a card back texture — deep maroon with diamond pattern
 */
function createCardBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Dark maroon base
  ctx.fillStyle = '#7b2d3b';
  ctx.beginPath();
  ctx.roundRect(0, 0, 256, 384, 16);
  ctx.fill();

  // Inner border
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(12, 12, 232, 360, 10);
  ctx.stroke();

  // Diamond pattern
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 260; x += 20) {
    for (let y = 0; y < 390; y += 20) {
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x, y + 8);
      ctx.lineTo(x - 8, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Center decoration — gold circle
  ctx.beginPath();
  ctx.arc(128, 192, 40, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.arc(128, 192, 28, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A single floating card that drifts and flips
 */
function FloatingCard({ index, total }: { index: number; total: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cardData = CARD_FACES[index % CARD_FACES.length];

  // Randomized orbital parameters (stable per card via useMemo)
  const params = useMemo(() => ({
    // Position in a loose ring
    angle: (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.8,
    radius: 2.5 + Math.random() * 2.5,
    height: (Math.random() - 0.5) * 3,
    // Motion speeds
    orbitSpeed: 0.05 + Math.random() * 0.08,
    floatSpeed: 0.3 + Math.random() * 0.4,
    floatAmp: 0.3 + Math.random() * 0.3,
    // Flip timing
    flipSpeed: 0.15 + Math.random() * 0.2,
    flipOffset: Math.random() * Math.PI * 2,
    // Tilt
    tiltX: (Math.random() - 0.5) * 0.4,
    tiltZ: (Math.random() - 0.5) * 0.3,
    // Initial flip state — some start face-down
    startFlipped: Math.random() > 0.5,
  }), [index, total]);

  // Create textures
  const frontTexture = useMemo(
    () => createCardFaceTexture(cardData.rank, cardData.suit, cardData.color),
    [cardData],
  );
  const backTexture = useMemo(() => createCardBackTexture(), []);

  // Materials for front and back faces
  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#faf8f3', roughness: 0.9 }), // right edge
    new THREE.MeshStandardMaterial({ color: '#faf8f3', roughness: 0.9 }), // left edge
    new THREE.MeshStandardMaterial({ color: '#faf8f3', roughness: 0.9 }), // top edge
    new THREE.MeshStandardMaterial({ color: '#faf8f3', roughness: 0.9 }), // bottom edge
    new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.5 }), // front
    new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.4 }), // back
  ], [frontTexture, backTexture]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Slow orbit
    const angle = params.angle + t * params.orbitSpeed;
    meshRef.current.position.x = Math.cos(angle) * params.radius;
    meshRef.current.position.z = Math.sin(angle) * params.radius - 2;

    // Gentle float up/down
    meshRef.current.position.y = params.height + Math.sin(t * params.floatSpeed) * params.floatAmp;

    // Slow flip — smoothly rotates around Y axis
    const flipAngle = t * params.flipSpeed + params.flipOffset;
    meshRef.current.rotation.y = flipAngle;

    // Gentle tilt
    meshRef.current.rotation.x = params.tiltX + Math.sin(t * 0.2 + index) * 0.1;
    meshRef.current.rotation.z = params.tiltZ + Math.cos(t * 0.15 + index) * 0.08;
  });

  return (
    <mesh ref={meshRef} material={materials}>
      <boxGeometry args={[0.7, 1.0, 0.01]} />
    </mesh>
  );
}

/**
 * Subtle gold dust particles
 */
function GoldDust({ count = 30 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    return { positions: pos };
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.001;
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
        size={0.04}
        color="#ffd700"
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

export function FloatingCardsScene() {
  const cardCount = 10;

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.45 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={0.7} color="#fff8e7" />
        <pointLight position={[-3, 2, 3]} intensity={0.3} color="#ffd700" />

        {Array.from({ length: cardCount }, (_, i) => (
          <FloatingCard key={i} index={i} total={cardCount} />
        ))}

        <GoldDust count={25} />
      </Canvas>
    </div>
  );
}
