<template>
  <DashboardLayout page-title="Le Mie Richieste Show">
    <template #topbar-actions>
      <Button
        label="Nuova Richiesta"
        icon="pi pi-plus"
        @click="$router.push('/artist/request')"
      />
    </template>

    <!-- Welcome Message se non ha richieste -->
    <Card class="welcome-card" v-if="artistStore.myRequests.length === 0">
      <template #content>
        <div class="empty-state-large">
          <i class="pi pi-microphone" style="font-size: 4rem; color: #cbd5e1;"></i>
          <h2>Benvenuto su BUG Radio! 🎵</h2>
          <p>Non hai ancora richiesto nessuno show.</p>
          <p>Clicca il pulsante qui sotto per proporre il tuo programma!</p>
          <Button
            label="Richiedi il Tuo Show"
            icon="pi pi-plus"
            size="large"
            @click="$router.push('/artist/request')"
            class="cta-button"
          />
        </div>
      </template>
    </Card>

    <template v-else>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-info">
                <h3>Richieste Totali</h3>
                <p>{{ artistStore.myRequests.length }}</p>
              </div>
              <i class="pi pi-list stat-icon"></i>
            </div>
          </template>
        </Card>

        <Card class="stat-card pending">
          <template #content>
            <div class="stat-content">
              <div class="stat-info">
                <h3>In Attesa</h3>
                <p>{{ artistStore.pendingCount }}</p>
              </div>
              <i class="pi pi-clock stat-icon"></i>
            </div>
          </template>
        </Card>

        <Card class="stat-card approved">
          <template #content>
            <div class="stat-content">
              <div class="stat-info">
                <h3>Approvati</h3>
                <p>{{ artistStore.approvedCount }}</p>
              </div>
              <i class="pi pi-check-circle stat-icon"></i>
            </div>
          </template>
        </Card>

        <Card class="stat-card rejected">
          <template #content>
            <div class="stat-content">
              <div class="stat-info">
                <h3>Rifiutati</h3>
                <p>{{ rejectedCount }}</p>
              </div>
              <i class="pi pi-times-circle stat-icon"></i>
            </div>
          </template>
        </Card>
      </div>

      <!-- Info Box per show approvati -->
      <Message v-if="artistStore.approvedCount > 0" severity="success" :closable="false" class="info-message">
        <div class="message-content">
          <i class="pi pi-check-circle"></i>
          <div>
            <strong>Congratulazioni!</strong> Hai {{ artistStore.approvedCount }} show {{ artistStore.approvedCount === 1 ? 'approvato' : 'approvati' }}.
            <br>
            Gli episodi verranno gestiti e pubblicati dall'admin.
          </div>
        </div>
      </Message>

      <!-- Requests Table -->
      <Card>
        <template #title>
          <div class="card-title-actions">
            <span>I Miei Show</span>
            <Button
              label="Nuova Richiesta"
              icon="pi pi-plus"
              size="small"
              @click="$router.push('/artist/request')"
            />
          </div>
        </template>

        <template #content>
          <DataTable
            :value="artistStore.myRequests"
            :loading="artistStore.loading"
            paginator
            :rows="10"
            stripedRows
            sortField="createdAt"
            :sortOrder="-1"
          >
            <Column field="title" header="Titolo Show" sortable style="min-width: 200px;"></Column>
            <Column field="artist.name" header="Nome Artista" sortable></Column>
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
            <Column header="Azioni" style="width: 120px;">
              <template #body="slotProps">
                <Button
                  icon="pi pi-eye"
                  rounded
                  outlined
                  severity="info"
                  @click="viewDetails(slotProps.data)"
                  v-tooltip.top="'Dettagli'"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </template>

    <!-- Dialog Dettagli -->
    <Dialog
      v-model:visible="detailsVisible"
      header="Dettagli Richiesta Show"
      :modal="true"
      :style="{ width: '700px' }"
      :maximizable="true"
    >
      <div class="details-content" v-if="selectedRequest">
        <!-- Status Badge -->
        <div class="status-banner" :class="'status-' + selectedRequest.requestStatus">
          <Tag
            :value="getStatusLabel(selectedRequest.requestStatus)"
            :severity="getStatusSeverity(selectedRequest.requestStatus)"
            style="font-size: 1.1rem; padding: 0.5rem 1rem;"
          />
        </div>

        <!-- Immagine Show -->
        <div class="detail-section" v-if="selectedRequest.image?.url">
          <h3>📻 Immagine Show</h3>
          <div class="image-preview-detail">
            <img :src="selectedRequest.image.url" :alt="selectedRequest.title" />
          </div>
        </div>

        <!-- Info Show -->
        <div class="detail-section">
          <h3>Informazioni Show</h3>
          <p><strong>Titolo:</strong> {{ selectedRequest.title }}</p>
          <p><strong>Descrizione:</strong></p>
          <p class="description-text">{{ selectedRequest.description }}</p>
          <p><strong>Generi:</strong> {{ selectedRequest.genres?.join(', ') }}</p>
          <p v-if="selectedRequest.tags?.length"><strong>Tags:</strong> {{ selectedRequest.tags.join(', ') }}</p>
        </div>

        <!-- Foto e Info Artista -->
        <div class="detail-section">
          <h3>Artista</h3>
          <div v-if="selectedRequest.artist?.photo" style="margin-bottom: 1rem;">
            <img :src="selectedRequest.artist.photo" :alt="selectedRequest.artist.name" class="artist-photo" />
          </div>
          <p><strong>Nome:</strong> {{ selectedRequest.artist.name }}</p>
          <p><strong>Email:</strong> {{ selectedRequest.artist.email }}</p>
          <p><strong>Bio:</strong></p>
          <p class="description-text">{{ selectedRequest.artist.bio }}</p>

          <!-- Social Links -->
          <div v-if="hasSocialLinks(selectedRequest)" style="margin-top: 1rem;">
            <p><strong>Social:</strong></p>
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

        <!-- Programmazione -->
        <div class="detail-section">
          <h3>📅 Programmazione</h3>
          <p><strong>Giorno:</strong> {{ selectedRequest.schedule.dayOfWeek }}</p>
          <p><strong>Orario:</strong> {{ selectedRequest.schedule.timeSlot }}</p>
        </div>

        <!-- Status e Note Admin -->
        <div class="detail-section" v-if="selectedRequest.requestStatus !== 'pending'">
          <h3>💬 Risposta Admin</h3>
          <p v-if="selectedRequest.adminNotes" class="admin-notes">{{ selectedRequest.adminNotes }}</p>
          <p v-else class="no-notes">Nessuna nota dall'admin</p>
        </div>

        <!-- Info Sistema -->
        <div class="detail-section">
          <h3>📊 Info</h3>
          <p><strong>Data Richiesta:</strong> {{ formatDate(selectedRequest.createdAt) }}</p>
          <p><strong>Ultimo Aggiornamento:</strong> {{ formatDate(selectedRequest.updatedAt) }}</p>
        </div>
      </div>

      <template #footer>
        <Button label="Chiudi" @click="detailsVisible = false" />
      </template>
    </Dialog>

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArtistStore } from '../../stores/artist'
import { useToast } from 'primevue/usetoast'
import DashboardLayout from '../../components/DashboardLayout.vue'

const artistStore = useArtistStore()
const toast = useToast()

const detailsVisible = ref(false)
const selectedRequest = ref(null)

const rejectedCount = computed(() => 
  artistStore.myRequests.filter(r => r.requestStatus === 'rejected').length
)

const getStatusLabel = (status) => {
  const map = {
    pending: 'IN ATTESA',
    approved: 'APPROVATO ✓',
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
  const links = request.artist?.socialLinks
  return links && (links.instagram || links.soundcloud || links.mixcloud)
}

const viewDetails = (request) => {
  selectedRequest.value = request
  detailsVisible.value = true
}

onMounted(async () => {
  try {
    await artistStore.fetchMyRequests()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: 'Errore nel caricamento delle richieste',
      life: 3000
    })
  }
})
</script>

<style scoped>
.welcome-card {
  margin-bottom: 2rem;
}

.empty-state-large {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state-large h2 {
  margin: 1rem 0;
  color: #1f2937;
}

.empty-state-large p {
  margin: 0.5rem 0;
  color: #6b7280;
  font-size: 1.1rem;
}

.cta-button {
  margin-top: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  border-left: 4px solid #3b82f6;
}

.stat-card.pending {
  border-left-color: #f59e0b;
}

.stat-card.approved {
  border-left-color: #10b981;
}

.stat-card.rejected {
  border-left-color: #ef4444;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
}

.stat-info p {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.2;
  color: #3b82f6;
}

.info-message {
  margin-bottom: 2rem;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.message-content i {
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.card-title-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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

.details-content {
  padding: 1rem 0;
}

.status-banner {
  text-align: center;
  padding: 1rem;
  margin-bottom: 2rem;
  border-radius: 8px;
}

.status-banner.status-pending {
  background: #fef3c7;
}

.status-banner.status-approved {
  background: #d1fae5;
}

.status-banner.status-rejected {
  background: #fee2e2;
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

.detail-section p {
  margin: 0.5rem 0;
  color: #4b5563;
}

.description-text {
  color: #1f2937;
  line-height: 1.6;
  white-space: pre-wrap;
}

.admin-notes {
  background: #fef3c7;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
  color: #92400e;
  line-height: 1.6;
  margin-top: 0.5rem;
}

.no-notes {
  color: #9ca3af;
  font-style: italic;
}

.image-preview-detail {
  margin: 1rem 0;
}

.image-preview-detail img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.artist-photo {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
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
</style>
