<template>
  <v-card>
    <div class="thumbnail-wrapper">
      <img
       :data-eid="'item_thumbnail_' + item.id + '_model_' + modelId"
       ref="imageRef"
       :key="'itemThumb'+item.id"
       :id="'itemThumb'+item.id"
       :src="item.thumbPath"
       :alt="item.name"
       @click="if (!overlay) { accessOverlay() };
       if (overlay) { $emit('replaceOverlay', itemId) };"
       class="bg-transparent"
       :style="{maxWidth: thumbSize + 'px'}"
      />
    </div>
    <template v-slot:actions>
      <v-btn v-if="btnPos"
       :data-eid="'btn_pos_' + itemId + '_model_' + modelId"
       @click="addToSet(itemId, ILSets.Positives); { $emit('replace', itemIndex, ILSets.Positives) };"
       :disabled="isPos(itemId, modelId)"
       size="small"
      >
        <v-icon>
          mdi-thumb-up-outline
        </v-icon>
      </v-btn>
      <v-btn v-if="btnNeg"
       :data-eid="'btn_neg_' + itemId + '_model_' + modelId"
       @click="addToSet(itemId, ILSets.Negatives); { $emit('replace', itemIndex, ILSets.Negatives) };"
       :disabled="isNeg(itemId, modelId)"
       size="small"
      >
        <v-icon>
          mdi-thumb-down-outline
        </v-icon>
      </v-btn>
      <v-btn v-if="btnIgnore"
       :data-eid="'btn_ignore_' + itemId + '_model_' + modelId"
       @click="addToSet(itemId, ILSets.History); { $emit('replace', itemIndex, ILSets.History) };"
       :disabled="isHistory(itemId, modelId)"
       size="small"
      >
        <v-icon>
          mdi-eye-remove
        </v-icon>
      </v-btn>
      <v-btn v-if="btnSubmit"
       :data-eid="'btn_submit_' + itemId + '_model_' + modelId"
       @click="addToSet(itemId, ILSets.Submitted);"
       :disabled="isSubmitted(itemId, modelId)"
       size="small"
      >
        <v-icon>
          mdi-send-outline
        </v-icon>
      </v-btn>
      <v-btn
       :data-eid="'btn_gif_' + itemId + '_model_' + modelId"
       @click="getGif"
       size="small"
      >
        <v-icon>
          mdi-tray-arrow-down
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
</template>


<script lang="ts" setup>
import { submitAnswer } from '@/services/ExquisitorAPI';
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
  btnSubmit: boolean
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

const item : MediaItem = reactive({id: -1, name: '', mediaId: -1, srcPath:'', thumbPath:'', mediaType: MediaType.Image})
const group: GroupMetadata = reactive({ src: '', metadata: {}, groupMediaType: MediaType.Other, items: []})
const thumbSize = computed(() => modelStore.getThumbnailSize(props.modelId))

const openOverlay = ref(false)

const srcItemIndex = ref(0)

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
    
    let item = itemStore.items.get(collection)!.get(itemId)!
    if (item.metadata === undefined) {
      itemStore.fetchItemInfo(props.modelId, item.id).then((meta) => {
        item.metadata = meta
        submitAnswer({
          session_info: {
            session: useAppStore().session,
            modelId: props.modelId,
            collection: modelStore.getModelCollection(props.modelId)
          },
          name: item.metadata!['Video ID'] as string,
          text: '',
          qa: false,
          start: item.metadata!['Start (ms)'] as number,
          end: item.metadata!['End (ms)'] as number,
          evalId: useAppStore().selectedEvaluation.id,
        })
      })
    } else {
      submitAnswer({
        session_info: {
          session: useAppStore().session,
          modelId: props.modelId,
          collection: modelStore.getModelCollection(props.modelId)
        },
        name: item.metadata!['Video ID'] as string,
        text: '',
        qa: false,
        start: item.metadata!['Start (ms)'] as number,
        end: item.metadata!['End (ms)'] as number,
        evalId: useAppStore().selectedEvaluation.id,
      })
    }
  }
  itemStore.addItemToSet(itemId, props.modelId, ilset)
  snack(itemStore.items.get(collection)!.get(itemId)!.name!, ILSets[ilset])
}
    
     
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
  openOverlay.value = true;
}
    
onBeforeUnmount(() => {
  imageRef.value?.removeAttribute('src')
})

// Refs to manage video elements for hover
// const videoRefs = ref<{ [key: string]: HTMLVideoElement | null }>({})

// function onHover(id: number) {
//     const vid = videoRefs.value[id]
//     if (vid) {
//         vid.currentTime = 0
//         vid.play()
//         vid.loop = true
//     }
// }

// function onLeave(id: number) {
//     const vid = videoRefs.value[id]
//     if (vid) {
//         vid.pause()
//         vid.currentTime = 0
//     }
// }

async function getGif() {
  return
  const exqURI = useAppStore().exqURI
  const session = useAppStore().session
  const url = `${exqURI}/exq/item/GIFIT/${session}_${collection}_${item.id}`
  window.open(url, '_blank')
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
