// NO UIE Store - Main Application Entry Point

import './style.css'
import { UI } from './components/UI'
import { Pages } from './components/Pages'

class App {
  private ui: UI
  private pages: Pages

  constructor() {
    // Initialize components
    this.pages = new Pages()
    this.ui = new UI((page) => this.navigate(page))

    // Handle routing
    this.handleRouting()
  }

  private handleRouting(): void {
    const route = () => {
      const hash = window.location.hash.replace('#', '') || 'home'

      // Moun ki fèk klike sou yon lyen envitasyon dwe chwazi modpas li anvan
      // tout lòt bagay. Mak la poze nan index.html, anvan supabase-js netwaye
      // URL la.
      let mandeModpas = false
      try {
        mandeModpas = sessionStorage.getItem('nouie_mande_modpas') === '1'
      } catch (e) { /* mòd prive */ }

      if (mandeModpas && hash !== 'modpas') {
        window.location.hash = '#modpas'
        return
      }

      this.navigate(hash)
    }

    window.addEventListener('hashchange', route)
    route()
  }

  private navigate(page: string): void {
    // UI state updates
    this.ui.toggleMenu(false)

    // Render page content
    this.pages.render(page)

    // Reset scroll position to top
    window.scrollTo(0, 0)
  }
}

// Bootstrap application
new App()
