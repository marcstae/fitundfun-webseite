<script setup lang="ts">
import { ArrowRight, Calendar, MapPin, Phone, Sparkles, Mountain, Users } from 'lucide-vue-next'

useHead({
  title: 'Fit & Fun Familien Lager',
})

const client = useSupabaseClient()
const { getPublicUrl } = useStorageUrl()
const { formatDate } = useFormat()

// Fetch aktuelles Lager
const { data: aktuellesLager } = await useAsyncData('aktuelles-lager', async () => {
  const { data } = await client
    .from('lager')
    .select('*')
    .eq('ist_aktuell', true)
    .single()
  return data
})

// Fetch Settings
const { data: settings } = await useAsyncData('settings', async () => {
  const { data } = await client
    .from('settings')
    .select('*')
    .single()
  return data
})

const getHeroImageUrl = computed(() => {
  if (!settings.value?.hero_image_url) return ''
  if (settings.value.hero_image_url.startsWith('http')) {
    const { fixStorageUrl } = useStorageUrl()
    return fixStorageUrl(settings.value.hero_image_url)
  }
  return getPublicUrl('images', settings.value.hero_image_url)
})

// Aktivitäten für die Animation
const activities = [
  'Skifahren',
  'Snowboarden', 
  'Schneeschuhlaufen',
  'Fackelabfahrt',
  'Skirennen',
  'Iglubauen'
]

const currentActivityIndex = ref(0)

onMounted(() => {
  setInterval(() => {
    currentActivityIndex.value = (currentActivityIndex.value + 1) % activities.length
  }, 2500)
})
</script>

<template>
  <div class="overflow-hidden">
    <!-- Hero Section - Modern Gradient with Glassmorphism -->
    <section class="relative min-h-[85vh] flex items-center justify-center gradient-animated overflow-hidden">
      <!-- Decorative Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <!-- Floating Shapes -->
        <div class="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float" style="animation-delay: -3s" />
        <div class="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-float" style="animation-delay: -5s" />
        
        <!-- Grid Pattern Overlay -->
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" />
      </div>

      <!-- Background Image (wenn vorhanden) -->
      <div
        v-if="getHeroImageUrl"
        class="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
        :style="{ backgroundImage: `url(${getHeroImageUrl})` }"
      />

      <!-- Main Content -->
      <div class="relative z-10 text-center px-4 py-16 max-w-5xl mx-auto">
        <!-- Badge -->
        <div class="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
          <Sparkles class="w-4 h-4 text-orange-400" />
          <span>Seit 2007 unvergessliche Winterwochen</span>
        </div>

        <!-- Main Title -->
        <h1 class="animate-fade-in-up delay-100 text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
          Fit <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">&</span> Fun
        </h1>
        
        <!-- Subtitle -->
        <p class="animate-fade-in-up delay-200 text-xl md:text-2xl text-white/80 mb-4 font-light">
          Familien Skilager in Brigels, Graubünden
        </p>
        
        <!-- Animated Activity Text -->
        <div class="animate-fade-in-up delay-300 h-8 mb-10">
          <p class="text-lg text-orange-300 font-medium">
            <Transition name="fade" mode="out-in">
              <span :key="currentActivityIndex">{{ activities[currentActivityIndex] }}</span>
            </Transition>
          </p>
        </div>

        <!-- CTA Buttons -->
        <div class="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            v-if="aktuellesLager"
            to="/lager"
            class="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300"
          >
            <span>Lager {{ aktuellesLager.jahr }}</span>
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </NuxtLink>
          
          <NuxtLink
            to="/archiv"
            class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white/90 border border-white/20 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-300"
          >
            <span>Lager Archiv</span>
          </NuxtLink>
        </div>

        <!-- Date Info -->
        <div v-if="aktuellesLager" class="animate-fade-in-up delay-500 mt-12 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
          <Calendar class="w-5 h-5 text-orange-400" />
          <span class="text-white/90">
            {{ formatDate(aktuellesLager.datum_von) }} – {{ formatDate(aktuellesLager.datum_bis) }}
          </span>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div class="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div class="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>

    <!-- Quick Info Cards - Floating Style -->
    <section class="relative -mt-20 z-20 px-4">
      <div class="container mx-auto max-w-6xl">
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Nächstes Lager -->
          <div class="group bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="flex items-start gap-5">
              <div class="p-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30">
                <Calendar class="w-7 h-7 text-white" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-slate-900 text-lg mb-2">Nächstes Lager</h3>
                <p v-if="aktuellesLager" class="text-slate-600 leading-relaxed">
                  {{ formatDate(aktuellesLager.datum_von) }}<br/>
                  <span class="text-slate-400">bis</span> {{ formatDate(aktuellesLager.datum_bis) }}
                </p>
                <p v-else class="text-slate-400">Wird bald bekannt gegeben</p>
              </div>
            </div>
          </div>

          <!-- Lagerhaus -->
          <NuxtLink 
            to="/lagerhaus" 
            class="group bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer"
          >
            <div class="flex items-start gap-5">
              <div class="p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30">
                <MapPin class="w-7 h-7 text-white" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-slate-900 text-lg mb-2">Lagerhaus</h3>
                <p class="text-slate-600 mb-3">Crestneder, Brigels</p>
                <span class="inline-flex items-center gap-1 text-primary-600 font-medium group-hover:gap-2 transition-all">
                  Mehr erfahren
                  <ArrowRight class="w-4 h-4" />
                </span>
              </div>
            </div>
          </NuxtLink>

          <!-- Kontakt -->
          <NuxtLink 
            to="/kontakt" 
            class="group bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer"
          >
            <div class="flex items-start gap-5">
              <div class="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                <Phone class="w-7 h-7 text-white" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-slate-900 text-lg mb-2">Kontakt</h3>
                <p class="text-slate-600 mb-3">Fragen? Schreib uns!</p>
                <span class="inline-flex items-center gap-1 text-primary-600 font-medium group-hover:gap-2 transition-all">
                  Nachricht senden
                  <ArrowRight class="w-4 h-4" />
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- About Section - Modern Layout -->
    <section class="py-24 px-4">
      <div class="container mx-auto max-w-6xl">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <!-- Text Content -->
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
              <Mountain class="w-4 h-4" />
              <span>Seit 2007</span>
            </div>
            
            <h2 class="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Unvergessliche<br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">Winterwochen</span>
            </h2>
            
            <p class="text-lg text-slate-600 leading-relaxed mb-8">
              Das Fit & Fun Familienlager bietet jedes Jahr eine unvergessliche Woche für Jugendliche und Familien. Ob auf der Piste, beim Schneeschuhlaufen oder abends beim gemütlichen Beisammensein – hier entstehen Freundschaften und Erinnerungen fürs Leben.
            </p>
            
            <div class="flex flex-wrap gap-3">
              <span class="px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium">Skifahren</span>
              <span class="px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium">Snowboarden</span>
              <span class="px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium">Fackelabfahrt</span>
              <span class="px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium">Iglubauen</span>
              <span class="px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium">Skirennen</span>
              <span class="px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium">Spieleabende</span>
            </div>
          </div>
          
          <!-- Stats Cards -->
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white">
              <div class="text-5xl font-bold mb-2">19+</div>
              <div class="text-primary-200">Jahre Erfahrung</div>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white">
              <div class="text-5xl font-bold mb-2">7</div>
              <div class="text-orange-200">Tage Abenteuer</div>
            </div>
            <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
              <div class="text-5xl font-bold text-slate-900 mb-2">
                <Users class="w-12 h-12 text-primary-600 inline" />
              </div>
              <div class="text-slate-600">Familien & Jugendliche</div>
            </div>
            <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
              <div class="text-5xl font-bold text-slate-900 mb-2">
                <Mountain class="w-12 h-12 text-primary-600 inline" />
              </div>
              <div class="text-slate-600">Brigels, Graubünden</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 px-4 bg-slate-50">
      <div class="container mx-auto max-w-4xl text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
          Bereit für dein Abenteuer?
        </h2>
        <p class="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          Informiere dich über das nächste Lager oder stöbere in unseren vergangenen Lagern voller Erinnerungen.
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            to="/lager"
            class="group inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-slate-800 transition-colors"
          >
            <span>Aktuelles Lager</span>
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </NuxtLink>
          
          <NuxtLink
            to="/sponsoren"
            class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-white transition-all"
          >
            Unsere Sponsoren
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
