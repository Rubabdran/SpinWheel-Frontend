<script setup>
import { onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  center: { type: Object, required: true },        // { lat, lng }  (user position)
  places: { type: Array, default: () => [] },      // [{ id, name, latitude, longitude, ... }]
  picked: { type: Object, default: null }          // picked place or null
})

let map, userMarker, placesLayer, pickedMarker, routeLine

function ensureMap () {
  if (map) return
  map = L.map('map', { zoomControl: true }).setView([props.center.lat, props.center.lng], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OSM'
  }).addTo(map)

  // 🔵 Distinctive user marker (blue circle)
  userMarker = L.circleMarker([props.center.lat, props.center.lng], {
    radius: 9,
    color: '#2563eb',       // blue-600 stroke
    weight: 3,
    fillColor: '#60a5fa',   // blue-400 fill
    fillOpacity: 0.9
  })
    .addTo(map)
    .bindPopup('You are here')

  placesLayer = L.layerGroup().addTo(map)
}

function renderPlaces () {
  if (!placesLayer) return
  placesLayer.clearLayers()
  ;(props.places || []).forEach(p => {
    L.marker([p.latitude, p.longitude])
      .addTo(placesLayer)
      .bindPopup(`${escapeHtml(p.name)}`)
  })
}

function clearPicked () {
  if (pickedMarker) { map.removeLayer(pickedMarker); pickedMarker = null }
  if (routeLine) { map.removeLayer(routeLine); routeLine = null }
}

function renderPicked () {
  clearPicked()
  if (!props.picked) return

  // 🟠 Highlight picked target
  pickedMarker = L.circleMarker(
    [props.picked.latitude, props.picked.longitude],
    { radius: 10, color: '#A57640', weight: 3, fillColor: '#A57640', fillOpacity: 0.85 }
  )
    .addTo(map)
    // ⛔ Removed the Google Maps link per your request
    .bindPopup(`<b>${escapeHtml(props.picked.name || 'Picked')}</b>`)

  // Draw route and fit bounds
  updateRoute()
}

async function updateRoute () {
  if (!props.picked) return

  if (routeLine) { map.removeLayer(routeLine); routeLine = null }

  const start = [props.center.lat, props.center.lng]
  const dest = [props.picked.latitude, props.picked.longitude]

  // Try OSRM public routing API
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error('OSRM error')
    const data = await res.json()
    const coords = data?.routes?.[0]?.geometry?.coordinates
    if (Array.isArray(coords) && coords.length) {
      const latlngs = coords.map(([lng, lat]) => [lat, lng]) // convert [lng,lat] -> [lat,lng]
      routeLine = L.polyline(latlngs, { weight: 5, opacity: 0.95, color: '#A57640' }).addTo(map)
      const bounds = L.latLngBounds(latlngs)
      bounds.extend(start); bounds.extend(dest)
      map.fitBounds(bounds, { padding: [40, 40] })
      return
    }
  } catch (e) {
    // fall through to straight line
  }

  // Fallback: straight line
  routeLine = L.polyline([start, dest], { dashArray: '6,6', weight: 4, opacity: 0.9, color: '#A57640' }).addTo(map)
  map.fitBounds(L.latLngBounds([start, dest]), { padding: [40, 40] })
}

function updateUserPosition () {
  if (!map || !userMarker) return
  userMarker.setLatLng([props.center.lat, props.center.lng])
}

function escapeHtml (s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll(`'`, '&#39;')
}

onMounted(async () => {
  await nextTick()
  ensureMap()
  renderPlaces()
  renderPicked()
})

watch(() => ({ ...props.center }), () => {
  ensureMap()
  updateUserPosition()
  if (props.picked) updateRoute()
}, { deep: true })

watch(() => props.places, () => {
  ensureMap()
  renderPlaces()
}, { deep: true })

watch(() => props.picked, () => {
  ensureMap()
  renderPicked()
}, { deep: true })
</script>

<template>
  <div id="map" class="w-full h-[600px] rounded-2xl"></div>
</template>
