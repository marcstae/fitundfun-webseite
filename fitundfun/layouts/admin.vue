<script setup lang="ts">
import {
  LayoutDashboard,
  Mountain,
  FileDown,
  Home,
  Users,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Database
} from 'lucide-vue-next'

const router = useRouter()
const isSidebarOpen = ref(false)

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Lager', to: '/admin/lager', icon: Mountain },
  { label: 'Downloads', to: '/admin/downloads', icon: FileDown },
  { label: 'Lagerhaus', to: '/admin/lagerhaus', icon: Home },
  { label: 'Sponsoren', to: '/admin/sponsoren', icon: Users },
  { label: 'Nachrichten', to: '/admin/nachrichten', icon: Mail },
  { label: 'Einstellungen', to: '/admin/settings', icon: Settings },
  { label: 'Backup', to: '/admin/backup', icon: Database },
]

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch (e) {
    console.error('Logout error:', e)
  }
  // Seite neu laden um alle Session-Daten zu löschen
  window.location.href = '/admin/login'
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Mobile Header -->
    <header class="lg:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <span class="font-semibold text-primary-700">Fit & Fun Admin</span>
      <button @click="toggleSidebar" class="p-2 text-slate-600 hover:text-primary-700">
        <Menu v-if="!isSidebarOpen" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </button>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <aside
        :class="[
          'fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-200 transition-transform duration-300',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]"
      >
        <div class="flex flex-col h-full">
          <!-- Logo -->
          <div class="hidden lg:flex items-center gap-2 px-6 py-4 border-b border-slate-200">
            <span class="text-xl font-bold text-primary-700">Fit & Fun</span>
            <span class="text-sm text-slate-500">Admin</span>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-4 py-6 overflow-y-auto">
            <ul class="space-y-1">
              <li v-for="item in navItems" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-primary-700 hover:bg-slate-50 rounded-lg transition-colors"
                  active-class="text-primary-700 bg-primary-50"
                  @click="isSidebarOpen = false"
                >
                  <component :is="item.icon" class="w-5 h-5" />
                  {{ item.label }}
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <!-- Footer -->
          <div class="p-4 border-t border-slate-200">
            <button
              @click="logout"
              class="flex items-center gap-3 w-full px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut class="w-5 h-5" />
              Abmelden
            </button>
            <NuxtLink
              to="/"
              class="flex items-center gap-3 mt-2 px-3 py-2 text-slate-500 hover:text-primary-600 text-sm"
            >
              ← Zur Website
            </NuxtLink>
          </div>
        </div>
      </aside>

      <!-- Overlay -->
      <div
        v-show="isSidebarOpen"
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="isSidebarOpen = false"
      />

      <!-- Main Content -->
      <main class="flex-1 lg:ml-0 min-h-screen">
        <div class="p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
