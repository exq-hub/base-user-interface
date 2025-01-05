<template>
    <div class="w-50">
        <v-container class="d-block sticky-container" align="center">
            <v-virtual-scroll
             ref="scroller"
             :items="chatEntries"
             height="70vh"
            >
                <template v-slot:default="{ item }">
                    <v-list-item>
                        <template v-slot:append>
                            <div class="user-bubble" >{{ item.userQuery }}</div>
                        </template>
                    </v-list-item>
                    <v-row class="ma-1">
                        <v-col v-for="(it,idx) in item.vlmResults" cols="3">
                            <item 
                             :item-id="it"
                             :item-index="idx"
                             :grid-index="-1"
                             :model-id="activeModel!.id"
                             :btn-pos="true"
                             :btn-neg="false"
                             :btn-ignore="false"
                             :btn-submit="true"
                             :provided="false"
                             :overlay="false"
                            />
                        </v-col>
                    </v-row>
                </template>
            </v-virtual-scroll>
            <v-sheet 
             class="chat-options mt-5 d-flex"
             rounded
            >
                <v-checkbox hide-details label="Apply Filters" v-model="checkFilters" />
                <v-checkbox hide-details label="Apply History" v-model="checkHistory"/>
                <v-number-input hide-details 
                 v-model="itemsToShow"
                 control-variant="split"
                 variant="solo"
                 max-width="25%"
                />
                <v-btn stacked :elevation="0"
                 @click="clearModelChat"
                 style="align-self:center; height:100%"
                >
                    <v-icon color="red">mdi-close</v-icon>
                    Clear
                </v-btn>
            </v-sheet>
            <v-text-field
             v-model="query"
             class="mt-5"
             variant="outlined"
             label="What are you looking for?"
             density="compact"
             clearable
             hide-details
             :loading="loading"
             append-inner-icon="mdi-magnify"
             @click:append-inner="search"
             @keydown.enter="search"
            />
    </v-container>
    </div>
</template>

<script lang="ts" setup>
import { clearConversation, searchVLM } from '@/services/ExquisitorAPI';
import { useConversationStore } from '@/stores/conversations';
import type { ChatEntryQueryText } from '@/types/chat';
import { ref } from 'vue';
import Item from '@/components/items/Item.vue';
import { useModelStore } from '@/stores/model';
import { useAppStore } from '@/stores/app';
import { useFilterStore } from '@/stores/filter';
import { ExqTextSearchRequest } from '@/types/exq';
import { useItemStore } from '@/stores/item';
import { ILSets } from '@/types/mediaitem';
import { VVirtualScroll } from 'vuetify/components/VVirtualScroll';

const activeModel = computed(() => useModelStore().activeModel)
const session = computed(() => useAppStore().session)

const convStore = useConversationStore()

const loaded = ref(false)
const loading = ref(false)

const chatEntries = ref<ChatEntryQueryText[]>([])
convStore.createConversation(activeModel.value!.id)

const scroller = ref<VVirtualScroll | null>(null);
const scrollToBottom = () => {
  if (scroller.value) {
    const container = scroller.value.$el as HTMLElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
};

const checkFilters = ref(false)
const checkHistory = ref(false)
const itemsToShow = ref(10)

const itemStore = useItemStore()

const query = ref('')
async function search() {
    loading.value = true
    let reqObj : ExqTextSearchRequest = {
        session_info: {
            session: session.value,
            modelId: activeModel.value!.id
        },
        n: itemsToShow.value,
        text: query.value,
        seen: [],
        filters: {
            names: [],
            values: []
        },
        excluded: []
    }
    if (checkFilters.value) {
        let filters = useFilterStore().getModelFilters(activeModel.value!.id)
        reqObj.filters = filters
    }
    if (checkHistory.value) {
        let pos = itemStore.getSetItems(activeModel.value!.id, ILSets.Positives).map((e,_) => e.id)
        let neg = itemStore.getSetItems(activeModel.value!.id, ILSets.Negatives).map((e,_) => e.id)
        let hist = itemStore.getSetItems(activeModel.value!.id, ILSets.History).map((e,_) => e.id)
        hist.push(...pos)
        hist.push(...neg)
        hist.push(...activeModel.value!.grid[0].items)
        reqObj.seen = hist
    }
    const entry = await searchVLM(reqObj).then((res) => {
        loading.value = false
        loaded.value = true
        return res
    })
    console.log('entry', entry)
    chatEntries.value.push(entry)
    convStore.addConversation(activeModel.value!.id, entry)
    scrollToBottom()
}

function clearModelChat () {
    chatEntries.value = []
    clearConversation({session: session.value, modelId: activeModel.value!.id})
}

</script>

<style scoped>
.user-bubble {
  /* (A1) FONT & COLORS */
  font-size: 1.2em;
  color: #fff;
  background: #7a3992;

  /* (A2) DIMENSIONS */
  padding: 15px;
  border-radius: 10px;
  max-width: 600px;
}

.v-virtual-scroll {
    padding: 5px;
    border-radius: 10px;
    border-color: cadetblue;
    border: solid 1px;
}

/* Additional styles if needed */
.v-virtual-scroll__container {
  /* Make sure this class has proper overflow settings */
  max-height: 70vh;
}

.chat-options {
    justify-content: space-evenly;
}

.sticky-container {
    position: -webkit-sticky; /* For Safari */
    position: sticky;
    top: 5vh; /* Adjust as needed */
    z-index: 1000; /* Ensure it is above other content */
}
</style>