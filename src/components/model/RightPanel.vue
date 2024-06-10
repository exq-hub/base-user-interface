<template>
    <v-navigation-drawer
     theme="dark"
     location="right"
     rail
    >
        <v-list>
            <v-list-item
             prepend-icon="mdi-thumb-up-outline"
             @click="console.log('clicked positives'); posToggle = !posToggle; getPositives()"
            >
            </v-list-item>

            <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <v-list-item
             prepend-icon="mdi-thumb-down-outline"
             @click="console.log('clicked negatives'); negToggle = !negToggle; getNegatives()"
            >
            </v-list-item>

            <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <v-list-item
             prepend-icon="mdi-history"
             @click="console.log('clicked history'); histToggle = !histToggle; getHistory()"
            >
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer 
     v-if="posToggle"
     location="right"
     color="success"
     >
        <!-- TODO: Move this part into generic component (ItemSet) -->
        <v-list>
            <v-list-item 
             v-for="(it,idx) in positives"
             :key="'pos'+it.id+idx"
            >
                <item 
                 :item-id="it.id"
                 :item-index="idx"
                 :grid-index="-1"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="false"
                 :btn-neg="true"
                 :btn-ignore="true"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="false"
                 @replace="getPositives"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
    
    <v-navigation-drawer 
     v-if="negToggle"
     location="right"
     color="error"
     >
        <v-list>
            <v-list-item
             v-for="(it,idx) in negatives"
             :key="'neg'+it.id+idx"
            >
                <item 
                 :item-id="it.id"
                 :item-index="idx"
                 :grid-index="-1"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="true"
                 :btn-neg="false"
                 :btn-ignore="true"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="false"
                 @replace="getNegatives"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer 
     v-if="histToggle"
     location="right"
     color="grey"
     >
        <v-list>
            <v-list-item
             v-for="(it,idx) in history"
             :key="'hist'+it.id+idx"
            >
                <item 
                 :item-id="it.id"
                 :item-index="idx"
                 :grid-index="-1"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="true"
                 :btn-neg="true"
                 :btn-ignore="false"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="false"
                 @replace="getHistory"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

</template>



<script setup lang="ts">
import { useItemStore } from '@/stores/item';
import { computed, ref } from 'vue';
import type MediaItem from '@/types/mediaitem';
import Item from '@/components/items/Item.vue';
import { useModelStore } from '@/stores/model';
import { ILSets } from '@/types/mediaitem';

const itemStore = useItemStore()
const activeModelId = computed(() => useModelStore().activeModel.id)
const { getSetItems } = itemStore

const posToggle = ref(false)
const negToggle = ref(false)
const histToggle = ref(false)

const positives = ref<MediaItem[]>([])
const negatives = ref<MediaItem[]>([])
const history = ref<MediaItem[]>([])

function getPositives() {
    positives.value = getSetItems(activeModelId.value, ILSets.Positives)
}

function getNegatives() {
    negatives.value = getSetItems(activeModelId.value, ILSets.Negatives)
}

function getHistory() {
    history.value = getSetItems(activeModelId.value, ILSets.History)
}

</script>