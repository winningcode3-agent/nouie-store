// Three.js 3D Scene Component

import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { EffectComposer, RenderPass, BloomEffect, EffectPass } from 'postprocessing'
import { collectionImages } from '../lib/data'

export class Scene {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    composer: EffectComposer
    tunnel: THREE.Group
    font: any = null
    scrollPos = 0
    targetScrollPos = 0
    mouse = new THREE.Vector2()
    logoGroup: THREE.Group | null = null
    productCards: THREE.Group[] = []
    particles: THREE.Points | null = null
    cardTextures: THREE.Texture[] = []
    raycaster = new THREE.Raycaster()
    private rotationInterval: ReturnType<typeof setInterval> | null = null

    constructor(container: HTMLElement) {
        // Scene setup
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x0a0a0a)
        this.scene.fog = new THREE.Fog(0x000000, 5, 50)

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.camera.position.z = 5

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(this.renderer.domElement)

        // Post-processing
        this.composer = new EffectComposer(this.renderer)
        this.composer.addPass(new RenderPass(this.scene, this.camera))
        const bloom = new BloomEffect({
            intensity: 0.4,
            luminanceThreshold: 0.1,
            luminanceSmoothing: 0.9,
            mipmapBlur: true
        })
        this.composer.addPass(new EffectPass(this.camera, bloom))

        // Tunnel group
        this.tunnel = new THREE.Group()
        this.scene.add(this.tunnel)

        // Initialize all elements
        this.initLights()
        this.initFloor()
        this.initTunnel()
        this.initParticles()
        this.initLogo()
        this.initProductCards()
        this.addEventListeners()
    }

    private initLights(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
        this.scene.add(ambientLight)

        const mainSpot = new THREE.SpotLight(0xffffff, 90, 80, Math.PI / 3, 0.5)
        mainSpot.position.set(0, 10, 5)
        mainSpot.target.position.set(0, 0, -10)
        this.scene.add(mainSpot)
        this.scene.add(mainSpot.target)

        const backSpot = new THREE.PointLight(0xffffff, 50, 60)
        backSpot.position.set(0, 5, -25)
        this.scene.add(backSpot)

        const coldLight = new THREE.PointLight(0xCCE6FF, 30, 80)
        coldLight.position.set(0, 2, -15)
        this.scene.add(coldLight)
    }

    private initFloor(): void {
        const floorWidth = 40
        const floorDepth = 100
        const geometry = new THREE.PlaneGeometry(floorWidth, floorDepth, 40, 40)

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#0a0a0a'
        ctx.fillRect(0, 0, 512, 512)
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 2
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                ctx.strokeRect(i * 64, j * 64, 64, 64)
                if ((i + j) % 2 === 0) {
                    ctx.fillStyle = '#111'
                    ctx.fillRect(i * 64, j * 64, 64, 64)
                }
            }
        }

        const floorTex = new THREE.CanvasTexture(canvas)
        floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping
        floorTex.repeat.set(8, 20)

        const material = new THREE.MeshStandardMaterial({
            map: floorTex,
            roughness: 0.1,
            metalness: 0.8,
        })

        const floor = new THREE.Mesh(geometry, material)
        floor.rotation.x = -Math.PI / 2
        floor.position.y = -3
        floor.position.z = -30
        this.scene.add(floor)
    }

    private initTunnel(): void {
        const wallGeo = new THREE.BoxGeometry(25, 15, 100)
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.7,
            side: THREE.BackSide
        })
        const tunnelMesh = new THREE.Mesh(wallGeo, wallMat)
        tunnelMesh.position.z = -40
        this.tunnel.add(tunnelMesh)

        for (let i = 0; i < 15; i++) {
            const columnGeo = new THREE.BoxGeometry(0.5, 10, 0.5)
            const columnMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })

            const leftCol = new THREE.Mesh(columnGeo, columnMat)
            leftCol.position.set(-6, 0, -i * 6)
            this.tunnel.add(leftCol)

            const rightCol = new THREE.Mesh(columnGeo, columnMat)
            rightCol.position.set(6, 0, -i * 6)
            this.tunnel.add(rightCol)
        }
    }

    private initParticles(): void {
        const particleCount = 2000
        const geometry = new THREE.BufferGeometry()
        const pos = new Float32Array(particleCount * 3)

        for (let i = 0; i < particleCount * 3; i += 3) {
            pos[i] = (Math.random() - 0.5) * 50
            pos[i + 1] = (Math.random() - 0.5) * 20
            pos[i + 2] = (Math.random() - 0.5) * 100
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))

        const material = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x444444,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        })

        this.particles = new THREE.Points(geometry, material)
        this.scene.add(this.particles)
    }

    private initLogo(): void {
        this.logoGroup = new THREE.Group()
        this.scene.add(this.logoGroup)

        const loader = new FontLoader()
        loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            this.font = font
            this.updateLogo()
        })
    }

    updateLogo(): void {
        if (!this.font || !this.logoGroup) return
        this.logoGroup.clear()

        const isMobile = window.innerWidth < 768
        const logoSize = isMobile ? 0.7 : 1.2
        const subtitleSize = isMobile ? 0.1 : 0.15
        const depth = isMobile ? 0.2 : 0.3
        const lineSpacing = isMobile ? 0.8 : 1.3
        const xOffset = isMobile ? 0.5 : 1.0

        this.createText('NO', logoSize, depth, lineSpacing / 2 + 0.5, 1, -xOffset)
        this.createText('UIE', logoSize, depth, -lineSpacing / 2 + 0.5, 1, xOffset)
        this.createSharpText('NO U TURN', subtitleSize, 0.05, -lineSpacing - 0.2, 1, 0)
        this.addSubtitleBars(-lineSpacing - 0.2)
    }

    private createSharpText(text: string, size: number, depth: number, yOffset: number, opacity = 1, xOffset = 0): void {
        if (!this.font || !this.logoGroup) return

        const geometry = new TextGeometry(text, {
            font: this.font, size, depth,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
        })
        geometry.center()

        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = yOffset
        mesh.position.x = xOffset
        this.logoGroup.add(mesh)
    }

    private addSubtitleBars(y: number): void {
        const barWidth = 1.8
        const barHeight = 0.02
        const offset = 1.2
        const geometry = new THREE.PlaneGeometry(barWidth, barHeight)
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })

        const leftBar = new THREE.Mesh(geometry, material)
        leftBar.position.set(-offset - barWidth / 2, y, 0)
        this.logoGroup?.add(leftBar)

        const rightBar = new THREE.Mesh(geometry, material)
        rightBar.position.set(offset + barWidth / 2, y, 0)
        this.logoGroup?.add(rightBar)
    }

    private createText(text: string, size: number, depth: number, yOffset: number, opacity = 1, xOffset = 0): void {
        if (!this.font || !this.logoGroup) return

        const geometry = new TextGeometry(text, {
            font: this.font, size, depth,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
        })
        geometry.center()

        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = yOffset
        mesh.position.x = xOffset
        this.logoGroup.add(mesh)
    }

    initProductCards(): void {
        const texLoader = new THREE.TextureLoader()
        const isMobile = window.innerWidth < 768

        this.productCards.forEach(c => this.scene.remove(c))
        this.productCards = []
        this.cardTextures = []

        collectionImages.forEach(url => {
            this.cardTextures.push(texLoader.load(url))
        })

        const cardPositions = isMobile ? [
            { x: -1.8, y: 1.0, z: -3.5, rot: 0.1, scale: 1.2 }, // More centered
            { x: 1.8, y: -0.8, z: -4.5, rot: -0.1, scale: 1.1 }  // More centered
        ] : [
            { x: -4.5, y: 1.2, z: -4, rot: 0.15, scale: 1.6 },
            { x: 5.0, y: -0.8, z: -5, rot: -0.12, scale: 1.5 }
        ]

        cardPositions.forEach((pos, i) => {
            const group = new THREE.Group()
            const randomIndex = Math.floor(Math.random() * this.cardTextures.length)
            const tex = this.cardTextures[randomIndex]

            const planeGeo = new THREE.PlaneGeometry(2 * pos.scale, 2.8 * pos.scale)
            const planeMat = new THREE.MeshStandardMaterial({
                map: tex,
                transparent: true,
                opacity: 0.9,
                emissive: 0xffffff,
                emissiveIntensity: 0.15 // Increased base brightness
            })

            const plane = new THREE.Mesh(planeGeo, planeMat)
            plane.userData.isProductCard = true
            plane.userData.cardIndex = i

            // Add a glowing indicator line at the bottom
            const lineGeo = new THREE.PlaneGeometry(2 * pos.scale, 0.05 * pos.scale)
            const lineMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 1.0,
                transparent: true,
                opacity: 0.8
            })
            const line = new THREE.Mesh(lineGeo, lineMat)
            line.position.y = -1.5 * pos.scale
            group.add(line)

            group.add(plane)
            group.position.set(pos.x, pos.y, pos.z)
            group.rotation.y = pos.rot
            group.rotation.z = Math.random() * 0.1 - 0.05

            this.scene.add(group)
            this.productCards.push(group)
        })

        this.startCardRotation()
    }

    private startCardRotation(): void {
        if (this.rotationInterval) clearInterval(this.rotationInterval)

        this.rotationInterval = setInterval(() => {
            this.productCards.forEach(card => {
                const plane = card.children[0] as THREE.Mesh
                const material = plane.material as THREE.MeshStandardMaterial

                const fadeOut = () => {
                    material.opacity -= 0.05
                    if (material.opacity > 0.1) {
                        requestAnimationFrame(fadeOut)
                    } else {
                        const randomIndex = Math.floor(Math.random() * this.cardTextures.length)
                        material.map = this.cardTextures[randomIndex]
                        material.needsUpdate = true
                        fadeIn()
                    }
                }

                const fadeIn = () => {
                    material.opacity += 0.05
                    if (material.opacity < 0.9) {
                        requestAnimationFrame(fadeIn)
                    }
                }

                fadeOut()
            })
        }, 6000)
    }

    private addEventListeners(): void {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight
            if (window.innerWidth < window.innerHeight) {
                this.camera.fov = 75
            } else {
                this.camera.fov = 60
            }
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.composer.setSize(window.innerWidth, window.innerHeight)
            this.updateLogo()
            this.initProductCards()
        })

        window.addEventListener('wheel', (e) => {
            this.targetScrollPos += e.deltaY * 0.01
        })

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
        })
    }

    setVisible(visible: boolean): void {
        this.renderer.domElement.style.display = visible ? 'block' : 'none'
    }

    checkProductCardClick(callback: () => void): void {
        this.renderer.domElement.addEventListener('click', (event: MouseEvent) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

            this.raycaster.setFromCamera(this.mouse, this.camera)
            const intersects = this.raycaster.intersectObjects(this.productCards, true)

            if (intersects.length > 0) {
                callback()
            }
        })

        this.renderer.domElement.addEventListener('mousemove', () => {
            this.raycaster.setFromCamera(this.mouse, this.camera)
            const intersects = this.raycaster.intersectObjects(this.productCards, true)
            this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
        })
    }

    animate(): void {
        requestAnimationFrame(() => this.animate())

        this.scrollPos += (this.targetScrollPos - this.scrollPos) * 0.05

        if (this.tunnel) {
            this.tunnel.position.z = this.scrollPos % 6
        }

        this.productCards.forEach((card, i) => {
            const time = Date.now() * 0.001
            card.position.y += Math.sin(time + i) * 0.002
            card.rotation.z = Math.sin(time * 0.5 + i) * 0.05

            // Pulsing emissive intensity for interactive feel
            const plane = card.children.find(child => (child as any).userData.isProductCard) as THREE.Mesh
            if (plane) {
                const mat = plane.material as THREE.MeshStandardMaterial
                mat.emissiveIntensity = 0.15 + Math.sin(time * 2) * 0.05
            }

            // Pulsing indicator line
            const line = card.children.find(child => !(child as any).userData.isProductCard && child instanceof THREE.Mesh) as THREE.Mesh
            if (line) {
                const mat = line.material as THREE.MeshStandardMaterial
                mat.emissiveIntensity = 0.5 + Math.sin(time * 4) * 0.5
            }
        })

        if (this.logoGroup) {
            this.logoGroup.rotation.y = this.mouse.x * 0.05
            this.logoGroup.rotation.x = -this.mouse.y * 0.03
            this.logoGroup.position.y = Math.sin(Date.now() * 0.001) * 0.05
            this.logoGroup.position.z = Math.min(this.scrollPos * 0.5, 2)
        }

        if (this.particles) {
            this.particles.rotation.y += 0.0002
            this.particles.position.z = (this.scrollPos * 0.2) % 10
        }

        this.composer.render()
    }
}
