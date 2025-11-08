import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.role === 'admin',
        isArtist: (state) => state.user?.role === 'artist',
        userName: (state) => state.user?.name || ''
    },

    actions: {
        async register(userData) {
            this.loading = true
            console.log('Registrazione iniziata:', userData)
            this.error = null
            try {
                const response = await axios.post(`${API_URL}/register`, userData)
                console.log('Registrazione completata:', response.data)
                this.token = response.data.token
                this.user = response.data.user
                localStorage.setItem('token', this.token)
                this.setAuthHeader()
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Errore durante la registrazione'
                throw error
            } finally {
                this.loading = false
            }
        },

        async login(credentials) {
            this.loading = true
            this.error = null
            try {
                const response = await axios.post(`${API_URL}/login`, credentials)
                this.token = response.data.token
                this.user = response.data.user
                localStorage.setItem('token', this.token)
                this.setAuthHeader()
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Credenziali non valide'
                throw error
            } finally {
                this.loading = false
            }
        },

        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
        },

        setAuthHeader() {
            if (this.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
            }
        },

        async initAuth() {
            if (this.token) {
                this.setAuthHeader()
                try {
                    const response = await axios.get(`${API_URL}/me`)
                    this.user = response.data
                } catch (error) {
                    // Token non valido, logout
                    this.logout()
                }
            }
        }
    }
})