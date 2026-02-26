<template>
  <v-sheet
    :data-eid="eidTile"
    :data-item-id="itemId"
    :data-model-id="modelId"
    :class="['tile-root', borderClass]"
    :style="rootStyle"
    rounded="lg"
    border
    elevation="0"
    @click="emitOpen"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @mousemove="onMove"
  >
    <div :data-eid="eid('media')" class="tile-media">
      <!-- Loading -->
      <div v-if="!item" :data-eid="eid('skeleton')" class="tile-skeleton">
        <v-skeleton-loader type="image" class="tile-skeleton-inner" />
      </div>

      <template v-else>
        <!-- Always-mounted hover video; only visible when hovering && canHoverPlay -->
        <video
          ref="videoEl"
          :data-eid="eid('hover_video')"
          class="tile-video"
          :class="{ 'tile-video--visible': hovering && canHoverPlay }"
          muted
          playsinline
          preload="metadata"
        />

        <!-- Thumbnail always visible under video -->
        <v-img
          :data-eid="eid('thumb')"
          class="tile-img"
          :class="{ 'tile-img--zoom': hovering && !canHoverPlay }"
          :src="item.thumbPath"
          cover
          :aspect-ratio="aspectRatio"
        >
          <template #placeholder>
            <div :data-eid="eid('thumb_placeholder')" class="tile-placeholder" />
          </template>
        </v-img>

        <!-- Badges -->
        <div v-if="showBadges" :data-eid="eid('badges')" class="tile-badges">
          <v-icon v-if="isPos" :data-eid="eid('badge_pos')" size="16" color="green">mdi-thumb-up</v-icon>
          <v-icon v-if="isNeg" :data-eid="eid('badge_neg')" size="16" color="red">mdi-thumb-down</v-icon>
        </div>

        <!-- Hover overlay actions -->
        <div
          :data-eid="eid('overlay')"
          class="tile-overlay"
          :class="{ 'tile-overlay--show': hovering }"
        >
          <div :data-eid="eid('actions')" class="tile-actions">
            <v-btn
              v-if="btnPos"
              :data-eid="eid('btn_pos')"
              class="tile-btn"
              density="compact"
              size="x-small"
              color="success"
              icon
              :disabled="isPos"
              @click.stop="emitAdd(ILSets.Positives)"
            >
              <v-icon size="16">mdi-thumb-up</v-icon>
            </v-btn>

            <v-btn
              v-if="btnNeg"
              :data-eid="eid('btn_neg')"
              class="tile-btn"
              density="compact"
              size="x-small"
              color="error"
              icon
              :disabled="isNeg"
              @click.stop="emitAdd(ILSets.Negatives)"
            >
              <v-icon size="16">mdi-thumb-down</v-icon>
            </v-btn>

            <v-btn
              v-if="btnSubmit"
              :data-eid="eid('btn_submit')"
              class="tile-btn"
              density="compact"
              size="x-small"
              color="blue"
              icon
              :disabled="isSubmitted"
              @click.stop="emitAdd(ILSets.Submitted)"
            >
              <v-icon size="16">mdi-send</v-icon>
            </v-btn>
          </div>
        </div>
      </template>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type MediaItem from '@/types/mediaitem'
import { GroupMetadata, ILSets, MediaType } from '@/types/mediaitem'
import { useItemStore } from '@/stores/item'

const props = defineProps<{
  itemId: number
  modelId: number

  // Prefetched by ResultGrid
  item: MediaItem | null

  // Prefetched by ResultGrid via group store (can be null)
  groupInfo: GroupMetadata | null

  tileWidth?: number
  aspectRatio?: number

  btnPos?: boolean
  btnNeg?: boolean
  btnSubmit?: boolean

  showBadges?: boolean
  enableHoverPreview?: boolean
}>()

const emit = defineEmits<{
  (e: 'open', itemId: number): void
  (e: 'add', payload: { itemId: number; set: ILSets }): void
  (e: 'remove', payload: { itemId: number; set: ILSets }): void
}>()

const itemStore = useItemStore()

// --- data-eid helpers (include item + model info) ---
const eidBase = computed(() => `item_tile_${props.itemId}_model_${props.modelId}`)
const eidTile = eidBase
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

// --- sizing ---
const aspectRatio = computed(() => props.aspectRatio ?? 16 / 9)
const tileWidth = computed(() => props.tileWidth ?? 220)

// --- UI options ---
const showBadges = computed(() => props.showBadges ?? true)

// --- set membership ---
const isPos = computed(() => itemStore.isItemInPos(props.itemId, props.modelId))
const isNeg = computed(() => itemStore.isItemInNeg(props.itemId, props.modelId))
const isSubmitted = computed(() => itemStore.isItemInSubmitted(props.itemId, props.modelId))

const borderClass = computed(() => {
  if (isPos.value) return 'tile-border--pos'
  if (isNeg.value) return 'tile-border--neg'
  return 'tile-border--none'
})


const mdRef = ref<Record<string, any> | null>(null)
const mdLoading = ref(false)

watchEffect(async () => {
  // only fetch when we have an item and it lacks metadata we need
  if (!props.item) return

  // if already present on the item, use it
  const md = props.item.metadata ?? {}
  const hasStartEnd = md['Start (ms)'] != null && md['End (ms)'] != null
  const hasKeyframe = md['Keyframe (ms)'] != null

  if (hasStartEnd || hasKeyframe) {
    mdRef.value = md
    return
  }

  // avoid re-fetch loops
  if (mdLoading.value) return
  mdLoading.value = true
  try {
    const fetched = await itemStore.fetchItemInfo(props.modelId, props.itemId)
    // IMPORTANT: store it locally so computed stays sync
    mdRef.value = fetched ?? {}
    // Optional (recommended): also merge into the item so other parts see it
    if (props.item.metadata == null) props.item.metadata = {}
    Object.assign(props.item.metadata, mdRef.value)
  } finally {
    mdLoading.value = false
  }
})

const segment = computed(() => {
  const md: any = mdRef.value ?? props.item?.metadata ?? {}

  const toNum = (v: any): number | null => {
    const n = typeof v === 'string' ? Number(v) : v
    return typeof n === 'number' && Number.isFinite(n) ? n : null
  }

  const s = toNum(md['Start (ms)'])
  const e = toNum(md['End (ms)'])
  if (s != null && e != null && e > s) return { isSegment: true, startMs: s, endMs: e }

  const k = toNum(md['Keyframe (ms)'])
  if (k != null) return { isSegment: true, startMs: k, endMs: k + 2000 }

  return { isSegment: false, startMs: null as number | null, endMs: null as number | null }
})

/**
 * Video source selection:
 * - If the item itself is a video segment => item.srcPath
 * - Else if the group is a video => groupInfo.src
 */
const videoSrc = computed<string | null>(() => {
  console.log(props.groupInfo)
  if (!props.item) return null

  if (props.item.mediaType === MediaType.Video && props.item.srcPath) {
    return props.item.srcPath
  }

  if (props.groupInfo?.groupMediaType === MediaType.Video && props.groupInfo.src) {
    return props.groupInfo.src
  }

  return null
})

const canHoverPlay = computed(() => {
  return (
    props.enableHoverPreview !== false &&
    !!props.item &&
    segment.value.isSegment &&
    !!videoSrc.value
  )
})

// --- hover state + playback ---
const hovering = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)

function emitOpen() {
  emit('open', props.itemId)
}

function emitAdd(set: ILSets) {
  emit('add', { itemId: props.itemId, set })
}

function seekMs(ms: number) {
  if (!videoEl.value) return
  try {
    videoEl.value.currentTime = Math.max(0, ms / 1000)
  } catch {}
}

const lastLoadedSrc = ref<string | null>(null)

function resetVideoElement() {
  if (!videoEl.value) return
  try {
    videoEl.value.pause()
    // clearing src resets error state
    videoEl.value.removeAttribute('src')
    videoEl.value.load()
    lastLoadedSrc.value = null
  } catch {}
}

async function ensureVideoSrcLoaded(): Promise<boolean> {
  if (!videoEl.value) return false
  if (!videoSrc.value) return false

  // If src changed, load it fresh
  if (lastLoadedSrc.value !== videoSrc.value) {
    try {
      videoEl.value.pause()
      videoEl.value.src = videoSrc.value
      videoEl.value.load()
      lastLoadedSrc.value = videoSrc.value
    } catch {
      return false
    }
  }

  // Wait for metadata so seeking works reliably
  if (videoEl.value.readyState >= 1) return true // HAVE_METADATA
  await new Promise<void>((resolve) => {
    const el = videoEl.value!
    const onMeta = () => { el.removeEventListener('loadedmetadata', onMeta); resolve() }
    el.addEventListener('loadedmetadata', onMeta, { once: true })
  })
  return true
}

async function playPreview() {
  if (!canHoverPlay.value || !videoEl.value) return

  const ok = await ensureVideoSrcLoaded()
  if (!ok) return

  seekMs(segment.value.startMs!)
  // muted + user hover gesture should allow play
  void videoEl.value.play().catch(() => {})
}

function stopPreview() {
  if (!videoEl.value) return
  videoEl.value.pause()
  // optional: reset on leave to avoid keeping lots of decoders active
  resetVideoElement()
}

function onEnter() {
  hovering.value = true
  // Try immediately; if item/group src becomes available while hovering, watcher below starts it.
  playPreview()
}

function onLeave() {
  hovering.value = false
  stopPreview()
}

// If hover capability flips to true while still hovering, start automatically.
watch(
  () => [hovering.value, canHoverPlay.value, videoSrc.value],
  ([h, ok]) => {
    if (h && ok) playPreview()
  }
)

function onMove(e: MouseEvent) {
  if (!hovering.value || !canHoverPlay.value || !videoEl.value) return

  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width)
  const frac = rect.width > 0 ? x / rect.width : 0

  const start = segment.value.startMs!
  const end = segment.value.endMs!
  seekMs(start + frac * Math.max(1, end - start))
}

const rootStyle = computed(() => ({
  '--tile-w': `${tileWidth.value}px`,
  '--tile-ar': `${aspectRatio.value}`
}))
</script>

<style scoped>
.tile-root {
  width: 100%;
  max-width: var(--tile-w);
  cursor: pointer;
  overflow: hidden;
  background: transparent;
}

.tile-media {
  position: relative;
  width: 100%;
  aspect-ratio: var(--tile-ar);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.06);
}

.tile-img {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* Slight zoom hover when no video-hover preview is active */
.tile-img :deep(img) {
  transition: transform 140ms ease;
}
.tile-img--zoom :deep(img) {
  transform: scale(1.04);
}

.tile-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease-in-out;
}
.tile-video--visible {
  opacity: 1;
}

.tile-overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease-in-out;
  z-index: 3;

  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.tile-overlay--show {
  opacity: 1;
  pointer-events: auto;
}

.tile-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 6px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0));
}

.tile-btn {
  min-width: 28px !important;
  width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
  border-radius: 8px !important;
}

.tile-badges {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
}

.tile-placeholder {
  width: 100%;
  height: 100%;
  opacity: 0.5;
}

/* Skeleton container */
.tile-skeleton {
  width: 100%;
  height: 100%;
}
.tile-skeleton-inner :deep(.v-skeleton-loader__image) {
  height: 100%;
}

/* Border reflects set membership */
.tile-border--none {
  border: 3px solid rgba(0,0,0,0.12) !important;
}
.tile-border--pos {
  border: 3px solid rgba(76, 175, 80, 0.9) !important;
}
.tile-border--neg {
  border: 3px solid rgba(244, 67, 54, 0.9) !important;
}
</style>