<!-- src/components/MediaViewer.vue -->
<template>
  <v-card class="pa-2">
    <!-- Header or Title -->
    <v-card-title style="display: flex; justify-content: space-between;">
      <span class="w-25" style="font-size:1rem">
        Filename: {{ selectedItem.thumbPath.split('/').slice(-1)[0] }} (Video ID: {{ selectedItem.metadata!['Video ID'] }})
      </span>
      <v-tooltip text="Close Viewer">
        <template #activator="{ props }">
          <v-btn
          data-eid="media_viewer_close_btn"
          v-bind="props"
          size=small
          icon
          color=red
          @click="teardownVideo(); emit('closeMediaViewer')"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </v-card-title>
    <v-tooltip text="Excludes video from search results in this model/tab">
      <template #activator="{ props }">
        <v-btn
        data-eid="media_viewer_exclude_video_btn"
        v-bind="props"
        :color="isExcluded ? 'grey' : 'yellow'"
        @click="exclude"
        class="ml-5 mr-10"
        size="small"
        >
          Exclude Video
        </v-btn>
      </template>
    </v-tooltip>
    <div class="align-center justify-space-between">
      <span class="text-subtitle-1">Video Information</span>
  
      <v-btn
      data-eid="media_viewer_toggle_video_info_btn"
      variant="text"
      icon
      :aria-expanded="toggleVidInfo"
      :aria-controls="'info-vid-section'"
      @click="toggleVidInfo = !toggleVidInfo"
      >
        <v-icon
        :class="toggleVidInfo ? 'rotate-180' : ''"
        >
          mdi-chevron-right
        </v-icon>
      </v-btn>
    </div>
    <v-expand-transition>
      <div
      v-show="toggleVidInfo"
      :id="'info-vid-section'"
      class="mt-2"
      >
        <v-row dense>
          <template
          v-for="m in Object.keys(selectedGroup.metadata!)"
          :key="m"
          >
            <v-col
            v-if="filterStore.isGroup(m)"
            cols="12"
            md="12"
            >
              <div
              style="font-size: 0.9rem"
              >
                <strong>{{ m }}:</strong>
                <template v-if="Array.isArray(selectedGroup.metadata![m])">
                  <span
                  v-for="i in selectedGroup.metadata![m]"
                  :key="i"
                  class="ma-1"
                  label
                  variant="outlined"
                  size="small"
                  >
                    {{ i }}
                  </span>
                </template>
                <template v-else>
                  <span
                  :key="m.toString() + '-' + selectedGroup.metadata![m]"
                  class="ma-1"
                  label
                  variant="outlined"
                  size="small"
                  >
                    {{ selectedGroup.metadata![m] }}
                  </span>
                </template>
              </div>
            </v-col>
          </template>
        </v-row>
      </div>
    </v-expand-transition>
    <div class="align-center justify-space-between">
      <span class="text-subtitle-1">Shot Information</span>
  
      <v-btn
      data-eid="media_viewer_toggle_shot_info_btn"
      variant="text"
      icon
      :aria-expanded="toggleInfo"
      :aria-controls="'info-section'"
      @click="toggleInfo = !toggleInfo"
      >
        <v-icon
        :class="toggleInfo ? 'rotate-180' : ''"
        >
          mdi-chevron-right
        </v-icon>
      </v-btn>
    </div>
    <v-expand-transition>
      <div
       v-show="toggleInfo"
       :id="'info-section'"
       class="mt-2"
      >
        <v-row dense>
          <template
           v-for="m in Object.keys(selectedItem.metadata!)"
           :key="m"
          >
            <v-col
             v-if="filterStore.isMain(m)"
             cols="12"
             md="6"
            >
              <div style="font-size: 0.9rem">
                <strong>{{ m }}:</strong>
                <template v-if="Array.isArray(selectedItem.metadata![m])">
                  <span
                   v-for="i in selectedItem.metadata![m]"
                   :key="i"
                   class="ma-1"
                   label
                   variant="outlined"
                   size="small"
                  >
                    {{ i }}
                  </span>
                </template>
                <template v-else>
                  <span
                  :key="m.toString() + '-' + selectedItem.metadata![m]"
                  class="ma-1"
                  label
                  variant="outlined"
                  size="small"
                  >
                    {{ selectedItem.metadata![m] }}
                  </span>
                </template>
              </div>
            </v-col>
          </template>
        </v-row>
        <div class="align-center justify-space-between">
          <span class="text-subtitle-1">More</span>
  
          <v-btn
           data-eid="media_viewer_toggle_more_info_btn"
           variant="text"
           icon
           :aria-expanded="toggleMore"
           :aria-controls="'info-section-more'"
           @click="toggleMore = !toggleMore"
          >
            <v-icon
            :class="toggleMore ? 'rotate-180' : ''"
            >
              mdi-chevron-right
            </v-icon>
          </v-btn>
        </div>
        <v-expand-transition>
          <div
           v-show="toggleMore"
           :id="'info-section-more'"
           class="mt-2"
          >
            <v-row dense>
              <template v-for="m in Object.keys(selectedItem.metadata!)">
                <v-col
                 v-if="!filterStore.isMain(m)"
                 cols="12"
                 md="6"
                >
                  <div style="font-size: 0.9rem">
                    <strong>{{ m }}:</strong>
                    <template v-if="Array.isArray(selectedItem.metadata![m])">
                      <span
                       v-for="i in selectedItem.metadata![m]"
                       :key="i"
                       class="ma-1"
                       label
                       variant="outlined"
                       size="small"
                      >
                        {{ i }}
                      </span>
                    </template>
                    <template v-else>
                      <span
                       v-if="selectedItem.metadata![m].toString() !== '[]'"
                       :key="m.toString() + '-' + selectedItem.metadata![m]"
                       class="ma-1"
                       label
                       variant="outlined"
                       size="small"
                      >
                        {{ selectedItem.metadata![m] }}
                      </span>
                    </template>
                  </div>
                </v-col>
              </template>
            </v-row>
          </div>
        </v-expand-transition>
      </div>
    </v-expand-transition>
    <v-divider class="border-opacity-0" :thickness="10" />

    <!-- Main Viewer Content -->
    <v-card-text style="text-align: center; justify-content: center;">
      <div v-if="selectedGroup.groupMediaType === MediaType.Video">
        <video
         data-eid="media_viewer_video_player"
         :data-looping="loopSegment ? '1' : '0'"
         ref="videoPlayer"
         :key="selectedGroup.src + '-video-player'"
         :src="selectedGroup.src"
         :poster="selectedItem.thumbPath"
         controls
         autoplay
         muted
         @loadedmetadata="updateSegment"
         @timeupdate="checkLoop"
         style="max-width: 100%; height: auto;"
        >
          Your browser does not support the video tag.
        </video>

        <div>
          <v-switch
           data-eid="loop_video_segment_btn"
           v-model="loopSegment"
           :label="'Loop this segment (' + (selectedItem.metadata!['Start (ms)'] as number) / 1000 + ' - ' + (selectedItem.metadata!['End (ms)'] as number) / 1000 + ')'"
           class="pb-0"
          />
        </div>
      </div>

      <AlbumViewer
       v-else-if="selectedItem.mediaType === MediaType.Image"
       :item="selectedItem"
      />

      <AudioPlayer
       v-else-if="selectedItem.mediaType === MediaType.Audio"
       :item="selectedItem"
      />

      <v-btn
       color="indigo"
       @click="submitCurrent"
       data-eid="media_viewer_submit_btn"
      >
        Submit ({{ Math.round(currentTime) }})
      </v-btn>
    </v-card-text>

    <!-- <v-divider :thickness="20" class="border-opacity-0" v-if="hasRelatedItems"/> -->
    <v-card-subtitle v-if="hasRelatedItems" class="text-center pb-4">
      <span v-if="selectedItem.mediaType === MediaType.Video">
        Video Summary (shots)
      </span>
    </v-card-subtitle>

    <RelatedItemsGrid
     v-if="selectedItem"
     :model-id="activeModelId"
     :media-item="selectedItem"
     :related-items="selectedGroup.items"
     @select-item="updateSelected"
    />
  </v-card>

  <v-snackbar
   v-model="snackbar"
   :timeout="snackTimeout"
   location="bottom left"
   :color="snackColor"
  >
    {{ text }}
    <template v-slot:actions>
      <v-btn
       variant="text"
       @click="snackbar=false"
       icon="mdi-close"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AlbumViewer from './AlbumViewer.vue'
import AudioPlayer from './AudioPlayer.vue'
import RelatedItemsGrid from './RelatedItemsGrid.vue'
import { MediaType } from '@/types/mediaitem'
import { useItemStore } from '@/stores/item'
import { useModelStore } from '@/stores/model'
import { useAppStore } from '@/stores/app'
import { isGroupExcluded, logEvents, submitAnswer, } from '@/services/ExquisitorAPI'
import { useFilterStore } from '@/stores/filter'
//submitAnswer } from '@/services/ExquisitorAPI'

const modelStore = useModelStore()
const itemStore = useItemStore()
const filterStore = useFilterStore()

const activeModelId = computed(() => modelStore.activeModel!.id ?? '')
const selectedItem = computed(() => itemStore.getSelectedItem())
const selectedGroup = computed(() => itemStore.getSelectedGroup())
const toggleVidInfo = ref(false)
const toggleInfo = ref(false)
const toggleMore = ref(false)

const loopSegment = ref(true)
const videoPlayer = ref<HTMLVideoElement | null>(null)
const desiredStartTime = ref(selectedItem.value.metadata!['Start (ms)'] as number / 1000)
const desiredEndTime = ref(selectedItem.value.metadata!['End (ms)'] as number / 1000)
const currentTime = ref(0)

const snackbar = ref(false)
const snackTimeout = ref(4000)
const snackColor = ref('white')
const text = ref('')

const isExcluded = ref(false)
async function checkExclude() {
  let modelId = modelStore.activeModel?.id
  if (!modelId) return
  
  if (!itemStore.modelExcluded.has(modelId)) {
    isExcluded.value = false
    return
  }
  
  const excludedItems = Array.from(itemStore.modelExcluded.get(modelId)!)
  isExcluded.value = await isGroupExcluded({
    session_info: {
      session: useAppStore().session,
      collection: useModelStore().getModelCollection(modelId),
      modelId: modelId
    },
    itemId: selectedItem.value.id,
    excluded_ids: excludedItems
  })
}
  
// Whenever we leave or switch items, stop + unload the old video
function teardownVideo() {
  const vid = videoPlayer.value
  if (!vid) return
  // console.log('teardown vid')
  vid.pause()
  // remove the src so the browser immediately aborts any pending range requests
  vid.removeAttribute('src')
  // reset the network pipeline
  vid.load()
}

watch (
  () => selectedItem.value.srcPath,
  () => {
    // teardownVideo()
    // itemStore.abortAllPending()
  }
)

watch (
  () => selectedItem.value.id,
  async () => {
    updateSelected()
    await checkExclude()
    if (selectedGroup.value.groupMediaType === MediaType.Video) {
      await nextTick()
      videoPlayer.value!.fastSeek?.(desiredStartTime.value)
      if (videoPlayer.value && !videoPlayer.value.fastSeek) {
        videoPlayer.value.currentTime = desiredStartTime.value
      }
    }
  }
)

onUnmounted(() => {
  // console.log('unmounting')
  teardownVideo()
})

async function exclude() {
  let modelId = modelStore.activeModel!.id
  if (!isExcluded.value) {
    itemStore.excludeItemGroup(selectedItem.value.id, modelId)
    isExcluded.value = true
    // snack(true)
  } else {
    itemStore.removeItemFromExclude(selectedItem.value.id)
    isExcluded.value = false
    // snack(false)
  }
}

const emit = defineEmits<{
  (e: 'closeMediaViewer'): void
}>()


function updateSegment() {
  const vid = videoPlayer.value
  if (!vid) return
  desiredStartTime.value = selectedItem.value.metadata!['Start (ms)'] as number / 1000;
  desiredEndTime.value = selectedItem.value.metadata!['End (ms)'] as number / 1000;
  vid.fastSeek?.(desiredStartTime.value)
  if (!vid.fastSeek) vid.currentTime = desiredStartTime.value
  logEvents([{
    ts: Date.now(),
    action: 'Video Segment Loaded (media item: ' + selectedItem.value.id + ')',
    session: useAppStore().session,
    data: JSON.stringify({
      itemId: selectedItem.value.id,
      vid: selectedGroup.value.src,
      seek_second: desiredStartTime.value
    })
  }])
}
  
function checkLoop() {
  const vid = videoPlayer.value
  if (!vid) return
  
  if (loopSegment.value && vid.currentTime > desiredEndTime.value) {
    vid.currentTime = desiredStartTime.value
  }
  
  if (loopSegment.value && vid.currentTime < desiredStartTime.value) {
    vid.currentTime = desiredStartTime.value
  }
  currentTime.value = videoPlayer.value!.currentTime
}

// Check if this item has related items
const hasRelatedItems = computed(() => {
  if (selectedGroup.value.items.length > 0) return true
  return false
})

function updateSelected() {
  desiredStartTime.value = selectedItem.value.metadata!['Start (ms)'] as number / 1000;
  desiredEndTime.value = selectedItem.value.metadata!['End (ms)'] as number / 1000;
}

function submitCurrent() {
  if (useAppStore().selectedEvaluation.id === '') {
    snackbar.value = true
    snackColor.value = 'error'
    text.value = 'EvaluationId is not set!'
    return
  }
  snackColor.value = 'indigo'
  
  let start = (currentTime.value) * 1000
  let end = (currentTime.value) * 1000
  // if (start < 1) {
  //     start = currentTime.value * 1000
  // }
  // if (end > (videoPlayer.value! as HTMLMediaElement).duration) {
  //     end = (videoPlayer.value! as HTMLMediaElement).duration * 1000
  //     start = end - 2000
  // }
  console.log('Submitting answer for time:', start, end, currentTime.value)
  submitAnswer({
    session_info: {
      session: useAppStore().session,
      modelId: activeModelId.value,
      collection: modelStore.getModelCollection(activeModelId.value)
    },
    name: selectedItem.value.metadata!['Video ID'] as string,
    text: '',
    qa: false,
    start: start,
    end: end,
    evalId: useAppStore().selectedEvaluation.id,
  })
}
</script>

<style scoped>
.rotate-180 { transform: rotate(90deg); transition: transform .2s; }
.v-icon { transition: transform .2s; }
</style>
