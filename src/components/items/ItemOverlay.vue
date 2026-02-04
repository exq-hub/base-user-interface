<template>
    <v-container style="background-color: sandybrown; border-radius: 10px;">
        <v-row 
         align="center"
         height="500px"
         no-gutters
        >
            <v-col cols="1" class="btn-col">
                <v-btn 
                 icon="mdi-information-outline"
                 color="yellow"
                 class="info-btn"
                 @click="itemInfo = !itemInfo"
                />
                <v-btn 
                 icon="mdi-filter-remove"
                 :color="isExcluded ? 'grey' : 'orange'"
                 class="exc-btn"
                 @click="exclude"
                />
            </v-col>
            <v-col :cols="srcCols" class="main">
                <!-- Image -->
                <v-img
                 v-if="mainItem.mediaType === MediaType.Image"
                 class="source-col"
                 :id="'itemSrc'+mainItem.id"
                 :src="mainItem.srcPath"
                 height="500px"
                > 
                </v-img>
                <!-- Video -->
                <video
                v-if="mainItem.mediaType === MediaType.Video"
                class="source-col"
                :key="mainItem.srcPath"
                :id="'itemSrc'+mainItem.id"
                controls
                autoplay
                muted
                height="500"
                >
                    <source :src="mainItem.srcPath" type="video/mp4"/>
                </video>
            </v-col>

            <!-- Item Information -->
            <v-col v-model="mainItem" v-if="itemInfo" cols="4">
                <v-card class="item-details source-col">
                    <v-card-text class="pb-2" v-for="n in mainItem.metadata!.infoPairs">
                        <strong>{{ n[0].toLocaleUpperCase() }}: </strong>
                        <template v-for="m in n[1]">
                            <v-chip 
                             class="mr-1 mb-1"
                             size="small"
                             color="black"
                             variant="flat"
                             label
                             v-if="m !== ''">
                                {{m}}
                            </v-chip>
                        </template>
                   </v-card-text>
                </v-card>
            </v-col> 
        </v-row>

        <!-- TIMELINE -->
        <v-row>
            <v-slide-group
             :key="updTimeline"
             style="border-radius: 5px;"
             center-active
             show-arrows="always"
            >
                <template v-slot:next>
                    <v-icon @click="nextClick" icon="mdi-arrow-right"></v-icon>
                </template>
                <template v-slot:prev>
                    <v-icon @click="prevClick" icon="mdi-arrow-left"></v-icon>
                </template>
                <v-slide-group-item 
                 v-for="(it,index) in shownItems.items" :key="index"
                >
                    <item
                     :item-id="it.id"
                     :item-index="index"
                     :model-id="props.modelId"
                     :btn-pos="true"
                     :btn-neg="true"
                     :btn-ignore="false"
                     :btn-submit="true"
                     :provided="false"
                     :overlay="true"
                     @replaceOverlay="switchMain(it.id)"
                    />
               </v-slide-group-item>
            </v-slide-group>
        </v-row>
    </v-container>
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
// import Item from '@/components/items/Item.vue';
import { clearExcludedGroups, excludeGroup, isGroupExcluded } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useItemStore } from '@/stores/item';
import { useModelStore } from '@/stores/model';
import MediaItem, { MediaType } from '@/types/mediaitem';

interface Props {
    modelId: number
    srcItem: MediaItem
    srcItemIdx: number
    isOpened: boolean
}
const props = defineProps<Props>()

console.log('srcItem', props.srcItem)
console.log('srcItemIdx', props.srcItemIdx)
const mainItem = ref(props.srcItem)
const relatedItems : number[] = mainItem.value.relatedItems!

const itemStore = useItemStore()
const appStore = useAppStore()


// Timeline related
const updTimeline = ref(0)
const start = ref(props.srcItemIdx-3)
const end = ref(props.srcItemIdx+4)
const timelineStart = relatedItems[0]
const timelineEnd = relatedItems[relatedItems.length-1]
console.log('start', start.value)
console.log('end', end.value)
console.log('trs', timelineStart)
console.log('tre', timelineEnd)

if (start.value < 0) {
    start.value = 0
    end.value = 8
}
if (end.value > relatedItems.length-1) {
    end.value = relatedItems.length-1; 
    start.value = end.value-8;
}
console.log('start', start.value)
console.log('end', end.value)
const shownItems : {items: MediaItem[]} = reactive({items: []})
for (let i = start.value; i < end.value; i++) {
    shownItems.items.push(await useItemStore().fetchMediaItem(relatedItems[i], props.modelId))
}

async function switchMain(itemId: number) {
    console.log('Old', mainItem.value)
    await useItemStore().fetchMediaItem(itemId, props.modelId)
    await useItemStore().fetchItemInfo(props.modelId, itemId)
    const newItem : MediaItem = await useItemStore().fetchMediaItem(itemId, props.modelId)
    mainItem.value = newItem
    console.log('NewMain', mainItem.value)
}

async function nextClick() {
    console.log('Next Click')
    if (end.value+8 < relatedItems.length-1) { // Regular scenario
        shownItems.items = []
        for (let i = end.value; i < end.value+8; i++) {
            shownItems.items.push(await useItemStore().fetchMediaItem(relatedItems[i], props.modelId))
        }
        start.value = end.value
        end.value = end.value + 8
        updTimeline.value += 1
    } else if (end.value < relatedItems.length) { // Last slide-group
        shownItems.items = []
        for (let i = relatedItems.length-8; i < relatedItems.length; i++) {
            shownItems.items.push(await useItemStore().fetchMediaItem(relatedItems[i], props.modelId))
        }
        start.value = relatedItems.length-8
        end.value = relatedItems.length
        updTimeline.value += 1
    } 
    else if (end.value === relatedItems.length-1) return
}

async function prevClick() {
    console.log('Prev Click')
    if (start.value-8 > 0) { // Regular scenario
        shownItems.items = []
        for (let i = start.value-8; i < start.value; i++) {
            shownItems.items.push(await useItemStore().fetchMediaItem(relatedItems[i], props.modelId))
        }
        end.value = start.value
        start.value = start.value - 8
        updTimeline.value += 1
    } else if (start.value > 0) { // First slide-group
        shownItems.items = []
        for (let i = 0; i < 8; i++) {
            shownItems.items.push(await useItemStore().fetchMediaItem(relatedItems[i], props.modelId))
        }
        start.value = 0
        end.value = 8
        updTimeline.value += 1
    } 
    else if (start.value === 0) return
}

const itemInfo = ref(false)
const srcCols = computed(() => {if (itemInfo.value) return 7; else return 11; })
 
const snackbar = ref(false)
const snackTimeout = ref(4000)
const snackColor = ref('white')
const text = ref('')
function snack(excOrNot: boolean) {
    if (excOrNot) {
        snackbar.value = true
        text.value = 'Excluded Video'
    } else {
        snackbar.value = true
        text.value = 'Video is no longer excluded'
    }
}

const isExcluded = ref(false)
async function checkExclude() {
    if (!itemStore.modelExcluded.has(props.modelId)) {
        return false
    }
    const excludedItems = Array.from(itemStore.modelExcluded.get(props.modelId)!)
    let res = await isGroupExcluded({
        session_info: {
            session: appStore.session, 
            collection: useModelStore().getModelCollection(props.modelId),
            modelId: props.modelId
        },
        itemId: mainItem.value.id,
        excluded_ids: excludedItems
    })
    isExcluded.value = res
}
checkExclude()

async function exclude() {
    if (!isExcluded.value) {
        itemStore.excludeItemGroup(mainItem.value.id, props.modelId)
        isExcluded.value = true
        // Logging
        excludeGroup({
            session_info: {
                session: appStore.session,
                collection: useModelStore().getModelCollection(props.modelId),
                modelId: props.modelId
            }, 
            itemId: mainItem.value.id
        })
        snack(true)
    } else {
        itemStore.removeItemFromExclude(mainItem.value.id)
        isExcluded.value = false
        // Logging
        clearExcludedGroups({
            session_info: {
                session: appStore.session,
                collection: useModelStore().getModelCollection(props.modelId),
                modelId: props.modelId
            }, 
            items: [mainItem.value.id]
        })
        snack(false)
    }
}
</script>


<style scoped>
.chosen {
    border: 2px aqua;
}
.btn-col {
    text-align: center;
}
.info-btn {
    margin-top: 1%;
    margin-right: 1%;
    position: relative;
}
.exc-btn {
    position: relative;
    margin: 2px;
    margin-top: 5px;
}
.item-details {
    background-color: azure;
    color: black;
    height: fit-content;
}
.v-slide-group {
    background-color: black;
    max-height: 30vh;
}

.v-slide-group :deep(.v-slide-group__prev--disabled) {
    pointer-events: all;
    opacity: 1;
}
.v-slide-group :deep(.v-slide-group__next--disabled) {
    pointer-events: all;
    opacity: 1;
}

.timeline-item {
    max-height: 75%;
}

</style>