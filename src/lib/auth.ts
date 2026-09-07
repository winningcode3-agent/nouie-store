import { supabase } from './supabase'

export class Auth {
    /**
     * Attempts to log in an admin user
     */
    static async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    }

    /**
     * Logs out the current user
     */
    static async logout() {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    /**
     * Gets the current session
     */
    static async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession()
        return { session, error }
    }

    /**
     * Checks if a user is authenticated
     */
    static async isAuthenticated() {
        const { session } = await this.getSession()
        return !!session
    }

    /**
     * Checks if the current user has admin privileges
     */
    static async isAdmin(): Promise<boolean> {
        const { session } = await this.getSession()
        if (!session || !session.user || !session.user.email) return false

        try {
            const { data, error } = await supabase
                .from('admins')
                .select('email')
                .eq('email', session.user.email)
                .maybeSingle()

            if (error) {
                // Fallback sou admin@nouie.com si tab la poko aksesib
                return session.user.email === 'admin@nouie.com'
            }
            return !!data
        } catch {
            return session.user.email === 'admin@nouie.com'
        }
    }
}
