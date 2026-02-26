<template>
  <v-dialog v-model="isOpen" max-width="1080">
    <v-card>
      <v-card-title>Advanced Search</v-card-title>
      <v-card-text>
        <v-text-field
        v-if="local.searchType === 'text'"
        data-eid="adv_search_query_textfield"
        v-model="local.queryText"
        label="Query"
        />
        <v-file-upload
        v-if="local.searchType === 'image'"
        data-eid="adv_search_image"
        v-model="file"
        density="default"
        :multiple="false"
        />
        <!-- <v-radio-group
          v-if="local.searchType !== 'feedback'"
          v-model="local.searchModel"
          inline
          >
          <v-radio
          label="CLIP"
          value="clip"
          />
          <v-radio
          v-if="local.searchType === 'image'"
          label="SIFT"
          value="sift"
          />
        </v-radio-group> -->
        <!-- <v-select
          :items="['CLIP']"
          v-model="local.searchType"
          label="Search type"
          /> -->
          <strong>Filters</strong>
          <v-row align-center justify="center">
            <template v-for="filter in filters">
              <v-col
              v-if="filterStore.isMain(filter.name) || filterStore.isGroup(filter.name)"
              :key="'search-dialog-main-'+filter.id"
              :data-eid="'adv_search_dialog_filter_'+filter.name"
              class="mx-auto pt-5 ml-2 mr-2"
              cols="3"
              sm="3"
              >
              <v-combobox
              v-model="local.filters[filter.id]"
              :data-eid="'adv_search_dialog_filter_'+filter.name+'_combobox'"
              chips
              closable-chips
              clearable
              multiple
              auto-select-first="exact"
              :label="filter.name"
              :items="filter.values"
              item-title="value"
              return-object
              variant="solo-filled"
              dense
              @update:model-value="logEvents([{
                ts: Date.now(),
                action: 'Update Advanced Search Filter ' + filter.name,
                session: useAppStore().session,
                data: JSON.stringify({
                  filter: filter.name,
                  values: local.filters[filter.id].map(v => v.value),
                })
              }])"
              />
            </v-col>
          </template>
        </v-row>
        <div class="align-center justify-space-between">
          <span class="text-subtitle-1">Extra Filters</span>
          
          <v-btn
          variant="text"
          data-eid="extra_filters_expander"
          icon
          :aria-expanded="toggleExtraFilters"
          :aria-controls="'info-section'"
          @click="toggleExtraFilters = !toggleExtraFilters"
          >
          <v-icon
          :class="toggleExtraFilters ? 'rotate-180' : ''"
          >
          mdi-chevron-right
        </v-icon>
      </v-btn>
    </div>
    <v-expand-transition>
      <div 
      v-show="toggleExtraFilters"
      class="mt-2"
      >
      <v-row align-center justify="center">
        <template v-for="filter in filters">
          <v-col
          v-if="!filterStore.isMain(filter.name) && !filterStore.isGroup(filter.name)"
          :key="'search-dialog-extra-'+filter.id"
          class="mx-auto pt-5 ml-2 mr-2"
          cols="3"
          sm="3"
          >
          <v-combobox
          :data-eid="'adv_search_dialog_filter_'+filter.name+'_combobox'"
          v-model="local.filters[filter.id]"
          chips
          closable-chips
          clearable
          multiple
          auto-select-first="exact"
          :label="filter.name"
          :items="filter.values"
          item-title="value"
          return-object
          variant="solo-filled"
          dense
          @update:model-value="logEvents([{
            ts: Date.now(),
            action: 'Update Advanced Search Filter ' + filter.name,
            session: useAppStore().session,
            data: JSON.stringify({
              filter: filter.name,
              values: local.filters[filter.id].map(v => v.value),
            })
          }])"
          />
        </v-col>
      </template>
    </v-row>
  </div>
</v-expand-transition>
</v-card-text>
<v-card-actions>
  <v-spacer />
  <v-btn variant="text" @click="close">Cancel</v-btn>
  <v-btn 
  color="primary" @click="search"
  :disabled="(['clip', 'caption', 'aggregate'].includes(local.searchType) 
  && local.queryText === '')
  || (local.searchType === 'image' && file === undefined)"
  >
  <span v-if="local.searchType === 'feedback'">
    Show Feedback Results
  </span>
  <span v-else>
    Search
  </span>
</v-btn>
</v-card-actions>
</v-card>
</v-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdvancedSearchStore } from '@/stores/advancedSearch'
import { useFilterStore } from '@/stores/filter'
import { useModelStore } from '@/stores/model'
import { useAppStore } from '@/stores/app'
import { AppliedFilters } from '@/types/filter'
import { logEvents } from '@/services/ExquisitorAPI'
import { AdvancedSearchPayload } from '@/types/chat'

const advStore = useAdvancedSearchStore()
const { isOpen, payload } = storeToRefs(advStore)

const activeModelId = computed(() => useModelStore().activeModel!.id)
const filterStore = useFilterStore()
const filters = computed(() => filterStore.filtersInfo.get(activeModelId.value)!)

const toggleExtraFilters = ref(false)

const file = ref<File | undefined>(undefined)
  
// Work on a local copy so you don't mutate the store until "Apply"
const local = reactive({
  queryName: '',
  queryText: '',
  searchType: '',
  searchModel: 'clip',
  filters: {} as AppliedFilters
})
  
const emit = defineEmits<{
  (e: 'submit', payload: AdvancedSearchPayload): void
}>()
  
watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      const event: ClientEvent = {
        ts: Date.now(),
        action: 'Open Advanced Search Dialog',
        session: useAppStore().session,
      }
      logEvents([event])
      // initialize local form with current payload each time dialog opens
      local.queryName = payload.value.queryName
      local.queryText = payload.value.queryText
      local.searchType = payload.value.searchType
      local.searchModel = payload.value.searchModel
      if (Object.keys(payload.value.filters).length > 0) {
        local.filters = payload.value.filters
      } else {
        local.filters = {}
        filters.value.forEach((filter) => {
          local.filters[filter.id] = []
        })
      }
    } else {
      close()
    }
  },
  { immediate: true }
)
  
function close() {
  advStore.close()
  file.value = undefined
  const event: ClientEvent = {
    ts: Date.now(),
    action: 'Close Advanced Search Dialog',
    session: useAppStore().session,
  }
  logEvents([event])
}
  
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
  
async function search() {
  logEvents([{
    ts: Date.now(),
    action: 'Execute Advanced Search',
    session: useAppStore().session,
  }])
  
  if (local.searchType === 'image') {
    local.queryName = URL.createObjectURL(file.value!)
    local.queryText = await fileToDataURL(file.value!)
  } else {
    local.queryName = local.queryText
  }
  
  emit('submit', {
    queryName: local.queryName,
    queryText: local.queryText,
    searchType: local.searchType,
    searchModel: local.searchModel,
    filters: local.filters,
    history: payload.value.history ?? false,
  } as any)
  
  advStore.close()
}
  
if (!filterStore.filtersLoaded) {
  await filterStore.loadFilters(useAppStore().session, activeModelId.value)
}
  
watch(activeModelId, async () => {
  await filterStore.loadFilters(useAppStore().session, activeModelId.value) 
})
  
</script>

<style scoped>
.rotate-180 { transform: rotate(90deg); transition: transform .2s; }
.v-icon { transition: transform .2s; }
</style>
