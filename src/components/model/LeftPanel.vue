<template>
    <v-navigation-drawer
     theme="dark"
     rail
    >
        <v-list>
            <v-list-item
             prepend-icon="mdi-filter-outline"
             @click="console.log('clicked filter'); filterToggle = !filterToggle;"
            >
            </v-list-item>

            <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <v-list-item
             prepend-icon="mdi-filter-remove-outline"
             @click="console.log('clicked excluded'); excludeToggle = !excludeToggle;"
            >
            </v-list-item>

            <!-- <v-divider :thickness="30" class="border-opacity-0"></v-divider>

            <v-list-item
             prepend-icon="mdi-call-merge"
             @click="console.log('clicked merge')"
            >
            </v-list-item> -->
        </v-list>
    </v-navigation-drawer>
    
    <v-navigation-drawer 
     v-if="filterToggle"
     location="left"
     color="indigo-lighten-3"
    >
        <filters
         :color="'indigo-lighten-3'"
         @filter-update="$emit('filterUpdate')"/>
    </v-navigation-drawer>

    <v-navigation-drawer
     v-if="excludeToggle"
     location="left"
     color="orange-lighten-2"
    >
        <excluded-videos />
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import filters from '@/components/drawers/filters/Filters.vue'
import ExcludedVideos from '@/components/drawers/filters/ExcludedVideos.vue';

const filterToggle = ref(false)
const excludeToggle = ref(false)

const emit = defineEmits(['filterUpdate'])

</script>

<style scoped>

</style>