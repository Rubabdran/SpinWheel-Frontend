<script setup>
const props = defineProps({ categories: Array, modelValue: String })
const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <div class="flex flex-wrap gap-2">
    <button v-for="c in categories" :key="c.key"
            class="chip" :class="{ 'active': c.key === modelValue }"
            @click="emit('update:modelValue', c.key)">
      {{ c.label }}
    </button>
  </div>
</template>