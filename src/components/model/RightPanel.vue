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
        <v-list :v-model="posUpdate">
            <v-list-item v-for="it in sets.positives">
                <item 
                 :item-id="it.id"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="false"
                 :btn-neg="true"
                 :btn-ignore="true"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="true"
                 @urf-change="getPositives"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
    
    <v-navigation-drawer 
     v-if="negToggle"
     location="right"
     color="error"
     >
        <v-list :v-model="negUpdate">
            <v-list-item v-for="it in sets.negatives">
                <item 
                 :item-id="it.id"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="true"
                 :btn-neg="false"
                 :btn-ignore="true"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="true"
                 @urf-change="getNegatives"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer 
     v-if="histToggle"
     location="right"
     color="grey"
     >
        <v-list :v-model="histUpdate">
            <v-list-item v-for="it in sets.history">
                <item 
                 :item-id="it.id"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="true"
                 :btn-neg="true"
                 :btn-ignore="false"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="true"
                 @urf-change="getHistory"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

</template>



<script setup lang="ts">
import { useItemStore } from '@/stores/item';
import { computed, reactive, ref } from 'vue';
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

const sets = reactive({
    positives : [] as MediaItem[],
    negatives : [] as MediaItem[],
    history : [] as MediaItem[],
})

function getPositives() {
    sets.positives = getSetItems(activeModelId.value, ILSets.Positives)
}

function getNegatives() {
    sets.negatives = getSetItems(activeModelId.value, ILSets.Negatives)
}

function getHistory() {
    sets.history = getSetItems(activeModelId.value, ILSets.History)
}

const posUpdate = computed(() => getPositives())
const negUpdate = computed(() => getNegatives())
const histUpdate = computed(() => getHistory())
</script>