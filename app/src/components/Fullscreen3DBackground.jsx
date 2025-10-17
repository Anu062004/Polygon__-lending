import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function Fullscreen3DBackground() {
  const mountRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const visibilityRef = useRef(document.visibilityState)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    // Lights
    scene.add(new THREE.AmbientLight(0x6670ff, 0.45))
    const key = new THREE.PointLight(0x60a5fa, 1.1, 40)
    key.position.set(6, 6, 8)
    scene.add(key)
    const fill = new THREE.PointLight(0x7c3aed, 0.9, 40)
    fill.position.set(-6, -4, -6)
    scene.add(fill)

    // Polygon (icosahedron) with neon/glass look
    const baseGeom = new THREE.IcosahedronGeometry(2.2, 0)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#93c5fd'),
      transmission: 0.85,
      thickness: 0.8,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.0,
      transparent: true,
      opacity: 0.95
    })
    const solid = new THREE.Mesh(baseGeom, glassMat)
    scene.add(solid)

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, opacity: 0.16, transparent: true })
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.22, 0), wireMat)
    scene.add(wire)

    // Vignette plane to improve text legibility
    const vignetteGeo = new THREE.PlaneGeometry(40, 40)
    const vignetteMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color('#0b1020') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv; 
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv; uniform vec3 uColor; 
        void main(){
          float d = distance(vUv, vec2(0.5));
          float alpha = smoothstep(0.9, 0.45, d);
          gl_FragColor = vec4(uColor, 0.55 * alpha);
        }
      `
    })
    const vignette = new THREE.Mesh(vignetteGeo, vignetteMat)
    vignette.position.z = -6
    scene.add(vignette)

    // Resize handler for full-viewport
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    // Pointer parallax
    const onPointerMove = (e) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      mouseRef.current.x = (x - 0.5) * 2
      mouseRef.current.y = (y - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    // Pause when tab hidden
    const onVisibility = () => { visibilityRef.current = document.visibilityState }
    document.addEventListener('visibilitychange', onVisibility)

    const clock = new THREE.Clock()
    let raf
    const animate = () => {
      if (visibilityRef.current === 'visible') {
        const t = clock.getElapsedTime()
        solid.rotation.y += 0.003
        solid.rotation.x = Math.sin(t * 0.25) * 0.08
        wire.rotation.copy(solid.rotation)

        // Parallax tilt
        const tx = mouseRef.current.y * -0.2
        const ty = mouseRef.current.x * 0.3
        solid.rotation.x += (tx - solid.rotation.x) * 0.04
        solid.rotation.y += (ty - solid.rotation.y) * 0.04
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      el.removeChild(renderer.domElement)
      renderer.dispose()
      baseGeom.dispose()
      vignetteGeo.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-20"
      aria-hidden="true"
    />
  )
}


