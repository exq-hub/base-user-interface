<template>
    <v-card>
        <div class="thumbnail-wrapper"><!-- @mouseover="onHover(id)" @mouseleave="onLeave(id)"> -->
            <img
             :id="'itemThumb'+item.id"
             :src="item.thumbPath"
             :alt="item.name"
             @click="if (!overlay) { accessOverlay() };
                     if (overlay) { $emit('replaceOverlay', itemId) }; 
                     console.log('clicked item', item.id);"
             class="bg-transparent"
             :style="{maxWidth: thumbSize + 'px'}"
            />
                <!-- <template v-slot:placeholder>
                    <v-row 
                    class="fill-height ma-0"
                    justify="center"
                    >
                        <v-progress-circular 
                        indeterminate
                        color="grey-lighten-5"
                        />
                    </v-row>
                </template>
                <span>{{ item.name!.split('_')[0] }} {{ item.name!.split('_')[1] }}</span> -->
            </img>
        </div>
        <template v-slot:actions>
            <v-btn v-if="btnPos"
             @click="addToSet(itemId, ILSets.Positives); { $emit('replace', itemIndex, ILSets.Positives) };"
             :disabled="isPos(itemId, modelId)"
             size="small"
            >
                <v-icon>
                    mdi-thumb-up-outline
                </v-icon>
            </v-btn>
            <v-btn v-if="btnNeg"
             @click="addToSet(itemId, ILSets.Negatives); { $emit('replace', itemIndex, ILSets.Negatives) };"
             :disabled="isNeg(itemId, modelId)"
             size="small"
            >
                <v-icon>
                    mdi-thumb-down-outline
                </v-icon>
            </v-btn>
            <v-btn v-if="btnIgnore"
             @click="addToSet(itemId, ILSets.History); { $emit('replace', itemIndex, ILSets.History) };"
             :disabled="isHistory(itemId, modelId)"
             size="small"
            >
                <v-icon>
                    mdi-eye-remove
                </v-icon>
            </v-btn>
            <v-btn v-if="btnSubmit"
             @click="addToSet(itemId, ILSets.Submitted);"
             :disabled="isSubmitted(itemId, modelId)"
             size="small"
            >
                <v-icon>
                    mdi-send-outline
                </v-icon>
            </v-btn>
        </template>
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
    <v-overlay v-if="!overlay"
     v-model="openOverlay"
     location-strategy="connected"
     scroll-strategy="reposition"
     class="align-center justify-center my-overlay"
     >
        <item-overlay
         :model-id="modelId"
         :src-item="item"
         :src-item-idx="srcItemIndex"
         :is-opened="true"
        />
    </v-overlay>
</template>


<script lang="ts" setup>
import { submitAnswer } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useItemStore } from '@/stores/item';
import ItemOverlay from './ItemOverlay.vue';
import MediaItem, { ILSets, MediaType } from '@/types/mediaitem';
import { useModelStore } from '@/stores/model';

interface Props {
    itemId: number
    itemIndex: number
    modelId: number
    item?: MediaItem
    btnPos: boolean
    btnNeg: boolean
    btnIgnore: boolean
    btnSubmit: boolean
    provided: boolean
    overlay: boolean
}
const props = defineProps<Props>()
defineEmits<{
    'replace': [ itemIndex: number, set: ILSets ],
    'replaceOverlay': [ itemId: number ]
}>()

const itemStore = useItemStore()
const modelStore = useModelStore()

const item : MediaItem = reactive({id: -1, srcPath:'', thumbPath:'', mediaType: MediaType.Image})
const thumbSize = computed(() => modelStore.getThumbnailSize(props.modelId))
async function getMediaItem() {
    await itemStore.fetchMediaItem(props.itemId, props.modelId)
    let mi = itemStore.items.get(props.itemId)!
    item.id = mi.id
    item.mediaId = mi.mediaId
    item.currentSets = mi.currentSets
    item.name = mi.name
    item.mediaType = mi.mediaType
    item.srcPath = mi.srcPath
    item.thumbPath = mi.thumbPath
}
if (!props.provided) {
    await getMediaItem()
} else {
    item.id = props.item!.id
    item.mediaId = props.item!.mediaId
    item.currentSets = props.item!.currentSets
    item.name = props.item!.name
    item.mediaType = props.item!.mediaType
    item.srcPath = props.item!.thumbPath
    item.thumbPath = props.item!.thumbPath
    item.relatedItems = props.item!.relatedItems
    item.metadata = props.item!.metadata
}

const isPos = computed(() => itemStore.isItemInPos)
const isNeg = computed(() => itemStore.isItemInNeg)
const isHistory = computed(() => itemStore.isItemInHistory)
const isSubmitted = computed(() => itemStore.isItemInSubmitted)

const snackbar = ref(false)
const snackTimeout = ref(4000)
const snackColor = ref('white')
const text = ref('')
function snack(item: string, set: string) {
    snackbar.value = true
    text.value = 'Item ' + item + ' has been added to ' + set
}

// const { session, evalId } = useAppStore()
function addToSet(itemId: number, ilset: ILSets) {
    if (ilset == ILSets.Positives) snackColor.value = 'success'
    if (ilset == ILSets.Negatives) snackColor.value = 'error'
    if (ilset == ILSets.Submitted) {
        if (useAppStore().selectedEvaluation.id === '') {
            snackbar.value = true
            snackColor.value = 'error'
            text.value = 'EvaluationId is not set!'
            return
        }
        snackColor.value = 'indigo'
        submitAnswer({ 
            session: useAppStore().session, 
            modelId: props.modelId,
            itemId: itemId,
            name: itemStore.items.get(itemId)!.name!,
            text: '',
            qa: false,
            evalId: useAppStore().selectedEvaluation.id,
        })
    }
    itemStore.addItemToSet(itemId, props.modelId, ilset)
    snack(itemStore.items.get(itemId)!.name!, ILSets[ilset])
}

const openOverlay = ref(false)

const srcItemIndex = ref(0)

async function accessOverlay() {
    if (item.metadata === undefined) {
        item.metadata = await itemStore.fetchItemInfo(props.modelId, item.id)
        console.log(item.metadata)
    }
    if (item.relatedItems === undefined) {
        item.relatedItems = await itemStore.fetchRelatedItems(props.modelId, item.id)
        console.log(item.relatedItems)
        if (item.relatedItems!.length > 0) {
            for (let i = 0; i < item.relatedItems!.length; i++) {
                if (item.relatedItems![i] === item.id) {
                    srcItemIndex.value = i
                    break
                }
            }
        }
    }
    openOverlay.value = true; 
}

// Refs to manage video elements for hover
const videoRefs = ref<{ [key: string]: HTMLVideoElement | null }>({})

function onHover(id: number) {
    const vid = videoRefs.value[id]
    if (vid) {
        vid.currentTime = 0
        vid.play()
        vid.loop = true
    }
}

function onLeave(id: number) {
    const vid = videoRefs.value[id]
    if (vid) {
        vid.pause()
        vid.currentTime = 0
    }
}

function onClickItem(id: number) {
  // Possibly emit an event, or set something in Pinia to indicate the “Viewer” should open
  // e.g. event: "open-media-viewer"
  console.log('Clicked item ID:', id)
}
</script>


<style scoped>
.v-btn {
    min-width: 0;
}

.v-card :deep(.v-card-actions) {
    justify-content: center;
    min-height: auto;
}
.thumbnail-wrapper {
    width: 100%;
    position: relative;
    cursor: pointer;
    overflow: hidden;
}
</style>