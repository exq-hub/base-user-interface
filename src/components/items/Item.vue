<template>
    <!-- Grid/overlay mode: visual-first, fixed aspect ratio, hover feedback -->
    <div
     v-if="overlay"
     class="item-cell"
     :class="{
         'item-cell--pos': isPos(itemId, modelId),
         'item-cell--neg': isNeg(itemId, modelId),
     }"
    >
        <div class="item-thumb-frame" @click="$emit('replaceOverlay', itemId)">
            <img
             :data-eid="'item_thumbnail_' + item.id + '_model_' + modelId"
             ref="imageRef"
             :key="'itemThumb'+item.id"
             :id="'itemThumb'+item.id"
             :src="item.thumbPath"
             :alt="item.name"
             class="item-thumb"
            />
            <div v-if="btnPos || btnNeg" class="item-hover-actions">
                <v-btn
                 v-if="btnPos"
                 :data-eid="'btn_pos_' + itemId + '_model_' + modelId"
                 icon
                 size="x-small"
                 color="success"
                 :disabled="isPos(itemId, modelId)"
                 @click.stop="addToSet(itemId, ILSets.Positives); $emit('replace', itemIndex, ILSets.Positives)"
                >
                    <v-icon>mdi-thumb-up</v-icon>
                </v-btn>
                <v-btn
                 v-if="btnNeg"
                 :data-eid="'btn_neg_' + itemId + '_model_' + modelId"
                 icon
                 size="x-small"
                 color="error"
                 :disabled="isNeg(itemId, modelId)"
                 @click.stop="addToSet(itemId, ILSets.Negatives); $emit('replace', itemIndex, ILSets.Negatives)"
                >
                    <v-icon>mdi-thumb-down</v-icon>
                </v-btn>
            </div>
        </div>
    </div>

    <!-- Drawer/panel mode: card with inline buttons -->
    <v-card v-else>
        <div class="thumbnail-wrapper">
            <img
             :data-eid="'item_thumbnail_' + item.id + '_model_' + modelId"
             ref="imageRef"
             :key="'itemThumb'+item.id"
             :id="'itemThumb'+item.id"
             :src="item.thumbPath"
             :alt="item.name"
             @click="accessOverlay()"
             class="bg-transparent"
             :style="{maxWidth: thumbSize + 'px'}"
            />
        </div>
        <template v-slot:actions>
            <v-btn v-if="btnPos"
             :data-eid="'btn_pos_' + itemId + '_model_' + modelId"
             @click="addToSet(itemId, ILSets.Positives); $emit('replace', itemIndex, ILSets.Positives)"
             :disabled="isPos(itemId, modelId)"
             size="small"
            >
                <v-icon>mdi-thumb-up-outline</v-icon>
            </v-btn>
            <v-btn v-if="btnNeg"
             :data-eid="'btn_neg_' + itemId + '_model_' + modelId"
             @click="addToSet(itemId, ILSets.Negatives); $emit('replace', itemIndex, ILSets.Negatives)"
             :disabled="isNeg(itemId, modelId)"
             size="small"
            >
                <v-icon>mdi-thumb-down-outline</v-icon>
            </v-btn>
            <v-btn v-if="btnIgnore"
             :data-eid="'btn_ignore_' + itemId + '_model_' + modelId"
             @click="addToSet(itemId, ILSets.History); $emit('replace', itemIndex, ILSets.History)"
             :disabled="isHistory(itemId, modelId)"
             size="small"
            >
                <v-icon>mdi-eye-remove</v-icon>
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
</template>


<script lang="ts" setup>
import { useAppStore } from '@/stores/app';
import { useItemStore } from '@/stores/item';
import MediaItem, { GroupMetadata, ILSets, MediaType } from '@/types/mediaitem';
import { useModelStore } from '@/stores/model';

interface Props {
    itemId: number
    itemIndex: number
    modelId: number
    item?: MediaItem
    btnPos: boolean
    btnNeg: boolean
    btnIgnore: boolean
    btnSubmit: boolean  // accepted for API compat; no longer rendered
    provided: boolean
    overlay: boolean
}
const props = defineProps<Props>()
defineEmits<{
    'replace': [ itemIndex: number, set: ILSets ],
    'replaceOverlay': [ itemId: number ],
    'itemClicked': [ itemId: number ]
}>()

const itemStore = useItemStore()
const modelStore = useModelStore()
const collection = modelStore.getModelCollection(props.modelId)

const item: MediaItem = reactive({ id: -1, name: '', mediaId: -1, srcPath: '', thumbPath: '', mediaType: MediaType.Image })
const group: GroupMetadata = reactive({ src: '', metadata: {}, groupMediaType: MediaType.Other, items: [] })
const thumbSize = computed(() => modelStore.getThumbnailSize(props.modelId))

async function getMediaItem() {
    let mi = await itemStore.fetchMediaItem(props.itemId, props.modelId)
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
    item.groupId = props.item!.groupId
    item.metadata = props.item!.metadata
}

const imageRef = ref<HTMLImageElement>()

const isPos = computed(() => itemStore.isItemInPos)
const isNeg = computed(() => itemStore.isItemInNeg)
const isHistory = computed(() => itemStore.isItemInHistory)

const snackbar = ref(false)
const snackTimeout = ref(4000)
const snackColor = ref('white')
const text = ref('')
function snack(item: string, set: string) {
    snackbar.value = true
    text.value = 'Item ' + item + ' has been added to ' + set
}

function addToSet(itemId: number, ilset: ILSets) {
    if (ilset == ILSets.Positives) snackColor.value = 'success'
    if (ilset == ILSets.Negatives) snackColor.value = 'error'
    itemStore.addItemToSet(itemId, props.modelId, ilset)
    snack(itemStore.items.get(collection)!.get(itemId)!.name!, ILSets[ilset])
}

const openOverlay = ref(false)
const srcItemIndex = ref(0)

async function accessOverlay() {
    if (item.metadata === undefined) {
        item.metadata = await itemStore.fetchItemInfo(props.modelId, item.id)
    }
    if (group.metadata === undefined) {
        let gi = await itemStore.fetchGroupInfo(props.modelId, item.groupId!)
        group.src = gi.src
        group.metadata = gi.metadata
        group.groupMediaType = gi.groupMediaType
        group.items = gi.items
    }
    if (group.items.length === 0) {
        group.items = await itemStore.fetchRelatedItems(props.modelId, item.groupId!)
        if (group.items!.length > 0) {
            for (let i = 0; i < group.items!.length; i++) {
                if (group.items![i] === item.id) {
                    srcItemIndex.value = i
                    break
                }
            }
        }
    }
    openOverlay.value = true
}

onBeforeUnmount(() => {
    imageRef.value?.removeAttribute('src')
})
</script>


<style scoped>
/* ── Grid / overlay mode ─────────────────────────────────────── */
.item-cell {
    display: block;
    line-height: 0; /* collapse whitespace gaps */
}

.item-thumb-frame {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #1a1a1a; /* placeholder while image loads — eliminates CLS */
    cursor: pointer;
}

.item-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.item-hover-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 8px;
    padding-bottom: 6px;
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.55));
    opacity: 0;
    transition: opacity 0.15s ease;
}

.item-thumb-frame:hover .item-hover-actions {
    opacity: 1;
}

/* Positive / negative state borders */
.item-cell--pos .item-thumb-frame {
    outline: 3px solid rgb(var(--v-theme-success));
    outline-offset: -3px;
}

.item-cell--neg .item-thumb-frame {
    outline: 3px solid rgb(var(--v-theme-error));
    outline-offset: -3px;
}

/* ── Drawer / panel mode ─────────────────────────────────────── */
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
