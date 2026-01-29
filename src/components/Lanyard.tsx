/* eslint-disable react/no-unknown-property */
'use client';

import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

// assets
import cardGLB from '../assets/lanyard/card.glb';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  profileImageUrl?: string;
}

// Preload the GLTF model
useGLTF.preload(cardGLB);

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  profileImageUrl = 'https://picsum.photos/200/300'
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Canvas
      camera={{ position, fov }}
      onCreated={({ gl }) =>
        gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
      }
    >
      <ambientLight intensity={Math.PI} />
      <Suspense fallback={null}>
        <Physics gravity={gravity} interpolate>
          <Band isMobile={isMobile} profileImageUrl={profileImageUrl} />
        </Physics>
      </Suspense>
      <Environment background={false} blur={0.75}>
        <Lightformer
          intensity={2}
          color="white"
          position={[0, -1, 5]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[-1, -1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[1, 1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={10}
          color="white"
          position={[-10, 0, 14]}
          rotation={[0, Math.PI / 2, Math.PI / 3]}
          scale={[100, 10, 1]}
        />
      </Environment>
    </Canvas>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  profileImageUrl?: string;
}

function Band({ maxSpeed = 50, minSpeed = 0, isMobile = false, profileImageUrl }: BandProps) {
  const band = useRef(null);
  const fixed = useRef(null);
  const j1 = useRef(null);
  const j2 = useRef(null);
  const j3 = useRef(null);
  const card = useRef(null);

  const vec = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();

  const segmentProps = {
    colliders: false,
    canSleep: true,
    angularDamping: 4,
    linearDamping: 4
  };

  // Load GLTF and texture
  const gltf = useGLTF(cardGLB);
  const profileTexture = useTexture(profileImageUrl!);

  // Force texture properties and ensure it doesn't preserve aspect ratio
  useEffect(() => {
    if (profileTexture) {
      profileTexture.needsUpdate = true;
    }
  }, [profileTexture]);

  // Safely access nodes and materials
  const nodes = gltf.nodes || {};
  const materials = gltf.materials || {};

  // Dynamic Text Texture - Fixed for Mirroring and Spacing
  const bandTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#bb750d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // Text with proper spacing
      const label = "PAGEPULSE";
      const spacing = 80; // Add spacing between repetitions
      const totalWidth = ctx.measureText(label).width;
      const repeatDistance = totalWidth + spacing;
      
      // Draw enough repetitions to fill the canvas
      const numRepetitions = Math.ceil(canvas.width / repeatDistance) + 2;
      
      for (let i = 0; i < numRepetitions; i++) {
        ctx.fillText(label, i * repeatDistance, 64);
      }
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 16;
    return tex;
  }, []);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ])
  );

  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = dragged ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== 'boolean') {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));

      [card, j1, j2, j3, fixed].forEach(r => r.current?.wakeUp());

      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }

    if (fixed.current && band.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped)
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());

        const d = ref.current.lerped.distanceTo(ref.current.translation());
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + Math.min(1, Math.max(0.1, d)) * (maxSpeed - minSpeed))
        );
      });

      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());

      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      {/* Fixed anchor point at the top */}
      <RigidBody ref={fixed} {...segmentProps} type="fixed" position={[0, 4, 0]} />
      
      {/* Joint segments positioned vertically */}
      <RigidBody position={[0, 3.5, 0]} ref={j1} {...segmentProps}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody position={[0, 3, 0]} ref={j2} {...segmentProps}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody position={[0, 2.5, 0]} ref={j3} {...segmentProps}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      
      {/* Card at the bottom */}
      <RigidBody
        position={[0, 1, 0]}
        ref={card}
        {...segmentProps}
        type={dragged ? 'kinematicPosition' : 'dynamic'}
      >
        <CuboidCollider args={[0.8, 1.125, 0.01]} />
        <group
          scale={2.25}
          position={[0, -1.2, -0.05]}
          onPointerOver={() => hover(true)}
          onPointerOut={() => hover(false)}
          onPointerDown={e => {
            e.target.setPointerCapture(e.pointerId);
            drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
          }}
          onPointerUp={e => {
            e.target.releasePointerCapture(e.pointerId);
            drag(false);
          }}
        >
          {nodes.card && (
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={materials.base?.map}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
          )}
          {nodes.clip && (
            <mesh 
              geometry={nodes.clip.geometry} 
              material={materials.metal} 
              material-roughness={0.3} 
            />
          )}
          {nodes.clamp && (
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          )}
          
          {/* Hide the original profilePicture node with the React logo */}
          {nodes.profilePicture && (
            <mesh
              geometry={nodes.profilePicture.geometry}
              position={nodes.profilePicture.position}
              rotation={nodes.profilePicture.rotation}
              visible={false}
            />
          )}
          
          {/* Front side profile picture - Stretched to exact card dimensions */}
          <mesh position={[0, 0.52, 0.026]}>
            <planeGeometry args={[0.71, 1]} />
            <meshBasicMaterial 
              map={profileTexture} 
              toneMapped={false}
            />
          </mesh>
          
          {/* Back side profile picture - Stretched to exact card dimensions */}
          <mesh position={[0, 0.52, -0.026]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.71, 1]} />
            <meshBasicMaterial 
              map={profileTexture} 
              toneMapped={false}
            />
          </mesh>
        </group>
      </RigidBody>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[window.innerWidth, window.innerHeight]}
          useMap
          map={bandTexture}
          repeat={[-3, 1]}
          lineWidth={isMobile ? 0.5 : 1}
        />
      </mesh>
    </>
  );
}