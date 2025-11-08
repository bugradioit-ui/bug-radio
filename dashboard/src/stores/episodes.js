import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useEpisodesStore = defineStore('episodes', {
    state: () => ({
        episodes: [],
        currentEpisode: null,
        loading: false,
        error: null
    }),

    getters: {
        publishedEpisodes: (state) => state.episodes.filter(e => e.status === 'published'),
        draftEpisodes: (state) => state.episodes.filter(e => e.status === 'draft'),
        featuredEpisodes: (state) => state.episodes.filter(e => e.featured),
        
        episodesByShow: (state) => (showId) => 
            state.episodes.filter(e => e.showId._id === showId || e.showId === showId)
    },

    actions: {
        async fetchEpisodes(filters = {}) {
            this.loading = true
            this.error = null
            try {
                const params = new URLSearchParams(filters)
                const response = await axios.get(`${API_URL}/episodes?${params}`)
                this.episodes = response.data
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Errore nel caricamento degli episodi'
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchEpisodeById(id) {
            this.loading = true
            this.error = null
            try {
                const response = await axios.get(`${API_URL}/episodes/${id}`)
                this.currentEpisode = response.data
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Errore nel caricamento dell\'episodio'
                throw error
            } finally {
                this.loading = false
            }
        },

        async createEpisode(episodeData) {
            this.loading = true
            this.error = null
            try {
                const response = await axios.post(`${API_URL}/episodes`, episodeData)
                this.episodes.unshift(response.data)
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Errore nella creazione dell\'episodio'
                throw error
            } finally {
                this.loading = false
            }
        },

        async updateEpisode(id, episodeData) {
            this.loading = true
            this.error = null
            try {
                const response = await axios.put(`${API_URL}/episodes/${id}`, episodeData)
                const index = this.episodes.findIndex(e => e._id === id)
                if (index !== -1) {
                    this.episodes[index] = response.data
                }
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Errore nell\'aggiornamento dell\'episodio'
                throw error
            } finally {
                this.loading = false
            }
        },

        async deleteEpisode(id) {
            this.loading = true
            this.error = null
            try {
                await axios.delete(`${API_URL}/episodes/${id}`)
                this.episodes = this.episodes.filter(e => e._id !== id)
            } catch (error) {
                this.error = error.response?.data?.error || 'Errore nell\'eliminazione dell\'episodio'
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})
