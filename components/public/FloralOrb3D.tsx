"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Sphere, Environment } from "@react-three/drei";
import { type Mesh, type Group } from "three";

function GlassOrb() {
  const mesh = useRef<Mesh>(null);
  const ring1 = useRef<Mesh>(null);
  const ring2 = useRef<Mesh>(null);
  const orbitGroup = useRef<Group>(null);

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.12;
      mesh.current.rotation.x += delta * 0.06;
    }
    if (ring1.current) {
      ring1.current.rotation.z += delta * 0.28;
      ring1.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.55;
    }
    if (ring2.current) {
      ring2.current.rotation.x += delta * 0.2;
      ring2.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.35) * 0.45;
    }
    if (orbitGroup.current) {
      orbitGroup.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      {/* Main glass sphere */}
      <Sphere ref={mesh} args={[1, 64, 64]}>
        <MeshTransmissionMaterial
          color="#f7e8ed"
          roughness={0.02}
          thickness={1.5}
          transmission={0.95}
          chromaticAberration={0.05}
          ior={1.6}
          backside
          distortion={0.3}
          distortionScale={0.4}
          temporalDistortion={0.15}
        />
      </Sphere>

      {/* Ring 1 — main rosa, tilted */}
      <mesh ref={ring1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.55, 0.036, 16, 100]} />
        <meshStandardMaterial color="#C4728A" transparent opacity={0.8} emissive="#C4728A" emissiveIntensity={0.55} />
      </mesh>

      {/* Ring 2 — thinner, perpendicular plane */}
      <mesh ref={ring2} rotation={[Math.PI / 2, Math.PI / 3.5, 0]}>
        <torusGeometry args={[1.92, 0.019, 16, 100]} />
        <meshStandardMaterial color="#e8a0b4" transparent opacity={0.42} emissive="#e8a0b4" emissiveIntensity={0.28} />
      </mesh>

      {/* Ring 3 — very thin outer halo */}
      <mesh rotation={[0.4, 0.8, 0]}>
        <torusGeometry args={[2.25, 0.01, 8, 100]} />
        <meshStandardMaterial color="#f0c8d6" transparent opacity={0.22} emissive="#f0c8d6" emissiveIntensity={0.15} />
      </mesh>

      {/* Orbiting satellites */}
      <group ref={orbitGroup}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const r = 1.68;
          const y = Math.sin(i * 1.3) * 0.55;
          return (
            <mesh key={i} position={[Math.cos(angle) * r, y, Math.sin(angle) * r] as [number, number, number]}>
              <sphereGeometry args={[0.072, 16, 16]} />
              <meshStandardMaterial color="#C4728A" emissive="#C4728A" emissiveIntensity={1.0} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function FloralOrb3D() {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block w-80 h-80 lg:w-96 lg:h-96 xl:w-[460px] xl:h-[460px] opacity-90">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 3]} intensity={2.5} color="#C4728A" />
        <pointLight position={[-2, -2, 2]} intensity={1.2} color="#f7e8ed" />
        <pointLight position={[0, -3, -1]} intensity={0.8} color="#a85a72" />
        <spotLight position={[2, 5, 2]} intensity={2.2} color="#e8c5ce" angle={0.5} penumbra={0.8} />
        <GlassOrb />
      </Canvas>
    </div>
  );
}
