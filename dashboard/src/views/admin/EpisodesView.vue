<template>
  <DashboardLayout page-title="Gestione Episodi">
    <template #topbar-actions>
      <Button
        label="Nuovo Episodio"
        icon="pi pi-plus"
        @click="openDialog()"
      />
    </template>

    <!-- Filters -->
    <Card class="filters-card">
      <template #content>
        <div class="filters">
          <!-- Filter by Show -->
          <Dropdown
            v-model="selectedShow"
            :options="showsStore.shows.filter(s => s.status === 'active')"
            optionLabel="title"
            optionValue="_id"
            placeholder="Filtra per Show"
            showClear
            class="filter-dropdown"
          />
          
          <!-- Filter by Status -->
          <Dropdown
            v-model="selectedStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filtra per Status"
            showClear
            class="filter-dropdown"
          />

          <!-- Stats -->
          <div class="stats-chips">
            <Chip :label="`${publishedCount} Pubblicati`" icon="pi pi-check-circle" />
            <Chip :label="`${draftCount} Bozze`" icon="pi pi-pencil" />
            <Chip :label="`${featuredCount} In evidenza`" icon="pi pi-star-fill" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Episodes Table -->
    <Card>
      <template #content>
        <DataTable
          :value="filteredEpisodes"
          :loading="episodesStore.loading"
          paginator
          :rows="15"
          stripedRows
          sortField="airDate"
          :sortOrder="-1"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-play-circle" style="font-size: 3rem; color: #cbd5e1;"></i>
              <p>Nessun episodio trovato</p>
              <Button 
                label="Crea il primo episodio" 
                icon="pi pi-plus" 
                @click="openDialog()" 
              />
            </div>
          </template>

          <Column field="title" header="Titolo" sortable style="min-width: 200px;"></Column>
          
          <Column field="showId.title" header="Show" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.showId?.title || '-'" severity="info" />
            </template>
          </Column>

          <Column field="episodeNumber" header="#" sortable style="width: 80px;">
            <template #body="slotProps">
              {{ slotProps.data.episodeNumber || '-' }}
            </template>
          </Column>

          <Column field="airDate" header="Data Messa in Onda" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.airDate) }}
            </template>
          </Column>

          <Column field="status" header="Status" sortable>
            <template #body="slotProps">
              <Tag
                :value="getStatusLabel(slotProps.data.status)"
                :severity="getStatusSeverity(slotProps.data.status)"
              />
            </template>
          </Column>

          <Column field="featured" header="Featured" sortable style="width: 100px;">
            <template #body="slotProps">
              <i
                :class="slotProps.data.featured ? 'pi pi-star-fill' : 'pi pi-star'"
                :style="{ color: slotProps.data.featured ? '#f59e0b' : '#cbd5e1', fontSize: '1.2rem' }"
              ></i>
            </template>
          </Column>

          <Column header="Azioni" style="width: 200px;">
            <template #body="slotProps">
              <div class="action-buttons">
                <Button
                  icon="pi pi-eye"
                  rounded
                  outlined
                  severity="info"
                  @click="viewEpisode(slotProps.data)"
                  v-tooltip.top="'Dettagli'"
                />
                <Button
                  icon="pi pi-pencil"
                  rounded
                  outlined
                  severity="secondary"
                  @click="openDialog(slotProps.data)"
                  v-tooltip.top="'Modifica'"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  outlined
                  severity="danger"
                  @click="confirmDelete(slotProps.data)"
                  v-tooltip.top="'Elimina'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Dialog Create/Edit Episode -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editingEpisode ? 'Modifica Episodio' : 'Nuovo Episodio'"
      :modal="true"
      :style="{ width: '800px' }"
      :maximizable="true"
    >
      <div class="dialog-content">
        <!-- Show Selection -->
        <div class="form-field">
          <label for="showId">Show *</label>
          <Dropdown
            id="showId"
            v-model="formData.showId"
            :options="showsStore.shows.filter(s => s.status === 'active')"
            optionLabel="title"
            optionValue="_id"
            placeholder="Seleziona lo show"
            required
            class="w-full"
          />
        </div>

        <!-- Episode Info -->
        <div class="form-row">
          <div class="form-field">
            <label for="title">Titolo Episodio *</label>
            <InputText
              id="title"
              v-model="formData.title"
              placeholder="Es. Episode #12 - Deep Techno Night"
              required
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="episodeNumber">Numero Episodio</label>
            <InputNumber
              id="episodeNumber"
              v-model="formData.episodeNumber"
              placeholder="12"
              :min="1"
              class="w-full"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="form-field">
          <label for="description">Descrizione *</label>
          <Textarea
            id="description"
            v-model="formData.description"
            rows="4"
            placeholder="Descrivi l'episodio, la tracklist, gli ospiti..."
            required
            class="w-full"
          />
        </div>

        <!-- Mixcloud URL -->
        <div class="form-field">
          <label for="mixcloudUrl">Mixcloud URL *</label>
          <InputText
            id="mixcloudUrl"
            v-model="formData.mixcloudUrl"
            placeholder="https://www.mixcloud.com/username/episode-name/"
            required
            class="w-full"
          />
          <small>URL completo del mix su Mixcloud</small>
        </div>

        <!-- Image Upload -->
        <div class="form-field">
          <ImageUpload
            label="Immagine Episodio (opzionale)"
            v-model="formData.image.url"
          />
          <small>Se non specificata, verrà usata l'immagine dello show</small>
        </div>

        <!-- Air Date and Genres -->
        <div class="form-row">
          <div class="form-field">
            <label for="airDate">Data Messa in Onda *</label>
            <Calendar
              id="airDate"
              v-model="formData.airDate"
              showTime
              hourFormat="24"
              dateFormat="dd/mm/yy"
              showIcon
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="genres">Generi Musicali</label>
            <InputText
              id="genres"
              v-model="genresInput"
              placeholder="Techno, House, Ambient"
              class="w-full"
            />
            <small>Separati da virgola</small>
          </div>
        </div>

        <!-- Status and Featured -->
        <div class="form-row">
          <div class="form-field">
            <label for="status">Status</label>
            <Dropdown
              id="status"
              v-model="formData.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleziona status"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="featured">In Evidenza</label>
            <div class="checkbox-field">
              <Checkbox
                id="featured"
                v-model="formData.featured"
                :binary="true"
              />
              <label for="featured">Mostra come episodio featured</label>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Annulla" severity="secondary" @click="dialogVisible = false" outlined />
        <Button
          :label="editingEpisode ? 'Salva Modifiche' : 'Crea Episodio'"
          @click="saveEpisode"
          :loading="episodesStore.loading"
        />
      </template>
    </Dialog>

    <ConfirmDialog />
    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useShowsStore } from '@/stores/shows.js'
import { useEpisodesStore } from '@/stores/episodes.js'
import { useAuthStore } from '@/stores/auth.js'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DashboardLayout from '@/components/DashboardLayout.vue'
import ImageUpload from '@/components/ImageUpload.vue'

const episodesStore = useEpisodesStore()
const showsStore = useShowsStore()
const authStore = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

const dialogVisible = ref(false)
const editingEpisode = ref(null)
const selectedShow = ref(null)
const selectedStatus = ref(null)
const genresInput = ref('')

const formData = ref({
  showId: '',
  title: '',
  episodeNumber: null,
  description: '',
  mixcloudUrl: '',
  image: { url: '', alt: '' },
  airDate: new Date(),
  genres: [],
  status: 'draft',
  featured: false
})

const statusOptions = [
  { label: 'Bozza', value: 'draft' },
  { label: 'Pubblicato', value: 'published' },
  { label: 'Archiviato', value: 'archived' }
]

const filteredEpisodes = computed(() => {
  let episodes = episodesStore.episodes

  if (selectedShow.value) {
    episodes = episodes.filter(e => e.showId?._id === selectedShow.value || e.showId === selectedShow.value)
  }

  if (selectedStatus.value) {
    episodes = episodes.filter(e => e.status === selectedStatus.value)
  }

  return episodes
})

const publishedCount = computed(() => episodesStore.episodes.filter(e => e.status === 'published').length)
const draftCount = computed(() => episodesStore.episodes.filter(e => e.status === 'draft').length)
const featuredCount = computed(() => episodesStore.episodes.filter(e => e.featured).length)

const getStatusLabel = (status) => {
  const map = {
    draft: 'BOZZA',
    published: 'PUBBLICATO',
    archived: 'ARCHIVIATO'
  }
  return map[status] || status.toUpperCase()
}

const getStatusSeverity = (status) => {
  const map = {
    draft: 'secondary',
    published: 'success',
    archived: 'warning'
  }
  return map[status] || 'info'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const openDialog = (episode = null) => {
  if (episode) {
    editingEpisode.value = episode
    formData.value = {
      showId: episode.showId?._id || episode.showId,
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      description: episode.description,
      mixcloudUrl: episode.mixcloudUrl,
      image: { url: episode.image?.url || '', alt: episode.image?.alt || '' },
      airDate: new Date(episode.airDate),
      genres: episode.genres || [],
      status: episode.status,
      featured: episode.featured
    }
    genresInput.value = (episode.genres || []).join(', ')
  } else {
    editingEpisode.value = null
    formData.value = {
      showId: '',
      title: '',
      episodeNumber: null,
      description: '',
      mixcloudUrl: '',
      image: { url: '', alt: '' },
      airDate: new Date(),
      genres: [],
      status: 'draft',
      featured: false
    }
    genresInput.value = ''
  }
  dialogVisible.value = true
}

const saveEpisode = async () => {
  if (!formData.value.showId || !formData.value.title || !formData.value.description || !formData.value.mixcloudUrl) {
    toast.add({
      severity: 'warn',
      summary: 'Campi mancanti',
      detail: 'Compila tutti i campi obbligatori',
      life: 3000
    })
    return
  }

  const episodeData = {
    showId: formData.value.showId,
    title: formData.value.title,
    episodeNumber: formData.value.episodeNumber,
    description: formData.value.description,
    mixcloudUrl: formData.value.mixcloudUrl,
    image: formData.value.image.url ? formData.value.image : undefined,
    airDate: formData.value.airDate instanceof Date 
      ? formData.value.airDate.toISOString() 
      : formData.value.airDate,
    genres: genresInput.value ? genresInput.value.split(',').map(g => g.trim()).filter(g => g) : [],
    status: formData.value.status,
    featured: formData.value.featured
  }

  try {
    if (editingEpisode.value) {
      await episodesStore.updateEpisode(editingEpisode.value._id, episodeData)
      toast.add({
        severity: 'success',
        summary: 'Episodio aggiornato',
        detail: 'Le modifiche sono state salvate',
        life: 3000
      })
    } else {
      await episodesStore.createEpisode(episodeData)
      toast.add({
        severity: 'success',
        summary: 'Episodio creato',
        detail: 'Il nuovo episodio è stato creato',
        life: 3000
      })
    }

    dialogVisible.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: episodesStore.error || 'Errore durante il salvataggio',
      life: 3000
    })
  }
}

const viewEpisode = (episode) => {
  alert(`Dettagli episodio:\n\nTitolo: ${episode.title}\nShow: ${episode.showId?.title}\nMixcloud: ${episode.mixcloudUrl}`)
}

const confirmDelete = (episode) => {
  confirm.require({
    message: `Sei sicuro di voler eliminare "${episode.title}"?`,
    header: 'Conferma Eliminazione',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sì, elimina',
    rejectLabel: 'Annulla',
    acceptClass: 'p-button-danger',
    accept: () => deleteEpisode(episode)
  })
}

const deleteEpisode = async (episode) => {
  try {
    await episodesStore.deleteEpisode(episode._id)
    toast.add({
      severity: 'success',
      summary: 'Episodio eliminato',
      detail: 'L\'episodio è stato eliminato',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: 'Errore durante l\'eliminazione',
      life: 3000
    })
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      episodesStore.fetchEpisodes(),
      showsStore.fetchShows()
    ])
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: 'Errore nel caricamento dei dati',
      life: 3000
    })
  }
})
</script>

<style scoped>
.filters-card {
  margin-bottom: 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-dropdown {
  min-width: 200px;
}

.stats-chips {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state p {
  margin: 1rem 0;
  color: #6b7280;
  font-size: 1.125rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.dialog-content {
  padding: 1rem 0;
}

.form-field {
  margin-bottom: 1.5rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
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

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
}

.w-full {
  width: 100%;
}
</style>
