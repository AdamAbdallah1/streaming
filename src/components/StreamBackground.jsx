import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float, Sphere, Environment } from '@react-three/drei'
import * as THREE from 'three'

function DigitalDust({ count = 2000 }) {
  const points = useRef()
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 15
      temp[i * 3 + 1] = (Math.random() - 0.5) * 15
      temp[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return temp
  }, [count])

  useFrame((state, delta) => {
    points.current.rotation.y += delta * 0.04
    points.current.rotation.x += delta * 0.02
  })

  return (
    <Points ref={points} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#3b82f6" // Changed to Blue to match your "Packages" theme
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.4}
      />
    </Points>
  )
}

function TechCore() {
  const mesh = useRef()
  
  useFrame((state) => {
    const { x, y } = state.mouse
    // Smooth mouse follow
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, x * 1.5, 0.05)
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, y * 1.5, 0.05)
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Sphere ref={mesh} args={[1.2, 64, 64]}>
        {/* R3F standard tags (lowercase) - no import needed */}
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0}
          transmission={1} 
          thickness={1}
          envMapIntensity={2}
        />
      </Sphere>
    </Float>
  )
}

export default function StreamBackground() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      zIndex: 0, // Behind the UI but potentially visible
      pointerEvents: 'none' 
    }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={100} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={50} color="#6366f1" />
        
        <Suspense fallback={null}>
          <DigitalDust />
          <TechCore />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  )
}