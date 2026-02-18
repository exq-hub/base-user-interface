<template>
    <v-navigation-drawer
     theme="dark"
     rail
    >
        <v-list>
            <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <v-list-item
             data-eid="left_panel_exclude_btn"
             prepend-icon="mdi-filter-remove-outline"
             @click="console.log('clicked excluded'); excludeToggle = !excludeToggle;"
            >
            </v-list-item>

            <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <v-list-item
             data-eid="left_panel_positives_btn"
             prepend-icon="mdi-thumb-up-outline"
             @click="console.log('clicked positives'); posToggle = !posToggle;"
            >
            </v-list-item>

            <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <v-list-item
             data-eid="left_panel_negatives_btn"
             prepend-icon="mdi-thumb-down-outline"
             @click="console.log('clicked negatives'); negToggle = !negToggle;"
            >
            </v-list-item>

            <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <!-- <v-list-item
             prepend-icon="mdi-history"
             @click="console.log('clicked history'); histToggle = !histToggle; getHistory()"
            >
            </v-list-item> -->

        </v-list>
    </v-navigation-drawer>
    
    <v-navigation-drawer
     v-if="excludeToggle"
     location="left"
     color="grey-lighten-3"
    >
        <excluded-groups />
    </v-navigation-drawer>

    <v-navigation-drawer 
     v-if="posToggle"
     location="right"
     color="success"
     >
        <!-- TODO: Move this part into generic component (ItemSet) -->
        <v-sheet
        class="text-center pt-3 pb-3"
        color="success"
        >
            <v-btn :data-eid="'left_panel_clear_positives_btn_model_' + activeModelId" size="small" @click="clearPositives">
                Clear List
            </v-btn>
        </v-sheet>
        <v-list>
            <v-list-item 
             v-for="(it,idx) in positives"
             :key="'pos'+it.id+idx"
            >
                <item 
                 :item-id="it.id"
                 :item-index="idx"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="false"
                 :btn-neg="true"
                 :btn-ignore="true"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="false"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
    
    <v-navigation-drawer 
     v-if="negToggle"
     location="right"
     color="error"
     >
        <v-sheet
         class="text-center pt-3 pb-3"
         color="error"
        >
            <v-btn :data-eid="'left_panel_clear_negatives_btn_model_' + activeModelId" size="small" @click="clearNegatives">
                Clear List
            </v-btn>
        </v-sheet>
        <v-list>
            <v-list-item
             v-for="(it,idx) in negatives"
             :key="'neg'+it.id+idx"
            >
                <item 
                 :item-id="it.id"
                 :item-index="idx"
                 :item="it"
                 :model-id="activeModelId"
                 :btn-pos="true"
                 :btn-neg="false"
                 :btn-ignore="true"
                 :btn-submit="true"
                 :provided="true"
                 :overlay="false"
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer 
     v-if="histToggle"
     location="right"
     color="grey"
    >
        <v-sheet
         class="text-center pt-3 pb-3"
         color="grey"
        >
            <v-btn data-eid="left_panel_clear_history_btn" size="small" icon="mdi-close" @click="clearHistory"></v-btn>
        </v-sheet>
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
                 :btn-submit="false"
                 :provided="true"
                 :overlay="false"
                />
                 <!-- @replace="getHistory" -->
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useItemStore } from '@/stores/item';
import { computed, ref } from 'vue';
import Item from '@/components/items/Item.vue';
import { useModelStore } from '@/stores/model';
import { ILSets } from '@/types/mediaitem';
import ExcludedGroups from '@/components/drawers/filters/ExcludedGroups.vue';

// const filterToggle = ref(false)
const excludeToggle = ref(false)
const itemStore = useItemStore()
const activeModelId = computed(() => useModelStore().activeModel!.id)
const { getSetItems, removeItemsFromSet } = itemStore

const emit = defineEmits(['filterUpdate'])
const posToggle = ref(false)
const negToggle = ref(false)
const histToggle = ref(false)

const positives = computed(() => getSetItems(activeModelId.value, ILSets.Positives))
const negatives = computed(() => getSetItems(activeModelId.value, ILSets.Negatives))
const history = computed(() => getSetItems(activeModelId.value, ILSets.Negatives))

function clearPositives() {
    removeItemsFromSet(positives.value.map((it) => it.id), activeModelId.value, ILSets.Positives)
}

function clearNegatives() {
    removeItemsFromSet(negatives.value.map((it) => it.id), activeModelId.value, ILSets.Negatives)
}

function clearHistory() {
    removeItemsFromSet(history.value.map((it) => it.id), activeModelId.value, ILSets.History)
}
</script>

<style scoped>

</style>