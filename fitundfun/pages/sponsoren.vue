<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'

useHead({
  title: 'Sponsoren - Fit & Fun',
})

const client = useSupabaseClient()

// Fetch Sponsoren
const { data: sponsoren } = await useAsyncData('sponsoren', async () => {
  const { data } = await client
    .from('sponsoren')
    .select('*')
    .order('reihenfolge')
  return data || []
})

const { getPublicUrl } = useStorageUrl()

const getLogoUrl = (path: string) => {
  if (path.startsWith('http')) return path
  return getPublicUrl('images', path)
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-slate-900 mb-4">Unsere Sponsoren</h1>
        <p class="text-lg text-slate-600">
          Herzlichen Dank an alle, die das Fit & Fun Lager unterstützen!
        </p>
      </div>

      <div v-if="sponsoren && sponsoren.length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          v-for="sponsor in sponsoren"
          :key="sponsor.id"
          :href="sponsor.website_url || '#'"
          :target="sponsor.website_url ? '_blank' : undefined"
          :rel="sponsor.website_url ? 'noopener' : undefined"
          class="group bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary-300 transition-all flex flex-col items-center text-center"
          :class="{ 'cursor-default': !sponsor.website_url }"
        >
          <!-- Logo -->
          <div class="w-32 h-32 flex items-center justify-center mb-4">
            <img
              v-if="sponsor.logo_url"
              :src="getLogoUrl(sponsor.logo_url)"
              :alt="sponsor.name"
              class="max-w-full max-h-full object-contain"
            />
            <div v-else class="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl font-bold text-slate-400">{{ sponsor.name.charAt(0) }}</span>
            </div>
          </div>

          <!-- Name -->
          <h3 class="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
            {{ sponsor.name }}
          </h3>

          <!-- Link indicator -->
          <div v-if="sponsor.website_url" class="flex items-center gap-1 mt-2 text-sm text-primary-600">
            <ExternalLink class="w-3 h-3" />
            <span>Website besuchen</span>
          </div>
        </a>
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        Noch keine Sponsoren eingetragen.
      </div>
    </div>
  </div>
</template>
