<template>
  <div class="register-container">
    <div class="register-card">
      <Card>
        <template #header>
          <div class="register-header">
            <i class="pi pi-radio-button" style="font-size: 3rem; color: #3b82f6;"></i>
            <h2>BUG Radio - Registrazione Artista</h2>
            <p>Registrati per proporre il tuo show</p>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleRegister">
            <div class="form-field">
              <label for="email">Email *</label>
              <InputText
                  id="email"
                  v-model="userData.email"
                  type="email"
                  placeholder="tua@email.com"
                  required
                  class="w-full"
              />
            </div>

            <div class="form-field">
              <label for="password">Password *</label>
              <InputText
                  id="password"
                  v-model="userData.password"
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  required
                  class="w-full"
              />
              <small>Minimo 6 caratteri</small>
            </div>

            <Button
                type="submit"
                label="Registrati"
                icon="pi pi-user-plus"
                :loading="authStore.loading"
                class="w-full"
            />

            <div class="login-link">
              Hai già un account?
              <router-link to="/login">Accedi</router-link>
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
import { useAuthStore } from '../stores/auth'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const userData = ref({
  email: '',
  password: '',
  name: 'Artista',  // Nome di default
  role: 'artist'
})

const handleRegister = async () => {
  if (userData.value.password.length < 6) {
    toast.add({
      severity: 'warn',
      summary: 'Attenzione',
      detail: 'La password deve essere di almeno 6 caratteri',
      life: 3000
    })
    return
  }

  try {
    await authStore.register(userData.value)
    toast.add({
      severity: 'success',
      summary: 'Registrazione completata',
      detail: 'Ora puoi richiedere il tuo show!',
      life: 3000
    })
    setTimeout(() => {
      router.push('/artist/dashboard')
    }, 1000)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: authStore.error || 'Errore durante la registrazione',
      life: 3000
    })
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.register-card {
  width: 100%;
  max-width: 500px;
}

.register-header {
  text-align: center;
  padding: 2rem 2rem 0;
}

.register-header h2 {
  margin: 1rem 0 0.5rem;
  color: #1f2937;
}

.register-header p {
  color: #6b7280;
  margin: 0;
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

.w-full {
  width: 100%;
}

.password-hint {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.login-link {
  margin-top: 1.5rem;
  text-align: center;
  color: #6b7280;
}

.login-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>