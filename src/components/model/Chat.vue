<template>
    <div class="w-50">
        <v-container class="d-block sticky-container" align="center">
            <v-virtual-scroll
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
                             :model-id="activeModel.id"
                             :btn-pos="true"
                             :btn-neg="false"
                             :btn-ignore="false"
                             :btn-submit="true"
                             :provided="false"
                             :overlay="true"
                            />
                        </v-col>
                    </v-row>
                </template>
            </v-virtual-scroll>
            <v-sheet 
             class="chat-options mt-5 d-flex"
             rounded
            >
                <v-btn stacked :elevation="0">
                    <v-icon>mdi-approximately-equal</v-icon>
                    Summarize
                </v-btn>
                <v-btn stacked :elevation="0">
                    <v-icon>mdi-text</v-icon>
                    Rephrase
                </v-btn>
                <v-checkbox hide-details label="Filters" />
                <v-checkbox hide-details label="History" />
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
import { searchVLM } from '@/services/ExquisitorAPI';
import { useConversationStore } from '@/stores/conversations';
import type { ChatEntryQueryText } from '@/types/chat';
import { reactive, ref } from 'vue';
import Item from '@/components/items/Item.vue';
import { useModelStore } from '@/stores/model';
import { useAppStore } from '@/stores/app';

const activeModel = computed(() => useModelStore().activeModel)
const session = computed(() => useAppStore().session)

const convStore = useConversationStore()

const loaded = ref(false)
const loading = ref(false)

const chatEntries : ChatEntryQueryText[] = reactive([])
convStore.createConversation(activeModel.value.id)

const query = ref('')
async function search() {
    loading.value = true
    const entry = await searchVLM({
        session_info: {
            session: session.value,
            modelId: activeModel.value.id
        },
        n: 10,
        text: query.value,
        seen: [],
        filters: {
            names: [],
            values: []
        },
        excluded: []
    }).then((res) => {
        loading.value = false
        loaded.value = true
        return res
    })
    console.log('entry', entry)
    chatEntries.push(entry)
    convStore.addConversation(activeModel.value.id, entry)
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