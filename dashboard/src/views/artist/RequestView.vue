<template>
  <div class="request-page">
    <div class="request-container">
      <Card class="request-card">
        <template #header>
          <div class="request-header">
            <i class="pi pi-radio-button" style="font-size: 3rem; color: #3b82f6;"></i>
            <h2>Richiedi il tuo Show su BUG Radio</h2>
            <p>Compila tutti i campi per inviare la tua richiesta all'admin</p>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="submitRequest" class="request-form">
            <!-- Informazioni Show -->
            <div class="form-section">
              <h3><i class="pi pi-microphone"></i> Informazioni Show</h3>

              <div class="form-field">
                <label for="title">Titolo Show *</label>
                <InputText
                    id="title"
                    v-model="formData.title"
                    placeholder="Es. Noise Ã  Noise"
                    required
                    class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="description">Descrizione Show *</label>
                <Textarea
                    id="description"
                    v-model="formData.description"
                    rows="6"
                    placeholder="Descrivi il concept del tuo show, il tipo di musica che proporrai, l'atmosfera che vuoi creare..."
                    required
                    class="w-full"
                />
                <small>Spiega nel dettaglio cosa rende unico il tuo show</small>
              </div>

              <div class="form-field">
                <ImageUpload
                    label="Immagine Copertina Show *"
                    v-model="formData.image.url"
                />
              </div>
            </div>

            <!-- Informazioni Artista -->
            <div class="form-section">
              <h3><i class="pi pi-user"></i> Informazioni Artista</h3>

              <div class="form-field">
                <ImageUpload
                    label="Foto Artista"
                    v-model="formData.artist.photo"
                />
                <small>Foto profilo o press photo (opzionale)</small>
              </div>

              <div class="form-field">
                <label for="artistName">Nome Artista/Curatore *</label>
                <InputText
                    id="artistName"
                    v-model="formData.artist.name"
                    placeholder="Il tuo nome o pseudonimo"
                    required
                    class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="artistBio">Biografia Artista *</label>
                <Textarea
                    id="artistBio"
                    v-model="formData.artist.bio"
                    rows="5"
                    placeholder="Racconta la tua esperienza musicale, collaborazioni, progetti passati..."
                    required
                    class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="artistEmail">Email di Contatto *</label>
                <InputText
                    id="artistEmail"
                    v-model="formData.artist.email"
                    type="email"
                    placeholder="tua@email.com"
                    required
                    class="w-full"
                />
              </div>

              <div class="form-field">
                <label>Social Links (opzionali)</label>
                <div class="social-inputs">
                  <InputText
                      v-model="formData.artist.socialLinks.instagram"
                      placeholder="Instagram URL"
                      class="w-full"
                  />
                  <InputText
                      v-model="formData.artist.socialLinks.soundcloud"
                      placeholder="Soundcloud URL"
                      class="w-full"
                  />
                  <InputText
                      v-model="formData.artist.socialLinks.mixcloud"
                      placeholder="Mixcloud URL"
                      class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Generi e Schedule -->
            <div class="form-section">
              <h3><i class="pi pi-tags"></i> Generi Musicali e Programmazione</h3>

              <div class="form-field">
                <label for="genres">Generi Musicali *</label>
                <InputText
                    id="genres"
                    v-model="genresInput"
                    placeholder="Ambient, Experimental, Drone, Techno..."
                    required
                    class="w-full"
                />
                <small>Inserisci i generi separati da virgola (almeno uno)</small>
              </div>

              <div class="form-field">
                <label for="tags">Tags</label>
                <InputText
                    id="tags"
                    v-model="tagsInput"
                    placeholder="underground, live, dj-set..."
                    class="w-full"
                />
                <small>Parole chiave per descrivere il tuo show (opzionale)</small>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="dayOfWeek">Giorno Preferito *</label>
                  <Dropdown
                      id="dayOfWeek"
                      v-model="formData.schedule.dayOfWeek"
                      :options="dayOptions"
                      placeholder="Seleziona giorno"
                      required
                      class="w-full"
                  />
                </div>

                <div class="form-field">
                  <label for="timeSlot">Fascia Oraria *</label>
                  <InputText
                      id="timeSlot"
                      v-model="formData.schedule.timeSlot"
                      placeholder="Es. 20:00 - 22:00"
                      required
                      class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <Button
                  type="button"
                  label="Annulla"
                  severity="secondary"
                  outlined
                  @click="$router.push('/artist/dashboard')"
              />
              <Button
                  type="submit"
                  label="Invia Richiesta"
                  icon="pi pi-send"
                  :loading="loading"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useArtistStore } from '@/stores/artist'
import { useToast } from 'primevue/usetoast'
import ImageUpload from '@/components/ImageUpload.vue'

const router = useRouter()
const artistStore = useArtistStore()
const toast = useToast()
const loading = ref(false)

const formData = ref({
  title: '',
  description: '',
  artist: {
    name: '',
    bio: '',
    email: '',
    photo: '',  // â† Campo foto artista
    socialLinks: {
      instagram: '',
      soundcloud: '',
      mixcloud: ''
    }
  },
  image: {
    url: '',
    alt: ''
  },
  schedule: {
    dayOfWeek: '',
    timeSlot: '',
    frequency: 'weekly'
  }
})

const genresInput = ref('')
const tagsInput = ref('')

const dayOptions = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

const validateForm = () => {
  if (!formData.value.title || !formData.value.description) {
    toast.add({
      severity: 'warn',
      summary: 'Campi mancanti',
      detail: 'Compila titolo e descrizione dello show',
      life: 3000
    })
    return false
  }

  if (!formData.value.artist.name || !formData.value.artist.bio || !formData.value.artist.email) {
    toast.add({
      severity: 'warn',
      summary: 'Campi mancanti',
      detail: 'Compila tutte le informazioni artista',
      life: 3000
    })
    return false
  }

  if (!formData.value.image.url) {
    toast.add({
      severity: 'warn',
      summary: 'Immagine mancante',
      detail: 'Inserisci l\'URL dell\'immagine di copertina',
      life: 3000
    })
    return false
  }

  if (!genresInput.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Generi mancanti',
      detail: 'Inserisci almeno un genere musicale',
      life: 3000
    })
    return false
  }

  if (!formData.value.schedule.dayOfWeek || !formData.value.schedule.timeSlot) {
    toast.add({
      severity: 'warn',
      summary: 'Schedule mancante',
      detail: 'Seleziona giorno e fascia oraria preferiti',
      life: 3000
    })
    return false
  }

  return true
}

const submitRequest = async () => {
  if (!validateForm()) return

  loading.value = true

  const requestData = {
    ...formData.value,
    genres: genresInput.value.split(',').map(g => g.trim()).filter(g => g),
    tags: tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : []
  }

  try {
    await artistStore.createRequest(requestData)

    toast.add({
      severity: 'success',
      summary: 'Richiesta Inviata!',
      detail: 'La tua richiesta Ã¨ stata inviata all\'admin per l\'approvazione',
      life: 4000
    })

    setTimeout(() => {
      router.push('/artist/dashboard')
    }, 2000)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: artistStore.error || 'Errore nell\'invio della richiesta',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.request-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.request-container {
  width: 100%;
  max-width: 900px;
}

.request-card {
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.request-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
}

.request-header h2 {
  margin: 1rem 0 0.5rem;
  color: #1f2937;
  font-size: 1.75rem;
}

.request-header p {
  color: #6b7280;
  margin: 0;
}

.request-form {
  padding: 0 1rem 1rem;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  margin: 0 0 1.5rem;
  color: #1f2937;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-field {
  margin-bottom: 1.5rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-field small {
  display: block;
  margin-top: 0.4rem;
  color: #6b7280;
  font-size: 0.85rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.social-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
}

.w-full {
  width: 100%;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>