<template>
    <v-card>
        <v-img
         :id="'itemThumb'+item.id"
         :src="item.thumbPath"
         @click="openOverlay = true; console.log('clicked item', item.id)"
         class="bg-transparent"
        >
            <template v-slot:placeholder>
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
            <span>{{ item.name }}</span>
        </v-img>
        <template v-slot:actions>
            <v-btn v-if="btnPos"
             @click="addToSet(itemId, ILSets.Positives); $emit('replace', itemIndex, gridIndex, ILSets.Positives)"
             :disabled="isPos(itemId, modelId)"
             size="small"
            >
                <v-icon>
                    mdi-thumb-up-outline
                </v-icon>
            </v-btn>
            <v-btn v-if="btnNeg"
             @click="addToSet(itemId, ILSets.Negatives); $emit('replace', itemIndex, gridIndex, ILSets.Negatives)"
             :disabled="isNeg(itemId, modelId)"
             size="small"
            >
                <v-icon>
                    mdi-thumb-down-outline
                </v-icon>
            </v-btn>
            <v-btn v-if="btnIgnore"
             @click="addToSet(itemId, ILSets.History); $emit('replace', itemIndex, gridIndex, ILSets.History)"
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
    <v-overlay v-if="overlay" 
     v-model="openOverlay"
     location-strategy="connected"
     scroll-strategy="reposition"
     class="align-center justify-center my-overlay"
     >
        <item-overlay
         :model-id="modelId"
         :srcItem="item"
         :opened="openOverlay"
        />
    </v-overlay>
</template>


<script lang="ts" setup>
import { submitAnswer } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useItemStore } from '@/stores/item';
import ItemOverlay from './ItemOverlay.vue';
import MediaItem, { ILSets } from '@/types/mediaitem';

interface Props {
    itemId: number
    itemIndex: number
    gridIndex: number
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
defineEmits<{'replace': [itemIndex: number, gridIndex: number, set: ILSets]}>()

const itemStore = useItemStore()
const item : MediaItem = reactive({id: -1, srcPath:'', thumbPath:''})
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
    item.relatedItems = mi.relatedItems
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

const { session, evalId } = useAppStore()
function addToSet(itemId: number, ilset: ILSets) {
    itemStore.addItemToSet(itemId, props.modelId, ilset)
    if (ilset == ILSets.Positives) snackColor.value = 'success'
    if (ilset == ILSets.Negatives) snackColor.value = 'error'
    if (ilset == ILSets.Submitted) {
        snackColor.value = 'indigo'
        submitAnswer({ 
            sessionId: session, 
            modelId: props.modelId,
            name: itemStore.items.get(itemId)!.name!,
            text: '',
            qa: false,
            evalId: evalId
        })
    }
    snack(itemStore.items.get(itemId)!.name!, ILSets[ilset])
}

const openOverlay = ref(false)

</script>


<style scoped>
.v-btn {
    min-width: 0;
}

.v-card :deep(.v-card-actions) {
    justify-content: center;
    min-height: auto;
}
</style>