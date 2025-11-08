<template>
  <DashboardLayout page-title="Dashboard Amministratore">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <h3>Show Totali</h3>
              <p>{{ showsStore.shows.length }}</p>
            </div>
            <i class="pi pi-microphone stat-icon"></i>
          </div>
        </template>
      </Card>

      <Card class="stat-card pending">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <h3>Richieste Pending</h3>
              <p>{{ pendingRequestsCount }}</p>
            </div>
            <i class="pi pi-clock stat-icon"></i>
          </div>
        </template>
      </Card>

      <Card class="stat-card approved">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <h3>Show Attivi</h3>
              <p>{{ activeShowsCount }}</p>
            </div>
            <i class="pi pi-check-circle stat-icon"></i>
          </div>
        </template>
      </Card>

      <Card class="stat-card episodes">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <h3>Episodi Totali</h3>
              <p>{{ episodesStore.episodes.length }}</p>
            </div>
            <i class="pi pi-play-circle stat-icon"></i>
          </div>
        </template>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card class="actions-card">
      <template #title>Azioni Rapide</template>
      <template #content>
        <div class="quick-actions">
          <Button
            label="Gestisci Show"
            icon="pi pi-microphone"
            @click="$router.push('/shows')"
            size="large"
          />
          <Button
            label="Gestisci Episodi"
            icon="pi pi-play-circle"
            severity="secondary"
            @click="$router.push('/episodes')"
            size="large"
          />
          <Button
            label="Richieste Pending"
            icon="pi pi-inbox"
            severity="warning"
            @click="$router.push('/requests')"
            size="large"
            :badge="pendingRequestsCount > 0 ? pendingRequestsCount.toString() : undefined"
          />
        </div>
      </template>
    </Card>

    <!-- Recent Requests -->
    <Card v-if="recentRequests.length > 0">
      <template #title>Ultime Richieste</template>
      <template #content>
        <DataTable
          :value="recentRequests"
          stripedRows
        >
          <Column field="title" header="Titolo Show" style="min-width: 200px;"></Column>
          <Column field="artist.name" header="Artista"></Column>
          <Column field="requestStatus" header="Status">
            <template #body="slotProps">
              <Tag
                :value="getRequestStatusLabel(slotProps.data.requestStatus)"
                :severity="getRequestStatusSeverity(slotProps.data.requestStatus)"
              />
            </template>
          </Column>
          <Column field="createdAt" header="Data Richiesta">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
          <Column header="Azioni">
            <template #body="slotProps">
              <Button
                label="Vedi"
                icon="pi pi-arrow-right"
                text
                @click="$router.push('/requests')"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Recent Episodes -->
    <Card v-if="recentEpisodes.length > 0">
      <template #title>Ultimi Episodi</template>
      <template #content>
        <DataTable
          :value="recentEpisodes"
          stripedRows
        >
          <Column field="title" header="Titolo" style="min-width: 200px;"></Column>
          <Column field="showId.title" header="Show">
            <template #body="slotProps">
              {{ slotProps.data.showId?.title || '-' }}
            </template>
          </Column>
          <Column field="status" header="Status">
            <template #body="slotProps">
              <Tag
                :value="getStatusLabel(slotProps.data.status)"
                :severity="getStatusSeverity(slotProps.data.status)"
              />
            </template>
          </Column>
          <Column field="airDate" header="Data">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.airDate) }}
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Toast />
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShowsStore } from '@/stores/shows.js'
import { useEpisodesStore } from '@/stores/episodes.js'
import { useToast } from 'primevue/usetoast'
import DashboardLayout from '../../components/DashboardLayout.vue'

const router = useRouter()
const showsStore = useShowsStore()
const episodesStore = useEpisodesStore()
const toast = useToast()

const pendingRequestsCount = computed(() => 
  showsStore.shows.filter(s => s.requestStatus === 'pending').length
)

const activeShowsCount = computed(() => 
  showsStore.shows.filter(s => s.status === 'active').length
)

const recentRequests = computed(() => 
  showsStore.shows
    .filter(s => s.requestStatus === 'pending')
    .slice(0, 5)
)

const recentEpisodes = computed(() => 
  episodesStore.episodes
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
)

const getRequestStatusLabel = (status) => {
  const map = {
    pending: 'IN ATTESA',
    approved: 'APPROVATO',
    rejected: 'RIFIUTATO'
  }
  return map[status] || status?.toUpperCase()
}

const getRequestStatusSeverity = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    draft: 'BOZZA',
    published: 'PUBBLICATO',
    archived: 'ARCHIVIATO'
  }
  return map[status] || status?.toUpperCase()
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
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    await Promise.all([
      showsStore.fetchShows(),
      episodesStore.fetchEpisodes()
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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.stat-card.episodes {
  border-left-color: #8b5cf6;
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
  font-weight: 600;
}

.stat-info p {
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
  color: #1f2937;
}

.stat-icon {
  font-size: 3rem;
  opacity: 0.15;
  color: #3b82f6;
}

.actions-card {
  margin-bottom: 2rem;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
