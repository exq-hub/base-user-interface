<template>
    <v-sheet 
     class="pt-3 text-center"
     :color="color"
     >
        <v-btn size="small" icon="mdi-close" @click="clearFilters"></v-btn>
    </v-sheet>
    <template v-for="filter in filters">
        <v-sheet v-if="filter.filter == FilterType.Single"
         class="mx-auto pt-5 ml-2 mr-2"
         :color="color"
        >
            <v-combobox
             v-model="filterValues[filter.id][0]"
             clearable
             auto-select-first
             :label="filter.name"
             :items="filter.values.map((v,_) => v)"
             variant="solo-filled"
             @update:model-value="(vals) => updateFilter(filter.id, vals)"
             dense
            />
        </v-sheet>        
        <v-sheet v-if="filter.filter == FilterType.Multi"
         class="mx-auto pt-5 ml-2 mr-2"
         :color="color"
        >
            <v-combobox
             v-model="filterValues[filter.id]"
             chips
             closable-chips
             clearable
             multiple
             auto-select-first="exact"
             :label="filter.name"
             :items="filter.values.map((v,_) => v)"
             variant="solo-filled"
             dense
             @update:model-value="(vals) => updateFilter(filter.id, vals)"
            />
        </v-sheet>        
        <v-sheet v-if="filter.filter == FilterType.NumberRange"
         class="mx-auto pt-5 ml-2 mr-2"
         :color="color"
        >
           <range-filter
            :name="filter.name"
            :range="filter.range!"
            @value-update="(vals) => updateRangeFilter(filter.id, vals)"
           />
        </v-sheet>
        <v-sheet v-if="filter.filter == FilterType.Count"
         class="mx-auto pt-5 ml-2 mr-2"
         :color="color"
        >
            <count-filter
                :model-id="activeModelId"
                :name="filter.name"
                :items="filter.values"
                :count="filter.count!"
                :is-multi="false"
            />
        </v-sheet>
        <v-sheet v-if="filter.filter == FilterType.MultiCount"
         class="mx-auto pt-5 ml-2 mr-2"
         :color="color"
        >
            <count-filter
                :model-id="activeModelId"
                :name="filter.name"
                :items="filter.values"
                :count="filter.count!"
                :is-multi="true"
            />
        </v-sheet>

    </template>
</template>

<script setup lang="ts">
import { useFilterStore } from '@/stores/filter';
import { FilterType } from '@/types/filter';
import { reactive } from 'vue';
import RangeFilter from '@/components/drawers/filters/RangeFilter.vue'
import CountFilter from '@/components/drawers/filters/CountFilter.vue'
import { useModelStore } from '@/stores/model';

interface Props {
    color : string
}
const props = defineProps<Props>()

const emit = defineEmits(['filterUpdate'])

const color = props.color

const activeModelId = computed(() => useModelStore().activeModel.id)

const filterStore = useFilterStore()

if (!filterStore.filtersLoaded)
    await filterStore.loadFilters(activeModelId.value)

watch(activeModelId, async () => {
    // console.log('(Filters.vue) watch: activeModelId')
    await filterStore.loadFilters(activeModelId.value)
    initializeFilters()
})

const filters = computed(() => filterStore.filters)

const filterValues = reactive<{ [key: number]: (string | number)[] }>({})

function initializeFilters() {
    filters.value.forEach(filter => {
        filterValues[filter.id] = [];
        if (filter.filter === FilterType.Single || filter.filter === FilterType.Multi) {
            const values = filterStore.getFilterValues(activeModelId.value, filter.id);
            filterValues[filter.id] = values.map(index => filter.values[index]);
        }
    })
}

function updateFilter(filterId: number, value: string | number | (string|number)[]) {
    let valIds : number[] = []
    if (Array.isArray(value)) {
        value.forEach(element => {
            valIds.push(filters.value[filterId].values.findIndex((v) => v === element))
        });
    } else {
        valIds.push(filters.value[filterId].values.findIndex((v) => v === value))
    }
    filterStore.applyFilters(activeModelId.value, filterId, valIds)
    emit('filterUpdate')
    console.log('filterValues', filterValues)
}

function updateRangeFilter(filterId: number, values: [number, number]) {
    filterStore.applyRangeOrCountFilters(activeModelId.value, filterId, values);
    emit('filterUpdate');
}

function clearFilters() {
    filters.value.forEach(filter => {
        filterValues[filter.id] = []
    });
    filterStore.clearFilters(activeModelId.value)
    emit('filterUpdate')
}

initializeFilters()

</script>

<style scoped>

</style>