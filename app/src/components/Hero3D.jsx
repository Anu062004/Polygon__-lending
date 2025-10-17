import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function Hero3D() {
  const mountRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const mountEl = mountRef.current
    if (!mountEl) return

    const width = mountEl.clientWidth
    const height = mountEl.clientHeight
    let isPointerDown = false

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0a0a0f, 10, 28)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.4, 6)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mountEl.appendChild(renderer.domElement)

    // Lighting: soft neon + rim light
    const ambient = new THREE.AmbientLight(0x8890ff, 0.5)
    scene.add(ambient)

    const dir1 = new THREE.DirectionalLight(0x7c3aed, 1.1)
    dir1.position.set(3, 4, 5)
    scene.add(dir1)

    const dir2 = new THREE.DirectionalLight(0x22d3ee, 0.9)
    dir2.position.set(-3, -2, -4)
    scene.add(dir2)

    // Geometry: dodecahedron with glass-like material
    const geometry = new THREE.DodecahedronGeometry(1.2, 0)
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#93c5fd'),
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.85, // glass
      thickness: 0.6,
      transparent: true,
      opacity: 0.95,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      sheen: 0.4,
      sheenColor: new THREE.Color('#a78bfa'),
      envMapIntensity: 1.0
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = false
    scene.add(mesh)

    // Subtle inner neon wireframe for accent
    const wire = new THREE.Mesh(new THREE.DodecahedronGeometry(1.205, 0), new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    }))
    scene.add(wire)

    // Background plane with gradient
    const bgGeom = new THREE.PlaneGeometry(20, 12)
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color('#0b1020') },
        uColor2: { value: new THREE.Color('#1e293b') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        void main() {
          vec3 col = mix(uColor1, uColor2, vUv.y);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false
    })
    const bg = new THREE.Mesh(bgGeom, bgMat)
    bg.position.z = -6
    scene.add(bg)

    // Mouse parallax/tilt
    const updateFromClient = (clientX, clientY) => {
      const rect = mountEl.getBoundingClientRect()
      const x = (clientX - rect.left) / rect.width
      const y = (clientY - rect.top) / rect.height
      mouseRef.current.x = (x - 0.5) * 2
      mouseRef.current.y = (y - 0.5) * 2
    }

    const onPointerMove = (e) => {
      // On touch devices, only update while dragging; on mouse, always update
      if (e.pointerType === 'mouse' || isPointerDown) {
        updateFromClient(e.clientX, e.clientY)
      }
    }
    const onPointerDown = (e) => {
      isPointerDown = true
      try { mountEl.setPointerCapture(e.pointerId) } catch {}
      updateFromClient(e.clientX, e.clientY)
    }
    const onPointerUp = (e) => {
      isPointerDown = false
      try { mountEl.releasePointerCapture(e.pointerId) } catch {}
    }
    const onPointerLeave = () => { isPointerDown = false }

    mountEl.addEventListener('pointermove', onPointerMove, { passive: true })
    mountEl.addEventListener('pointerdown', onPointerDown)
    mountEl.addEventListener('pointerup', onPointerUp)
    mountEl.addEventListener('pointercancel', onPointerUp)
    mountEl.addEventListener('pointerleave', onPointerLeave)

    // Resize handling
    const onResize = () => {
      const w = mountEl.clientWidth
      const h = mountEl.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    let rafId
    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime()
      // Base slow rotation
      mesh.rotation.y += 0.0035
      mesh.rotation.x = Math.sin(t * 0.3) * 0.1
      wire.rotation.copy(mesh.rotation)

      // Parallax tilt toward mouse
      const targetRotX = mouseRef.current.y * -0.25
      const targetRotY = mouseRef.current.x * 0.35
      mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.04
      mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.04

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      mountEl.removeEventListener('pointermove', onPointerMove)
      mountEl.removeEventListener('pointerdown', onPointerDown)
      mountEl.removeEventListener('pointerup', onPointerUp)
      mountEl.removeEventListener('pointercancel', onPointerUp)
      mountEl.removeEventListener('pointerleave', onPointerLeave)
      mountEl.removeChild(renderer.domElement)
      renderer.dispose()
      geometry.dispose()
      bgGeom.dispose()
    }
  }, [])

  return (
    <div
      className="relative w-full h-[340px] md:h-[420px] lg:h-[520px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/60 via-indigo-950/60 to-slate-900/60 shadow-xl border border-white/10 cursor-grab active:cursor-grabbing"
      ref={mountRef}
      style={{ touchAction: 'none' }}
      aria-label="Interactive rotating polygon"
    />
  )
}


