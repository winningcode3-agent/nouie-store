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
    static async isAdmin() {
        const { session } = await this.getSession()
        if (!session || !session.user) return false

        // Whitelist for testing. In production, use database roles or app_metadata.
        const adminEmails = ['test@test.com', 'admin@nouie.com']
        return adminEmails.includes(session.user.email || '')
    }
}
