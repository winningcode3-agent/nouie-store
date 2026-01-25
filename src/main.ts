// NO UIE Store - Main Application Entry Point

import './style.css'
import { Scene } from './components/Scene'
import { UI } from './components/UI'
import { Pages } from './components/Pages'

class App {
  private scene: Scene
  private ui: UI
  private pages: Pages
  private currentPage = 'home'

  constructor() {
    const container = document.querySelector('#app')!

    // Initialize components
    this.scene = new Scene(container as HTMLElement)
    this.pages = new Pages()
    this.ui = new UI((page) => this.navigate(page))

    // Setup card click to go to collection
    this.scene.checkProductCardClick(() => {
      if (this.currentPage === 'home') {
        window.location.hash = '#collection'
      }
    })

    // Handle routing
    this.handleRouting()

    // Start animation loop
    this.scene.animate()
  }

  private handleRouting(): void {
    const route = () => {
      const hash = window.location.hash.replace('#', '') || 'home'
      this.navigate(hash)
    }

    window.addEventListener('hashchange', route)
    route()
  }

  private navigate(page: string): void {
    this.currentPage = page

    // Toggle 3D scene visibility
    const isHome = page === 'home'
    this.scene.setVisible(isHome)
    this.ui.setOverlayVisible(isHome)
    this.ui.toggleMenu(false)

    // Render page content
    this.pages.render(page)
  }
}

// Bootstrap application
new App()
