<template>
  <div class="login-container">
    <div class="login-card">
      <Card>
        <template #header>
          <div class="login-header">
            <i class="pi pi-radio-button" style="font-size: 3rem; color: #3b82f6;"></i>
            <h2>BUG Radio CMS</h2>
            <p>Accedi al pannello di gestione</p>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleLogin">
            <div class="form-field">
              <label for="email">Email</label>
              <InputText
                  id="email"
                  v-model="credentials.email"
                  type="email"
                  placeholder="tua@email.com"
                  required
                  class="w-full"
              />
            </div>

            <div class="form-field">
              <label for="password">Password</label>
              <Password
                  id="password"
                  v-model="credentials.password"
                  placeholder="Password"
                  :feedback="false"
                  toggleMask
                  required
                  class="w-full"
              />
            </div>

            <Button
                type="submit"
                label="Accedi"
                icon="pi pi-sign-in"
                :loading="authStore.loading"
                class="w-full"
            />
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

const credentials = ref({
  email: '',
  password: ''
})

const handleLogin = async () => {
  try {
    await authStore.login(credentials.value)
    toast.add({
      severity: 'success',
      summary: 'Login effettuato',
      detail: `Benvenuto ${authStore.userName}!`,
      life: 3000
    })

    // Redirect in base al ruolo
    if (authStore.user?.role === 'admin') {
      router.push('/shows')
    } else {
      router.push('/artist/dashboard')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: authStore.error || 'Credenziali non valide',
      life: 3000
    })
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 450px;
}

.login-header {
  text-align: center;
  padding: 2rem 2rem 0;
}

.login-header h2 {
  margin: 1rem 0 0.5rem;
  color: #1f2937;
}

.login-header p {
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

.register-link {
  margin-top: 1.5rem;
  text-align: center;
  color: #6b7280;
}

.register-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>