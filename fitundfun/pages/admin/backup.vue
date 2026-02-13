<script setup lang="ts">
import { Download, Upload, AlertTriangle, CheckCircle, Loader2, Database, HardDrive, Trash2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Backup & Restore - Fit & Fun Admin',
})

// Backup State
const isCreatingBackup = ref(false)
const backupError = ref('')
const backupSuccess = ref(false)

// Restore State
const isRestoring = ref(false)
const restoreError = ref('')
const restoreSuccess = ref(false)
const restoreResults = ref<any>(null)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Restore Options
const restoreOptions = reactive({
  restore_data: true,
  restore_storage: true,
  clear_existing: false
})

// Confirmation Dialog
const showConfirmDialog = ref(false)
const confirmAction = ref<'restore' | 'restore-clear' | null>(null)

/**
 * Backup erstellen und herunterladen
 */
const createBackup = async () => {
  isCreatingBackup.value = true
  backupError.value = ''
  backupSuccess.value = false

  try {
    const response = await fetch('/api/admin/backup', {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Backup konnte nicht erstellt werden')
    }

    // Blob erstellen und herunterladen
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitundfun-backup-${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    backupSuccess.value = true
    setTimeout(() => {
      backupSuccess.value = false
    }, 5000)
  } catch (e: any) {
    backupError.value = e.message || 'Fehler beim Erstellen des Backups'
  } finally {
    isCreatingBackup.value = false
  }
}

/**
 * Datei auswählen
 */
const selectFile = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    const file = target.files[0]
    
    // Validierung
    if (!file.name.endsWith('.zip')) {
      restoreError.value = 'Bitte eine ZIP-Datei auswählen'
      selectedFile.value = null
      return
    }
    
    if (file.size > 500 * 1024 * 1024) { // 500MB max
      restoreError.value = 'Datei zu gross (max. 500MB)'
      selectedFile.value = null
      return
    }
    
    selectedFile.value = file
    restoreError.value = ''
    restoreResults.value = null
  }
}

/**
 * Restore starten (mit Bestätigung)
 */
const startRestore = () => {
  if (!selectedFile.value) {
    restoreError.value = 'Bitte zuerst eine Backup-Datei auswählen'
    return
  }
  
  confirmAction.value = restoreOptions.clear_existing ? 'restore-clear' : 'restore'
  showConfirmDialog.value = true
}

/**
 * Restore bestätigt - ausführen
 */
const confirmRestore = async () => {
  showConfirmDialog.value = false
  
  if (!selectedFile.value) return
  
  isRestoring.value = true
  restoreError.value = ''
  restoreSuccess.value = false
  restoreResults.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('options', JSON.stringify(restoreOptions))

    const response = await fetch('/api/admin/restore', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.statusMessage || 'Restore fehlgeschlagen')
    }

    restoreResults.value = data.results
    restoreSuccess.value = true
    selectedFile.value = null
    
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } catch (e: any) {
    restoreError.value = e.message || 'Fehler beim Wiederherstellen'
  } finally {
    isRestoring.value = false
  }
}

const cancelRestore = () => {
  showConfirmDialog.value = false
  confirmAction.value = null
}

/**
 * Dateigrösse formatieren
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Backup & Restore</h1>
      <p class="text-slate-600 mt-2">
        Erstelle ein vollständiges Backup aller Daten oder stelle ein vorhandenes Backup wieder her.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Backup erstellen -->
      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-primary-100 rounded-lg">
            <Download class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Backup erstellen</h2>
            <p class="text-sm text-slate-500">Alle Daten als ZIP herunterladen</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p class="font-medium text-slate-700 mb-2">Das Backup enthält:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Alle Lager-Einträge</li>
              <li>Sponsoren-Daten</li>
              <li>Lagerhaus-Informationen</li>
              <li>Website-Einstellungen</li>
              <li>Kontakt-Nachrichten</li>
              <li>Alle hochgeladenen Bilder & PDFs</li>
            </ul>
          </div>

          <!-- Erfolg -->
          <div v-if="backupSuccess" class="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
            <CheckCircle class="w-5 h-5" />
            <span>Backup wurde heruntergeladen!</span>
          </div>

          <!-- Fehler -->
          <div v-if="backupError" class="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            <AlertTriangle class="w-5 h-5" />
            <span>{{ backupError }}</span>
          </div>

          <button
            @click="createBackup"
            :disabled="isCreatingBackup"
            class="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Loader2 v-if="isCreatingBackup" class="w-5 h-5 animate-spin" />
            <Download v-else class="w-5 h-5" />
            {{ isCreatingBackup ? 'Backup wird erstellt...' : 'Backup herunterladen' }}
          </button>
        </div>
      </div>

      <!-- Backup wiederherstellen -->
      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-orange-100 rounded-lg">
            <Upload class="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Backup wiederherstellen</h2>
            <p class="text-sm text-slate-500">Daten aus Backup-Datei importieren</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Datei-Upload -->
          <div>
            <input
              ref="fileInputRef"
              type="file"
              accept=".zip"
              class="hidden"
              @change="handleFileChange"
            />
            
            <div
              @click="selectFile"
              class="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-slate-50 transition-colors"
            >
              <Upload class="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p v-if="!selectedFile" class="text-slate-600">
                Backup-Datei auswählen (.zip)
              </p>
              <div v-else class="text-primary-600">
                <p class="font-medium">{{ selectedFile.name }}</p>
                <p class="text-sm text-slate-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
          </div>

          <!-- Optionen -->
          <div class="space-y-3">
            <p class="text-sm font-medium text-slate-700">Optionen:</p>
            
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="restoreOptions.restore_data"
                type="checkbox"
                class="w-4 h-4 text-primary-600 rounded border-slate-300"
              />
              <Database class="w-4 h-4 text-slate-500" />
              <span class="text-sm text-slate-700">Datenbank-Daten wiederherstellen</span>
            </label>
            
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="restoreOptions.restore_storage"
                type="checkbox"
                class="w-4 h-4 text-primary-600 rounded border-slate-300"
              />
              <HardDrive class="w-4 h-4 text-slate-500" />
              <span class="text-sm text-slate-700">Bilder & Dateien wiederherstellen</span>
            </label>
            
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="restoreOptions.clear_existing"
                type="checkbox"
                class="w-4 h-4 text-red-600 rounded border-slate-300"
              />
              <Trash2 class="w-4 h-4 text-red-500" />
              <span class="text-sm text-red-700">Bestehende Daten vorher löschen</span>
            </label>
          </div>

          <!-- Warnung -->
          <div v-if="restoreOptions.clear_existing" class="flex items-start gap-2 text-amber-700 bg-amber-50 px-4 py-3 rounded-lg text-sm">
            <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5" />
            <span>
              <strong>Achtung:</strong> Alle bestehenden Daten werden gelöscht und durch das Backup ersetzt!
            </span>
          </div>

          <!-- Fehler -->
          <div v-if="restoreError" class="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            <AlertTriangle class="w-5 h-5" />
            <span>{{ restoreError }}</span>
          </div>

          <!-- Erfolg -->
          <div v-if="restoreSuccess && restoreResults" class="bg-green-50 rounded-lg p-4">
            <div class="flex items-center gap-2 text-green-700 mb-3">
              <CheckCircle class="w-5 h-5" />
              <span class="font-medium">Backup erfolgreich wiederhergestellt!</span>
            </div>
            
            <div class="text-sm text-green-700 space-y-2">
              <p v-if="restoreResults.restored_tables?.length">
                <strong>Tabellen:</strong> {{ restoreResults.restored_tables.join(', ') }}
              </p>
              <p v-if="restoreResults.restored_files?.length">
                <strong>Dateien:</strong> {{ restoreResults.restored_files.length }} Dateien
              </p>
              <div v-if="restoreResults.errors?.length" class="text-amber-700">
                <strong>Warnungen:</strong>
                <ul class="list-disc list-inside mt-1">
                  <li v-for="(error, index) in restoreResults.errors.slice(0, 5)" :key="index">
                    {{ error }}
                  </li>
                  <li v-if="restoreResults.errors.length > 5">
                    ... und {{ restoreResults.errors.length - 5 }} weitere
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <button
            @click="startRestore"
            :disabled="isRestoring || !selectedFile"
            class="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Loader2 v-if="isRestoring" class="w-5 h-5 animate-spin" />
            <Upload v-else class="w-5 h-5" />
            {{ isRestoring ? 'Wiederherstellung läuft...' : 'Backup wiederherstellen' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bestätigungs-Dialog -->
    <div v-if="showConfirmDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="cancelRestore" />
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle class="w-6 h-6 text-amber-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900">Backup wiederherstellen?</h3>
        </div>

        <p v-if="confirmAction === 'restore-clear'" class="text-slate-600 mb-6">
          <strong class="text-red-600">Alle bestehenden Daten werden gelöscht</strong> und durch die Daten aus dem Backup ersetzt. Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <p v-else class="text-slate-600 mb-6">
          Die Daten aus dem Backup werden importiert. Bestehende Einträge mit gleicher ID werden überschrieben.
        </p>

        <div class="flex gap-3">
          <button
            @click="cancelRestore"
            class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            @click="confirmRestore"
            :class="[
              'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
              confirmAction === 'restore-clear' 
                ? 'bg-red-600 text-white hover:bg-red-500' 
                : 'bg-primary-600 text-white hover:bg-primary-500'
            ]"
          >
            {{ confirmAction === 'restore-clear' ? 'Ja, alles löschen & wiederherstellen' : 'Wiederherstellen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
