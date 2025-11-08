<template>
  <DashboardLayout page-title="Gestione Richieste Show">
    <template #topbar-actions>
      <div class="topbar-badge">
        <Badge :value="pendingCount" severity="warning" />
        <span>{{ pendingCount }} in attesa</span>
      </div>
    </template>

    <!-- Filters -->
    <Card class="filters-card">
      <template #content>
        <div class="filters">
          <Button
            :label="`In Attesa (${pendingCount})`"
            :severity="currentFilter === 'pending' ? 'warning' : 'secondary'"
            :outlined="currentFilter !== 'pending'"
            @click="currentFilter = 'pending'"
          />
          <Button
            :label="`Approvati (${approvedRequests.length})`"
            :severity="currentFilter === 'approved' ? 'success' : 'secondary'"
            :outlined="currentFilter !== 'approved'"
            @click="currentFilter = 'approved'"
          />
          <Button
            :label="`Rifiutati (${rejectedRequests.length})`"
            :severity="currentFilter === 'rejected' ? 'danger' : 'secondary'"
            :outlined="currentFilter !== 'rejected'"
            @click="currentFilter = 'rejected'"
          />
          <Button
            label="Tutti"
            :severity="currentFilter === 'all' ? 'info' : 'secondary'"
            :outlined="currentFilter !== 'all'"
            @click="currentFilter = 'all'"
          />
        </div>
      </template>
    </Card>

    <!-- Requests Table -->
    <Card>
      <template #content>
        <DataTable
          :value="filteredRequests"
          :loading="loading"
          paginator
          :rows="15"
          stripedRows
          sortField="createdAt"
          :sortOrder="-1"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" style="font-size: 3rem; color: #cbd5e1;"></i>
              <p>Nessuna richiesta {{ getFilterLabel() }}</p>
            </div>
          </template>

          <Column field="title" header="Titolo Show" sortable style="min-width: 200px;"></Column>
          <Column field="artist.name" header="Artista" sortable></Column>
          <Column field="artist.email" header="Email" sortable></Column>
          <Column field="genres" header="Generi">
            <template #body="slotProps">
              <div class="genres-tags">
                <Tag
                  v-for="genre in slotProps.data.genres?.slice(0, 2)"
                  :key="genre"
                  :value="genre"
                  severity="info"
                  class="genre-tag"
                />
                <span v-if="slotProps.data.genres?.length > 2" class="more-genres">
                  +{{ slotProps.data.genres.length - 2 }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="schedule.dayOfWeek" header="Giorno" sortable></Column>
          <Column field="requestStatus" header="Status" sortable>
            <template #body="slotProps">
              <Tag
                :value="getStatusLabel(slotProps.data.requestStatus)"
                :severity="getStatusSeverity(slotProps.data.requestStatus)"
              />
            </template>
          </Column>
          <Column field="createdAt" header="Data Richiesta" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
          <Column header="Azioni" style="width: 200px;">
            <template #body="slotProps">
              <div class="action-buttons">
                <Button
                  v-if="slotProps.data.requestStatus === 'pending'"
                  icon="pi pi-check"
                  rounded
                  severity="success"
                  @click="openApproveDialog(slotProps.data)"
                  v-tooltip.top="'Approva'"
                />
                <Button
                  v-if="slotProps.data.requestStatus === 'pending'"
                  icon="pi pi-times"
                  rounded
                  severity="danger"
                  @click="openRejectDialog(slotProps.data)"
                  v-tooltip.top="'Rifiuta'"
                />
                <Button
                  icon="pi pi-eye"
                  rounded
                  outlined
                  severity="info"
                  @click="viewDetails(slotProps.data)"
                  v-tooltip.top="'Dettagli'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Dialog Approva -->
    <Dialog
      v-model:visible="approveDialogVisible"
      header="Approva Show"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="dialog-content" v-if="selectedRequest">
        <p class="dialog-message">
          Stai per approvare lo show <strong>"{{ selectedRequest.title }}"</strong> di <strong>{{ selectedRequest.artist.name }}</strong>.
        </p>
        <p class="dialog-message">
          Lo show verrà attivato e reso visibile sul sito pubblico.
        </p>

        <div class="form-field">
          <label for="approveNotes">Note per l'artista (opzionale)</label>
          <Textarea
            id="approveNotes"
            v-model="adminNotes"
            rows="3"
            placeholder="Es. Ottima proposta! Benvenuto su BUG Radio..."
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Annulla" severity="secondary" @click="approveDialogVisible = false" outlined />
        <Button
          label="Approva Show"
          severity="success"
          icon="pi pi-check"
          @click="approveRequest"
          :loading="loading"
        />
      </template>
    </Dialog>

    <!-- Dialog Rifiuta -->
    <Dialog
      v-model:visible="rejectDialogVisible"
      header="Rifiuta Show"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="dialog-content" v-if="selectedRequest">
        <p class="dialog-message warning">
          Stai per rifiutare lo show <strong>"{{ selectedRequest.title }}"</strong> di <strong>{{ selectedRequest.artist.name }}</strong>.
        </p>

        <div class="form-field">
          <label for="rejectNotes">Motivo del rifiuto *</label>
          <Textarea
            id="rejectNotes"
            v-model="adminNotes"
            rows="4"
            placeholder="Spiega il motivo del rifiuto..."
            required
            class="w-full"
          />
          <small>L'artista riceverà questa motivazione</small>
        </div>
      </div>

      <template #footer>
        <Button label="Annulla" severity="secondary" @click="rejectDialogVisible = false" outlined />
        <Button
          label="Rifiuta Show"
          severity="danger"
          icon="pi pi-times"
          @click="rejectRequest"
          :loading="loading"
        />
      </template>
    </Dialog>

    <!-- Dialog Dettagli -->
    <Dialog
      v-model:visible="detailsDialogVisible"
      header="Dettagli Richiesta Show"
      :modal="true"
      :style="{ width: '800px' }"
      :maximizable="true"
    >
      <div class="details-content" v-if="selectedRequest">
        <div class="detail-row">
          <strong>Status:</strong>
          <Tag
            :value="getStatusLabel(selectedRequest.requestStatus)"
            :severity="getStatusSeverity(selectedRequest.requestStatus)"
          />
        </div>

        <div class="detail-section">
          <h3>📻 Informazioni Show</h3>
          <div class="detail-row" v-if="selectedRequest.image?.url">
            <strong>Immagine Show:</strong>
            <div class="image-preview-small">
              <img :src="selectedRequest.image.url" :alt="selectedRequest.title" />
            </div>
          </div>
          <div class="detail-row">
            <strong>Titolo:</strong>
            <span>{{ selectedRequest.title }}</span>
          </div>
          <div class="detail-row">
            <strong>Slug:</strong>
            <span>{{ selectedRequest.slug }}</span>
          </div>
          <div class="detail-row">
            <strong>Descrizione:</strong>
            <p>{{ selectedRequest.description }}</p>
          </div>
          <div class="detail-row">
            <strong>Generi:</strong>
            <div class="genres-tags">
              <Tag
                v-for="genre in selectedRequest.genres"
                :key="genre"
                :value="genre"
                severity="info"
              />
            </div>
          </div>
          <div class="detail-row" v-if="selectedRequest.tags?.length">
            <strong>Tags:</strong>
            <span>{{ selectedRequest.tags.join(', ') }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>👤 Informazioni Artista</h3>
          <div class="detail-row" v-if="selectedRequest.artist?.photo">
            <strong>Foto Artista:</strong>
            <div class="image-preview-small">
              <img :src="selectedRequest.artist.photo" :alt="selectedRequest.artist.name" />
            </div>
          </div>
          <div class="detail-row">
            <strong>Nome:</strong>
            <span>{{ selectedRequest.artist.name }}</span>
          </div>
          <div class="detail-row">
            <strong>Email:</strong>
            <span>{{ selectedRequest.artist.email }}</span>
          </div>
          <div class="detail-row">
            <strong>Biografia:</strong>
            <p>{{ selectedRequest.artist.bio }}</p>
          </div>
          <div class="detail-row" v-if="hasSocialLinks(selectedRequest)">
            <strong>Social:</strong>
            <div class="social-links">
              <a v-if="selectedRequest.artist.socialLinks?.instagram" :href="selectedRequest.artist.socialLinks.instagram" target="_blank">
                <i class="pi pi-instagram"></i> Instagram
              </a>
              <a v-if="selectedRequest.artist.socialLinks?.soundcloud" :href="selectedRequest.artist.socialLinks.soundcloud" target="_blank">
                <i class="pi pi-cloud"></i> Soundcloud
              </a>
              <a v-if="selectedRequest.artist.socialLinks?.mixcloud" :href="selectedRequest.artist.socialLinks.mixcloud" target="_blank">
                <i class="pi pi-cloud"></i> Mixcloud
              </a>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>📅 Programmazione</h3>
          <div class="detail-row">
            <strong>Giorno:</strong>
            <span>{{ selectedRequest.schedule.dayOfWeek }}</span>
          </div>
          <div class="detail-row">
            <strong>Fascia Oraria:</strong>
            <span>{{ selectedRequest.schedule.timeSlot }}</span>
          </div>
          <div class="detail-row">
            <strong>Frequenza:</strong>
            <span>{{ selectedRequest.schedule.frequency }}</span>
          </div>
        </div>

        <div class="detail-section" v-if="selectedRequest.adminNotes">
          <h3>💬 Note Admin</h3>
          <p>{{ selectedRequest.adminNotes }}</p>
        </div>

        <div class="detail-section">
          <h3>📊 Info Sistema</h3>
          <div class="detail-row">
            <strong>Data Richiesta:</strong>
            <span>{{ formatDate(selectedRequest.createdAt) }}</span>
          </div>
          <div class="detail-row">
            <strong>Ultimo Aggiornamento:</strong>
            <span>{{ formatDate(selectedRequest.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Chiudi" @click="detailsDialogVisible = false" />
        <Button
          v-if="selectedRequest?.requestStatus === 'pending'"
          label="Approva"
          severity="success"
          icon="pi pi-check"
          @click="openApproveDialogFromDetails()"
        />
        <Button
          v-if="selectedRequest?.requestStatus === 'pending'"
          label="Rifiuta"
          severity="danger"
          icon="pi pi-times"
          @click="openRejectDialogFromDetails()"
        />
      </template>
    </Dialog>

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useShowsStore } from '../../stores/shows'
import { useToast } from 'primevue/usetoast'
import DashboardLayout from '../../components/DashboardLayout.vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const showsStore = useShowsStore()
const toast = useToast()

const requests = ref([])
const loading = ref(false)
const currentFilter = ref('pending')

const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const detailsDialogVisible = ref(false)
const selectedRequest = ref(null)
const adminNotes = ref('')

const pendingRequests = computed(() => requests.value.filter(r => r.requestStatus === 'pending'))
const approvedRequests = computed(() => requests.value.filter(r => r.requestStatus === 'approved'))
const rejectedRequests = computed(() => requests.value.filter(r => r.requestStatus === 'rejected'))
const pendingCount = computed(() => pendingRequests.value.length)

const filteredRequests = computed(() => {
  if (currentFilter.value === 'all') return requests.value
  if (currentFilter.value === 'pending') return pendingRequests.value
  if (currentFilter.value === 'approved') return approvedRequests.value
  if (currentFilter.value === 'rejected') return rejectedRequests.value
  return requests.value
})

const getStatusLabel = (status) => {
  const map = {
    pending: 'IN ATTESA',
    approved: 'APPROVATO',
    rejected: 'RIFIUTATO'
  }
  return map[status] || status
}

const getStatusSeverity = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getFilterLabel = () => {
  const map = {
    all: '',
    pending: 'in attesa',
    approved: 'approvata',
    rejected: 'rifiutata'
  }
  return map[currentFilter.value] || ''
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

const hasSocialLinks = (request) => {
  const links = request.artist.socialLinks
  return links && (links.instagram || links.soundcloud || links.mixcloud)
}

const fetchRequests = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${API_URL}/shows`)
    requests.value = response.data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: 'Errore nel caricamento delle richieste',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const openApproveDialog = (request) => {
  selectedRequest.value = request
  adminNotes.value = 'Ottima proposta! Benvenuto su BUG Radio 🎵'
  approveDialogVisible.value = true
}

const openRejectDialog = (request) => {
  selectedRequest.value = request
  adminNotes.value = ''
  rejectDialogVisible.value = true
}

const openApproveDialogFromDetails = () => {
  detailsDialogVisible.value = false
  adminNotes.value = 'Ottima proposta! Benvenuto su BUG Radio 🎵'
  approveDialogVisible.value = true
}

const openRejectDialogFromDetails = () => {
  detailsDialogVisible.value = false
  adminNotes.value = ''
  rejectDialogVisible.value = true
}

const viewDetails = (request) => {
  selectedRequest.value = request
  detailsDialogVisible.value = true
}

const approveRequest = async () => {
  loading.value = true
  try {
    await axios.put(`${API_URL}/admin/shows/${selectedRequest.value._id}/approve`, {
      adminNotes: adminNotes.value
    })

    toast.add({
      severity: 'success',
      summary: 'Show Approvato!',
      detail: `"${selectedRequest.value.title}" è stato approvato e attivato`,
      life: 4000
    })

    approveDialogVisible.value = false
    await fetchRequests()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: error.response?.data?.error || 'Errore nell\'approvazione',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const rejectRequest = async () => {
  if (!adminNotes.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Attenzione',
      detail: 'Inserisci il motivo del rifiuto',
      life: 3000
    })
    return
  }

  loading.value = true
  try {
    await axios.put(`${API_URL}/admin/shows/${selectedRequest.value._id}/reject`, {
      adminNotes: adminNotes.value
    })

    toast.add({
      severity: 'info',
      summary: 'Show Rifiutato',
      detail: `"${selectedRequest.value.title}" è stato rifiutato`,
      life: 3000
    })

    rejectDialogVisible.value = false
    await fetchRequests()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: error.response?.data?.error || 'Errore nel rifiuto',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchRequests()
})
</script>

<style scoped>
.topbar-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filters-card {
  margin-bottom: 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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

.genres-tags {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.genre-tag {
  font-size: 0.75rem;
}

.more-genres {
  color: #6b7280;
  font-size: 0.875rem;
}

.dialog-content {
  padding: 1rem 0;
}

.dialog-message {
  margin-bottom: 1.5rem;
  color: #4b5563;
  line-height: 1.6;
}

.dialog-message.warning {
  color: #dc2626;
  font-weight: 500;
}

.form-field {
  margin-bottom: 1rem;
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

.details-content {
  padding: 1rem 0;
}

.detail-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 1rem;
  color: #1f2937;
  font-size: 1.1rem;
}

.detail-row {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.detail-row strong {
  min-width: 150px;
  color: #6b7280;
  font-size: 0.9rem;
}

.detail-row p {
  margin: 0;
  color: #1f2937;
  flex: 1;
}

.detail-row span {
  color: #1f2937;
  flex: 1;
}

.detail-row a {
  color: #3b82f6;
  text-decoration: none;
}

.detail-row a:hover {
  text-decoration: underline;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.social-links a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  text-decoration: none;
}

.social-links a:hover {
  text-decoration: underline;
}

.image-preview-small {
  margin-top: 0.5rem;
}

.image-preview-small img {
  max-width: 300px;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.w-full {
  width: 100%;
}
</style>
