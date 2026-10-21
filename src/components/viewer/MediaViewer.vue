<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <v-card class="pa-2 viewer-card" :data-eid="eid('root')">
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
            {{ headerTitle }}
          </div>
        </template>

        <div class="tooltip-surface">{{ headerTitle }}</div>
      </v-tooltip>

      <div v-else class="viewer-title" :data-eid="eid('title')">No item selected</div>
      <MediaMetadataPopover
       :model-id="activeModelId"
       :item="selectedItem"
       :group="selectedGroup ?? null"
       :filename="filename"
       :is-main-key="filterStore.isMain"
       :is-group-key="filterStore.isGroup"
      />
      
      <div class="d-flex align-center ga-2 viewer-header-actions">
        <v-tooltip text="Excludes video from search results in this model/tab">
          <template #activator="{ props: tipProps }">
            <v-btn
             v-bind="tipProps"
             :data-eid="eid('exclude_video_btn')"
             :color="isExcluded ? 'grey' : 'warning'"
             :disabled="!selectedItem"
             @click="exclude"
             size="small"
             variant="outlined"
            >
              <span class="pr-1">Exclude</span>
              <v-icon>mdi-cancel</v-icon>
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
         :poster="selectedItem.thumbPath"
         controls
         autoplay
         muted
         @loadedmetadata="onLoadedMetadata"
         @loadeddata="settleVideo"
         @timeupdate="onTimeUpdate"
         class="viewer-video"
        >
          Your browser does not support the video tag.
        </video>
      </template>

      <!-- Show the keyframe while the selected item's video is loading -->
      <div v-else-if="selectedItem && !selectedGroup" class="viewer-loading" :data-eid="eid('loading')">
        <v-img :src="selectedItem.thumbPath" :aspect-ratio="16 / 9" />
        <div v-if="itemStore.selectionFailed" class="text-caption text-error mt-1" :data-eid="eid('load_failed')">
          Couldn't load this video.
        </div>
        <v-progress-linear v-else indeterminate color="indigo" />
      </div>

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
          v-if="appStore.submitEnabled"
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
      <div v-if="selectedItem && selectedGroup && showRelated" class="related-block" :data-eid="eid('related_block')">
        <RelatedItemsGrid
         :data-eid="eid('related_grid')"
         :model-id="activeModelId"
         :media-item="selectedItem"
         :related-items="selectedGroup.items"
         :loading="!selectedGroup.itemsLoaded"
         :search-results="videoResults"
         @select-item="updateSelected"
        >
          <template #search>
            <v-text-field
             v-if="isGroupVideo"
             v-model="videoQuery"
             :data-eid="eid('video_search')"
             class="video-search"
             placeholder="Search in this video"
             prepend-inner-icon="mdi-magnify"
             :loading="videoSearching"
             :disabled="!videoShotCount"
             density="compact"
             variant="outlined"
             hide-details
             clearable
             @keydown.enter="searchInVideo"
             @click:clear="clearVideoSearch"
            />
          </template>
        </RelatedItemsGrid>
      </div> 
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AlbumViewer from './AlbumViewer.vue'
import AudioPlayer from './AudioPlayer.vue'
import RelatedItemsGrid from './RelatedItemsGrid.vue'
import { ILSets, MediaType } from '@/types/mediaitem'
import { useItemStore } from '@/stores/item'
import { useModelStore } from '@/stores/model'
import { useAppStore } from '@/stores/app'
import { logEvents, searchText, submitAnswer } from '@/services/ExquisitorAPI'
import { useFilterStore } from '@/stores/filter'
import { useSubmissionStore } from '@/stores/submission'
import { useErrorStore } from '@/stores/error'

const appStore = useAppStore()
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

// Video ID is an item tagset (shared by all shots of a video), not part of group metadata
const videoId = computed(() => {
  const md: any = selectedItem.value?.metadata ?? {}
  return md['Video ID'] ?? selectedItem.value?.groupKey ?? ''
})

// Title is a video (group) tagset; may come back as a list
const title = computed(() => {
  const t: any = selectedGroup.value?.metadata?.['Title'] ?? (selectedItem.value?.metadata as any)?.['Title']
  return Array.isArray(t) ? t.join(', ') : (t ?? '')
})

// "(Video ID) Title", falling back to the filename when there's no title
const headerTitle = computed(() => {
  const name = title.value || filename.value
  return videoId.value ? `(${videoId.value}) ${name}` : name
})

const isGroupVideo = computed(() => selectedGroup.value?.groupMediaType === MediaType.Video)

const loopSegment = ref(true)
const videoPlayer = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)

const isExcluded = computed(() => {
  const modelId = modelStore.activeModel!.id

  if (isGroupVideo.value && selectedItem.value) {
    return itemStore.getSetItems(modelId, ILSets.Excluded).some(item => item.groupId === selectedItem.value?.groupId)
  }
  return itemStore.getSetItems(modelId, ILSets.Excluded).some(item => item.id === selectedItem.value?.id)
})

async function exclude() {
  const modelId = modelStore.activeModel!.id

  if (!isExcluded.value) {
    itemStore.addItemToSet(selectedItem.value.id, modelId!, ILSets.Excluded)
  } else {
    const id = itemStore.getSetItems(modelId, ILSets.Excluded).find(item => item.groupId === selectedItem.value?.groupId)!.id
    itemStore.removeItemFromSet(id, modelId!, ILSets.Excluded)
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
    // stop downloading the old file when changing to a different video
    vid.removeAttribute('src')
    vid.load()
  }
}

// --- video loading ---
// src is set here rather than bound in the template, so a new video can start
// directly at the shot (media fragment) and a shot change in the same video only seeks
const lastVideoSrc = ref<string | null>(null)

const startSec = computed(() => (segment.value.hasSegment ? segment.value.startMs / 1000 : 0))

function syncVideo() {
  const vid = videoPlayer.value
  const src = selectedGroup.value?.src
  if (!vid || !src || !isGroupVideo.value) return

  if (lastVideoSrc.value !== src) {
    // For a new video, #t= makes the browser fetch from the shot's position
    // instead of loading from 0 and then seeking
    lastVideoSrc.value = src
    vid.src = startSec.value > 0 ? `${src}#t=${startSec.value}` : src
    vid.load()
  } else if (segment.value.hasSegment && Math.abs(vid.currentTime - startSec.value) > 0.25) {
    // Same video but another shot, so just seek
    vid.currentTime = startSec.value
    void vid.play().catch(() => {})
  }
}

// Runs after render so the <video> element exists. startMs is included because a
// related shot's metadata can arrive after it was selected
watch(
  () => [selectedGroup.value?.src, selectedItem.value?.id, segment.value.startMs] as const,
  syncVideo,
  { flush: 'post' }
)
onMounted(syncVideo)

// The related grid (its requests and thumbnails) waits until the video's first
// frame at the shot has loaded, so it doesn't compete with the video.
// Fallback in case the video never loads.
const RELATED_FALLBACK_MS = 3000
const videoSettled = ref(false)
let settleTimer: number | undefined

function settleVideo() {
  videoSettled.value = true
  window.clearTimeout(settleTimer)
}

function awaitVideoSettle() {
  videoSettled.value = false
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(settleVideo, RELATED_FALLBACK_MS)
}

const showRelated = computed(() => !isGroupVideo.value || videoSettled.value)

// Pre-flush, so the old <video> still exists when switching away from it
watch(
  () => selectedGroup.value?.src,
  (src, oldSrc) => {
    if (src === oldSrc) return
    if (oldSrc) {
      teardownVideo(true)
      lastVideoSrc.value = null
    }
    if (src) awaitVideoSettle()
  },
  { immediate: true }
)

function onLoadedMetadata() {
  // Fallback for browsers that ignore the #t= fragment
  const vid = videoPlayer.value
  if (vid && segment.value.hasSegment && Math.abs(vid.currentTime - startSec.value) > 0.5) {
    vid.currentTime = startSec.value
  }

  if (selectedItem.value && selectedGroup.value) {
    logEvents([{
      ts: Date.now(),
      action: `Video Segment Loaded (media item: ${selectedItem.value.id})`,
      session: useAppStore().session,
      data: JSON.stringify({
        itemId: selectedItem.value.id,
        vid: selectedGroup.value.src,
        seek_second: startSec.value
      })
    }])
  }
}

function onTimeUpdate() {
  const vid = videoPlayer.value
  if (!vid) return

  currentTime.value = vid.currentTime

  if (!loopSegment.value || !segment.value.hasSegment) return

  const endSec = segment.value.endMs / 1000

  if (vid.currentTime > endSec) vid.currentTime = startSec.value
  if (vid.currentTime < startSec.value) vid.currentTime = startSec.value
}

function updateSelected(itemId?: number) {
  if (typeof itemId === 'number') void itemStore.setSelectedItem(itemId)
}

// --- In-video search ---
// Text search limited to this video. The results reorder the related grid
const videoQuery = ref<string | null>('')
const videoResults = ref<number[] | null>(null)
const videoSearching = ref(false)

// Any shot of the video can match, so k is the video's shot count
const videoShotCount = computed(() => selectedGroup.value?.itemsLoaded ? selectedGroup.value.items.length : 0)

// Value leaf for this video's ID, built like the value filters in the advanced search
function videoFilter() {
  const info = filterStore.filtersInfo.get(activeModelId.value)?.find(f => f.name === itemStore.groupKey)
  const value = info?.values?.find(v => v.value === String(videoId.value))
  if (!info || !value) return null
  return filterStore.makeActiveFilters(filterStore.makeValueLeaf(info.id, info.tagtypeId, [value.id]))
}

async function searchInVideo() {
  const text = videoQuery.value?.trim()
  if (!text) return clearVideoSearch()

  const filters = videoFilter()
  if (!filters) {
    useErrorStore().show(`Cannot search in this video, no ${itemStore.groupKey} filter value for "${videoId.value}".`)
    return
  }

  // Ignore the response if the viewer switched to another video meanwhile
  const src = selectedGroup.value?.src
  videoSearching.value = true
  try {
    const res = await searchText({
      session_info: {
        session: appStore.session,
        modelId: activeModelId.value,
        collection: modelStore.getModelCollection(activeModelId.value)
      },
      n: videoShotCount.value,
      text,
      filters,
      excluded: [],
      search_model: 'clip'
    })
    if (selectedGroup.value?.src === src) videoResults.value = res.suggestions
  } catch (err) {
    useErrorStore().show(err)
  } finally {
    videoSearching.value = false
  }
}

function clearVideoSearch() {
  videoQuery.value = ''
  videoResults.value = null
}

// A shot change within the same video keeps the results
watch(() => selectedGroup.value?.src, (src, oldSrc) => {
  if (src !== oldSrc) clearVideoSearch()
})

onUnmounted(() => {
  window.clearTimeout(settleTimer)
  teardownVideo()
})

const emit = defineEmits<{ (e: 'closeMediaViewer'): void }>()

function closeViewer() {
  teardownVideo()
  emit('closeMediaViewer')
}

async function submitCurrent() {
  if (!selectedItem.value) return

  const start = Math.round(currentTime.value * 1000)
  const end = Math.round((currentTime.value+2) * 1000)
  const name = (selectedItem.value.metadata as any)?.['Video ID'] ?? ''

  const result = await submitAnswer({
    session_info: {
      session: useAppStore().session,
      modelId: activeModelId.value,
      collection: modelStore.getModelCollection(activeModelId.value)
    },
    name,
    qa: false,
    start,
    end,
    evalId: useAppStore().selectedEvaluation.id,
  })
  useSubmissionStore().show(result, `Video ${name}, ${(start / 1000).toFixed(1)}–${(end / 1000).toFixed(1)} s`)
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

.viewer-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Related items take the height left under the media, on very short screens the body scrolls */
.viewer-body {
  padding-top: 8px;
  padding-bottom: 8px;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.viewer-video {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  flex-shrink: 0;
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

.video-search {
  flex: 1 1 auto;
  min-width: 120px;
  max-width: 320px;
}

/* Slightly taller than the small Open button (28px) instead of compact's 40px */
.video-search :deep(.v-field) {
  --v-input-control-height: 30px;
  --v-input-padding-top: 0px;
  --v-field-padding-bottom: 0px;
  font-size: 0.875rem;
}

/* Related block spacing tightened */
.related-block {
  padding-top: 4px;
  padding-bottom: 6px;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
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