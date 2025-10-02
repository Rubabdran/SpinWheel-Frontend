<script setup>
import { ref, computed, onMounted } from 'vue'
import CategoryChips from './components/CategoryChips.vue'
import PlaceList from './components/PlaceList.vue'
import MapView from './components/MapView.vue'
import WheelPicker from './components/WheelPicker.vue'
import { fetchNearest } from './api'

const categories = [
  { key: 'CAFE', label: 'Cafe' },
  { key: 'RESTAURANT', label: 'Restaurant' },
  { key: 'MALL', label: 'Mall' },
  { key: 'ENTERTAINMENT', label: 'Entertainment' },
  { key: 'BOULEVARD', label: 'Boulevard' }
]

const selectedCategory = ref('CAFE')
const userPos = ref({ lat: 24.7136, lng: 46.6753 }) // fallback (Riyadh center)
const accuracy = ref(null)
const geoStatus = ref('Detecting location…')
const geoError = ref(null)
let watchId = null

const places = ref([])
const selected = ref([])
const picked = ref(null)
const spinning = ref(false)

function toggleSelect(place) {
  const i = selected.value.findIndex(p => p.id === place.id)
  if (i >= 0) selected.value.splice(i, 1)
  else if (selected.value.length < 5) selected.value.push(place)
}

const canSpin = computed(() => selected.value.length > 1 && !spinning.value)

async function load() {
  const data = await fetchNearest({ lat: userPos.value.lat, lng: userPos.value.lng, category: selectedCategory.value })
  places.value = data.map(d => ({ ...d, distanceKm: (d.distanceMeters/1000).toFixed(2) }))
}

function onSpinDone(result) { picked.value = result }

function requestGeo() {
  geoError.value = null
  if (!('geolocation' in navigator)) {
    geoStatus.value = 'Geolocation not supported'
    return
  }

  const opts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }

  // One-time fix to get an accurate first reading
  navigator.geolocation.getCurrentPosition(
    pos => {
      userPos.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      accuracy.value = pos.coords.accuracy // meters
      geoStatus.value = `Location OK (±${Math.round(accuracy.value)} m)`
      load()

      // Watch for small drifts and keep improving accuracy
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      watchId = navigator.geolocation.watchPosition(
        p => {
          userPos.value = { lat: p.coords.latitude, lng: p.coords.longitude }
          accuracy.value = p.coords.accuracy
        },
        err => { /* ignore watch errors */ },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
      )
    },
    err => {
      geoError.value = err.message
      geoStatus.value = 'Using fallback location (check HTTPS/permissions/VPN)'
      load()
    },
    opts
  )
}

onMounted(() => {
  requestGeo()
})

function onCategoryChange(val){ selectedCategory.value = val; load(); }
</script>

<template>
      <!-- Hero Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent mb-3">
        Let's Pick Randomly
      </h1>
      <p class="text-white/60 text-lg">Choose a category, select your favorites, and let the wheel decide!</p>
    </div>
    
  <div class="max-w-6xl mx-auto p-4 grid md:grid-cols-2 gap-4">
    
    <div class="space-y-4">
      <div class="card">
        <h2 class="text-xl font-semibold mb-2">Choose Category</h2>
        <CategoryChips :categories="categories" :modelValue="selectedCategory" @update:modelValue="onCategoryChange" />
        <!-- <div class="text-xs text-zinc-400 mt-2">
          {{ geoStatus }} <span v-if="geoError" class="text-red-400">— {{ geoError }}</span>
          <button class="btn ml-2" @click="requestGeo">Use precise location</button>
        </div> -->
      </div>

      <div class="card">
        <h2 class="text-xl font-semibold mb-2">Nearby (sorted by distance)</h2>
        <PlaceList :places="places" :selected="selected" @toggle="toggleSelect" />
        <p class="mt-2 text-sm text-zinc-400">Select up to 5 items.</p>
      </div>

      <div class="card">
        <h2 class="text-xl font-semibold mb-2">Spin Wheel</h2>
        <WheelPicker :items="selected" :disabled="!canSpin" @done="onSpinDone" />
        <div v-if="picked" class="mt-3">🎉 Picked: <b>{{ picked.name }}</b></div>
      </div>
    </div>

    <div class="card">
      <!-- Pass picked too so the map can draw the route -->
      <MapView :center="userPos" :places="places" :picked="picked" />
    </div>
  </div>
</template>
