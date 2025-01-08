<!-- src/components/MediaViewer.vue -->
<template>
    <v-card class="pa-2">
        <!-- Header or Title -->
        <v-card-title>
            {{ selectedItem.name }}
            <v-btn 
             icon
             :color="isExcluded ? 'grey' : 'orange'"
             @click="exclude"
             >
                <v-icon>mdi-filter-remove</v-icon> <!-- You can customize the icon here -->
            </v-btn>
        </v-card-title>
        
        <!-- Main Viewer Content -->
        <v-card-text>
            <div v-if="selectedItem.mediaType === MediaType.Video">
                <video
                ref="videoPlayer"
                :src="selectedItem.srcPath"
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
                     v-model="loopSegment"
                     :label="'Loop this segment (' + selectedItem.segmentInfo!.start + ' - ' + selectedItem.segmentInfo!.end + ')'"
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
            >
                Submit ({{ Math.round(currentTime) }})
            </v-btn>
        </v-card-text>
        
        <v-divider v-if="hasRelatedItems"/>
        <RelatedItemsGrid
         v-if="selectedItem"
         :model-id="activeModelId"
         :media-item="selectedItem"
         :related-items="selectedItem.relatedItems!"
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
import { clearExcludedGroups, excludeGroup, isGroupExcluded, submitAnswer } from '@/services/ExquisitorAPI'

const appStore = useAppStore()
const modelStore = useModelStore()
const itemStore = useItemStore()
const activeModelId = reactive(computed(() => modelStore.activeModel!.id))
const selectedItem = reactive(computed(() => itemStore.getSelectedItem()))


const loopSegment = ref(true)
const videoPlayer = ref<HTMLElement | null>(null)
const desiredStartTime = ref(selectedItem.value.segmentInfo!.start)
const desiredEndTime = ref(selectedItem.value.segmentInfo!.end)
const currentTime = ref(0)

const snackbar = ref(false)
const snackTimeout = ref(4000)
const snackColor = ref('white')
const text = ref('')

const isExcluded = ref(false)
async function checkExclude() {
    let modelId = modelStore.activeModel!.id
    if (!itemStore.modelExcluded.has(modelId)) {
        return false
    }
    const excludedItems = Array.from(itemStore.modelExcluded.get(modelId)!)
    let res = await isGroupExcluded({
        session_info: {
            session: useAppStore().session, 
            collection: useModelStore().getModelCollection(modelId),
            modelId: modelId
        },
        itemId: selectedItem.value.id,
        excluded_ids: excludedItems
    })
    isExcluded.value = res
}
checkExclude()

async function exclude() {
    let modelId = modelStore.activeModel!.id
    if (!isExcluded.value) {
        itemStore.excludeItemGroup(selectedItem.value.id, modelId)
        isExcluded.value = true
        // Logging
        excludeGroup({
            session_info: {
                session: appStore.session,
                collection: useModelStore().getModelCollection(modelId),
                modelId: modelId
            }, 
            itemId: selectedItem.value.id
        })
        // snack(true)
    } else {
        itemStore.removeItemFromExclude(selectedItem.value.id)
        isExcluded.value = false
        // Logging
        clearExcludedGroups({
            session_info: {
                session: appStore.session,
                collection: useModelStore().getModelCollection(modelId),
                modelId: modelId
            }, 
            items: [selectedItem.value.id]
        })
        // snack(false)
    }
}

const emit = defineEmits<{
    (e: 'selectedSegment', itemId: number): void 
}>()


function updateSegment() {
    desiredStartTime.value = selectedItem.value.segmentInfo!.start;
    desiredEndTime.value = selectedItem.value.segmentInfo!.end;
    (videoPlayer.value! as HTMLMediaElement).fastSeek(desiredStartTime.value)
    console.log("setting start and end itme")
}

function checkLoop() {
    if (loopSegment.value) {
        if ((videoPlayer.value! as HTMLMediaElement).currentTime > desiredEndTime.value) {
            (videoPlayer.value! as HTMLMediaElement).currentTime = desiredStartTime.value
        }
    }
    currentTime.value = (videoPlayer.value! as HTMLMediaElement).currentTime
}

// Check if this item has related items
const hasRelatedItems = computed(() => {
    if (selectedItem.value.relatedGroupId) return true
    return false
})

function updateSelected(itemId: number) {
    emit('selectedSegment', itemId)
    desiredStartTime.value = selectedItem.value.segmentInfo!.start;
    desiredEndTime.value = selectedItem.value.segmentInfo!.end;
    (videoPlayer.value! as HTMLMediaElement).fastSeek(desiredStartTime.value)
}

function submitCurrent() {
    if (useAppStore().selectedEvaluation.id === '') {
        snackbar.value = true
        snackColor.value = 'error'
        text.value = 'EvaluationId is not set!'
        return
    }
    snackColor.value = 'indigo'
    let start = currentTime.value - 2
    let end = currentTime.value + 2
    if (start < 1) {
        start = currentTime.value
    }
    if (end > (videoPlayer.value! as HTMLMediaElement).duration) {
        end = (videoPlayer.value! as HTMLMediaElement).duration
        start = end - 5
    }
    submitAnswer({ 
        session_info: {
            session: useAppStore().session, 
            modelId: activeModelId.value,
            collection: modelStore.getModelCollection(activeModelId.value)
        },
        name: selectedItem.value.relatedGroupId!,
        text: '',
        qa: false,
        start: start,
        end: end,
        evalId: useAppStore().selectedEvaluation.id,
    })
}
</script>
