<template>
  <v-card class="pa-2" :data-eid="eid('root')">
    <!-- Header -->
    <v-card-title class="viewer-header" :data-eid="eid('header')">
      <v-tooltip
       v-if="selectedItem"
       location="bottom"
       :open-delay="350"
       :close-delay="150"
      >
        <template #activator="{ props: tipProps }">
          <div
           v-bind="tipProps"
           class="viewer-title viewer-title--ellipsis"
           :data-eid="eid('title')"
          >
            <span class="label">Filename:</span>
            <span class="value">{{ filename }}</span>
            <span v-if="videoId" class="value"> (Video ID: {{ videoId }})</span>
          </div>
        </template>

        <div class="tooltip-surface">
          Filename: {{ filename }}<span v-if="videoId"> (Video ID: {{ videoId }})</span>
        </div>
      </v-tooltip>

      <div v-else class="viewer-title" :data-eid="eid('title')">No item selected</div>
      <MediaMetadataPopover
       :model-id="activeModelId"
       :item="selectedItem"
       :group="selectedGroup"
       :is-main-key="filterStore.isMain"
       :is-group-key="filterStore.isGroup"
      />
      
      <div class="d-flex align-center ga-2 viewer-header-actions">
        <v-tooltip text="Excludes video from search results in this model/tab">
          <template #activator="{ props: tipProps }">
            <v-btn
             v-bind="tipProps"
             :data-eid="eid('exclude_video_btn')"
             :color="isExcluded ? 'grey' : 'yellow'"
             :disabled="!selectedItem"
             @click="exclude"
             size="small"
             variant="outlined"
            >
              Exclude
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Close Viewer">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              :data-eid="eid('close_btn')"
              size="small"
              icon
              color="red"
              @click="closeViewer"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </v-card-title>

    <!-- Media -->
    <v-card-text class="viewer-body" :data-eid="eid('viewer_body')">
      <template v-if="selectedItem && selectedGroup && isGroupVideo">
        <video
         ref="videoPlayer"
         :data-eid="eid('video_player')"
         :data-looping="loopSegment ? '1' : '0'"
         :key="(selectedGroup?.src ?? '') + '-video-player'"
         :src="selectedGroup.src"
         :poster="selectedItem.thumbPath"
         controls
         autoplay
         muted
         @loadedmetadata="onLoadedMetadata"
         @timeupdate="onTimeUpdate"
         class="viewer-video"
        >
          Your browser does not support the video tag.
        </video>
      </template>

      <AlbumViewer
        v-else-if="selectedItem && selectedItem.mediaType === MediaType.Image"
        :item="selectedItem"
      />
      <AudioPlayer
        v-else-if="selectedItem && selectedItem.mediaType === MediaType.Audio"
        :item="selectedItem"
      />

      <!-- Compact controls directly under media -->
      <div v-if="selectedItem" class="viewer-controls" :data-eid="eid('controls')">
        <div class="d-flex align-center ga-2">
          <v-btn
            color="teal"
            size="small"
            variant="flat"
            :data-eid="eid('submit_btn')"
            @click="submitCurrent"
          >
            Submit
            <span class="ml-2 opacity-80">({{ Math.round(currentTime) }})</span>
          </v-btn>

          <v-chip
            v-if="segment.hasSegment"
            size="small"
            variant="outlined"
            :data-eid="eid('segment_chip')"
          >
            {{ Math.round(segment.startMs/1000) }}–{{ Math.round(segment.endMs/1000) }}s
          </v-chip>
        </div>

        <div class="d-flex align-center ga-2">
          <v-tooltip text="Loop this segment">
            <template #activator="{ props: tipProps }">
              <v-switch
               v-bind="tipProps"
               v-if="segment.hasSegment"
               v-model="loopSegment"
               :data-eid="eid('loop_segment_switch')"
               hide-details
               density="compact"
               color="teal"
               inset
              />
            </template>
          </v-tooltip>
        </div>
      </div> 

      <!-- Related summary -->
      <div v-if="selectedItem && selectedGroup" class="related-block" :data-eid="eid('related_block')">
        <RelatedItemsGrid
          :data-eid="eid('related_grid')"
          :model-id="activeModelId"
          :media-item="selectedItem"
          :related-items="selectedGroup.items"
          @select-item="updateSelected"
        />
      </div> 
    </v-card-text>

    <v-snackbar
      v-model="snackbar"
      :timeout="snackTimeout"
      location="bottom left"
      :color="snackColor"
    >
      {{ text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar=false" icon="mdi-close" />
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import AlbumViewer from './AlbumViewer.vue'
import AudioPlayer from './AudioPlayer.vue'
import RelatedItemsGrid from './RelatedItemsGrid.vue'
import { MediaType } from '@/types/mediaitem'
import { useItemStore } from '@/stores/item'
import { useModelStore } from '@/stores/model'
import { useAppStore } from '@/stores/app'
import { isGroupExcluded, logEvents, submitAnswer } from '@/services/ExquisitorAPI'
import { useFilterStore } from '@/stores/filter'

const modelStore = useModelStore()
const itemStore = useItemStore()
const filterStore = useFilterStore()

const activeModelId = computed(() => modelStore.activeModel!.id)
const selectedItem = computed(() => itemStore.getSelectedItem())
const selectedGroup = computed(() => itemStore.getSelectedGroup())

const eidBase = computed(() => `media_viewer_model_${activeModelId.value}_item_${selectedItem.value?.id ?? 'none'}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

const filename = computed(() => {
  const tp = selectedItem.value?.thumbPath ?? ''
  return tp ? tp.split('/').slice(-1)[0] : ''
})

const videoId = computed(() => {
  const md: any = selectedItem.value?.metadata ?? {}
  return md['Video ID'] ?? ''
})

const isGroupVideo = computed(() => selectedGroup.value?.groupMediaType === MediaType.Video)

const loopSegment = ref(true)
const videoPlayer = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)

const lastVideoSrc = ref<string | null>(null)

// snackbar
const snackbar = ref(false)
const snackTimeout = ref(4000)
const snackColor = ref('white')
const text = ref('')

// exclude
const isExcluded = ref(false)

async function checkExclude() {
  const modelId = modelStore.activeModel?.id
  if (!modelId || !selectedItem.value) return

  if (!itemStore.modelExcluded.has(modelId)) {
    isExcluded.value = false
    return
  }

  const excludedItems = Array.from(itemStore.modelExcluded.get(modelId)!)
  isExcluded.value = await isGroupExcluded({
    session_info: {
      session: useAppStore().session,
      collection: modelStore.getModelCollection(modelId),
      modelId: modelId
    },
    itemId: selectedItem.value.id,
    excluded_ids: excludedItems
  })
}

async function exclude() {
  const modelId = modelStore.activeModel?.id
  if (!modelId || !selectedItem.value) return

  if (!isExcluded.value) {
    itemStore.excludeItemGroup(selectedItem.value.id, modelId)
    isExcluded.value = true
  } else {
    itemStore.removeItemFromExclude(selectedItem.value.id)
    isExcluded.value = false
  }
}

const segment = computed(() => {
  const md: any = selectedItem.value?.metadata ?? {}

  const toNum = (v: any): number | null => {
    const n = typeof v === 'string' ? Number(v) : v
    return typeof n === 'number' && Number.isFinite(n) ? n : null
  }

  const s = toNum(md['Start (ms)'])
  const e = toNum(md['End (ms)'])
  if (s != null && e != null && e > s) return { hasSegment: true, startMs: s, endMs: e }

  const k = toNum(md['Keyframe (ms)'])
  if (k != null) return { hasSegment: true, startMs: k, endMs: k + 2000 }

  return { hasSegment: false, startMs: 0, endMs: 0 }
})

function teardownVideo(hard = false) {
  const vid = videoPlayer.value
  if (!vid) return
  vid.pause()

  if (hard) {
    // when changing to a different video file
    vid.removeAttribute('src')
    vid.load()
  }
}

function seekToSegmentStart() {
  const vid = videoPlayer.value
  if (!vid || !segment.value.hasSegment) return
  const startSec = segment.value.startMs / 1000
  vid.fastSeek?.(startSec)
  if (!vid.fastSeek) vid.currentTime = startSec
}

function onLoadedMetadata() {
  seekToSegmentStart()

  if (selectedItem.value && selectedGroup.value) {
    logEvents([{
      ts: Date.now(),
      action: `Video Segment Loaded (media item: ${selectedItem.value.id})`,
      session: useAppStore().session,
      data: JSON.stringify({
        itemId: selectedItem.value.id,
        vid: selectedGroup.value.src,
        seek_second: segment.value.hasSegment ? segment.value.startMs / 1000 : 0
      })
    }])
  }
}

function onTimeUpdate() {
  const vid = videoPlayer.value
  if (!vid) return

  currentTime.value = vid.currentTime

  if (!loopSegment.value || !segment.value.hasSegment) return

  const startSec = segment.value.startMs / 1000
  const endSec = segment.value.endMs / 1000

  if (vid.currentTime > endSec) vid.currentTime = startSec
  if (vid.currentTime < startSec) vid.currentTime = startSec
}

function updateSelected(itemId?: number) {
  if (typeof itemId === 'number') itemStore.setSelectedItem(itemId)
}

watch(
  () => [selectedGroup.value?.src, selectedItem.value?.id] as const,
  async ([src]) => {
    await checkExclude()

    // If no video, just bail
    if (!src || !isGroupVideo.value) return

    const vid = videoPlayer.value
    if (!vid) return

    const isNewVideo = lastVideoSrc.value !== src

    if (isNewVideo) {
      // Hard reset only when switching to a different video src
      teardownVideo(true)

      // Ensure src is set (defensive, because we may have removed it)
      // Even though Vue binds :src, this prevents the "unchanged src" case
      vid.src = src
      vid.load()

      lastVideoSrc.value = src
    }

    // Seek when ready
    await nextTick()
    const seekNow = () => {
      if (segment.value.hasSegment) {
        const startSec = segment.value.startMs / 1000
        vid.currentTime = startSec
      }
      // resume playback so it doesn't appear frozen
      void vid.play().catch(() => {})
    }

    if (vid.readyState >= 1) {
      seekNow()
    } else {
      vid.addEventListener('loadedmetadata', seekNow, { once: true })
    }
  },
  { immediate: true }
)

onUnmounted(() => teardownVideo())

const emit = defineEmits<{ (e: 'closeMediaViewer'): void }>()

function closeViewer() {
  teardownVideo()
  emit('closeMediaViewer')
}

function submitCurrent() {
  if (!selectedItem.value) return

  if (useAppStore().selectedEvaluation.id === '') {
    snackbar.value = true
    snackColor.value = 'error'
    text.value = 'EvaluationId is not set!'
    return
  }

  snackColor.value = 'indigo'

  const start = currentTime.value * 1000
  const end = currentTime.value * 1000

  submitAnswer({
    session_info: {
      session: useAppStore().session,
      modelId: activeModelId.value,
      collection: modelStore.getModelCollection(activeModelId.value)
    },
    name: (selectedItem.value.metadata as any)?.['Video ID'] ?? '',
    text: '',
    qa: false,
    start,
    end,
    evalId: useAppStore().selectedEvaluation.id,
  })
}
</script>

<style scoped>
.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.viewer-header-actions {
  flex-shrink: 0;
}

/* ellipsis title */
.viewer-title--ellipsis {
  min-width: 0;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
}

/* tooltip surface (matches your dark theme) */
.tooltip-surface {
  max-width: 420px;
  white-space: normal;
  overflow-wrap: anywhere;
  background: rgba(46, 52, 66, 0.98);
  color: #E6EAF2;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 8px 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}

.viewer-header-actions {
  flex-shrink: 0;
}

.viewer-body {
  padding-top: 8px;
  padding-bottom: 8px;
}

.viewer-video {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}

/* Controls directly under media */
.viewer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 8px;
  padding-bottom: 6px;
}

/* Related block spacing tightened */
.related-block {
  padding-top: 4px;
  padding-bottom: 6px;
}

.related-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 4px;
}

/* Metadata below summary */
.meta-block {
  padding-top: 8px;
}

/* Meta rows */
.meta-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  align-items: start;
}

.meta-key {
  font-weight: 700;
  font-size: 0.9rem;
  opacity: 0.9;
}

.meta-val {
  min-width: 0;
}

.meta-popover {
  width: min(520px, 92vw);
}

.meta-popover-body {
  max-height: 55vh;
  overflow: auto;
}
</style>