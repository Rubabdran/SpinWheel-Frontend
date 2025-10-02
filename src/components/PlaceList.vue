<script setup>
const props = defineProps({ places: Array, selected: Array })
const emit = defineEmits(['toggle'])
function isSelected(id){ return props.selected?.some(p => p.id === id) }
</script>
<template>
  <ul class="space-y-2 max-h-80 overflow-auto">
    <li v-for="p in places" :key="p.id" class="flex items-center justify-between p-2 rounded-xl border border-zinc-700">
      <div>
        <div class="font-medium">{{ p.name }}</div>
        <div class="text-xs text-zinc-400">{{ (p.distanceKm) }} km away</div>
      </div>
      <button class="btn" :disabled="!isSelected(p.id) && selected.length >= 5" @click="emit('toggle', p)">
        {{ isSelected(p.id) ? 'Remove' : 'Add' }}
      </button>
    </li>
  </ul>
</template>