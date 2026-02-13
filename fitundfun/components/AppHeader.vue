<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'

const isMenuOpen = ref(false)

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Aktuelles Lager', to: '/lager' },
  { label: 'Archiv', to: '/archiv' },
  { label: 'Lagerhaus', to: '/lagerhaus' },
  { label: 'Sponsoren', to: '/sponsoren' },
  { label: 'Kontakt', to: '/kontakt' },
]

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
    <div class="container mx-auto px-4">
      <nav class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-xl font-bold text-primary-700">Fit & Fun</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <ul class="hidden md:flex items-center gap-6">
          <li v-for="item in navItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="text-slate-600 hover:text-primary-700 transition-colors font-medium"
              active-class="text-primary-700"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 text-slate-600 hover:text-primary-700"
          @click="toggleMenu"
          aria-label="Menu öffnen"
        >
          <Menu v-if="!isMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </nav>

      <!-- Mobile Navigation -->
      <div
        v-show="isMenuOpen"
        class="md:hidden border-t border-slate-200 py-4"
      >
        <ul class="flex flex-col gap-2">
          <li v-for="item in navItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="block py-3 px-4 text-slate-600 hover:text-primary-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
              active-class="text-primary-700 bg-slate-50"
              @click="isMenuOpen = false"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>
