<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
const props = defineProps({
  items: { type: Array, default: () => [] },
  disabled: Boolean
})
const emit = defineEmits(['done'])

const spinning = ref(false)
const angle = ref(0)
let canvas, ctx

function draw(){
  if (!ctx) return
  const DPR = window.devicePixelRatio || 1
  const size = 300
  canvas.width = size * DPR
  canvas.height = size * DPR
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

  const w = size, h = size
  const cx = w/2, cy = h/2, r = 140
  ctx.clearRect(0,0,w,h)

  const n = Math.max(props.items.length, 1)
  for (let i=0;i<n;i++){
    const start = (2*Math.PI*i)/n
    const end   = (2*Math.PI*(i+1))/n
    ctx.beginPath()
    ctx.moveTo(cx,cy)
    ctx.arc(cx,cy,r,start,end)
    ctx.closePath()
    ctx.fillStyle = `hsl(${(i*360/n)|0} 70% 50%)`
    ctx.fill()

    const label = props.items[i]?.name ?? '—'
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(start + (end-start)/2)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    // basic label truncation
    const text = label.length > 22 ? label.slice(0,22) + '…' : label
    ctx.fillText(text, r*0.2, 0)
    ctx.restore()
  }

  // center hub
  ctx.beginPath(); ctx.arc(cx,cy,18,0,2*Math.PI); ctx.fillStyle='#111'; ctx.fill()
  // pointer
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.moveTo(cx, cy - r - 8); ctx.lineTo(cx-10, cy - r - 28); ctx.lineTo(cx+10, cy - r - 28); ctx.closePath(); ctx.fill()
}

onMounted(async () => {
  await nextTick()
  canvas = document.getElementById('wheel')
  ctx = canvas.getContext('2d')
  draw()
})

// react to push/splice and name changes on the SAME array reference
watch(
  () => [props.items.length, ...props.items.map(i => i?.name ?? '')].join('|'),
  () => {
    angle.value = 0
    if (canvas) canvas.style.transform = 'rotate(0deg)'
    draw()
  }
)

function spin(){
  if (spinning.value || props.items.length < 2) return
  spinning.value = true
  const n = props.items.length
  const segment = 360/n
  const targetIndex = Math.floor(Math.random()*n)
  const targetAngle = 360*8 + (targetIndex*segment) + segment/2
  const start = angle.value % 360
  const delta = targetAngle - start
  const duration = 3000
  const t0 = performance.now()

  const tick = (t)=>{
    const p = Math.min(1, (t - t0)/duration)
    const ease = 1 - Math.pow(1-p,3)
    angle.value = start + delta*ease
    canvas.style.transform = `rotate(${angle.value}deg)`
    if (p < 1) requestAnimationFrame(tick)
    else { spinning.value = false; emit('done', props.items[targetIndex]) }
  }
  requestAnimationFrame(tick)
}
</script>

<template>
  <div class="flex items-center gap-4">
    <canvas id="wheel" class="rounded-full border border-zinc-700"></canvas>
    <button class="btn" :disabled="disabled || spinning" @click="spin">Spin</button>
  </div>
</template>
