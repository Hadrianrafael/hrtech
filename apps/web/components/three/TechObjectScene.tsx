'use client';

import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function RotatingObject({ spin }: { spin: boolean }) {
  const group = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!spin || !group.current) return;
    group.current.rotation.y += delta * 0.18;
    group.current.rotation.x += delta * 0.06;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#E92034" flatShading transparent opacity={0.12} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshBasicMaterial color="#FF871F" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[0.4, 0.4, 0]} scale={0.55}>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshBasicMaterial color="#E92034" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export interface TechObjectSceneProps {
  spin: boolean;
}

export default function TechObjectScene({ spin }: TechObjectSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 2, 3]} intensity={40} color="#FF871F" />
      <pointLight position={[-3, -2, -2]} intensity={20} color="#E92034" />
      <RotatingObject spin={spin} />
    </Canvas>
  );
}
