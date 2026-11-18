<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <v-dialog v-model="isOpen" max-width="1080">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold">Advanced Search</div>
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- Query -->
        <v-text-field
         v-if="local.searchType === 'text'"
         data-eid="adv_search_query_textfield"
         v-model="local.queryText"
         label="Query"
         variant="outlined"
         density="comfortable"
        />

        <v-file-upload
         v-if="local.searchType === 'image'"
         data-eid="adv_search_image"
         v-model="file"
         density="default"
         :multiple="false"
        />

        <div class="d-flex align-center justify-space-between mt-3 mb-1">
          <strong>Filters</strong>
          <v-chip size="x-small" variant="outlined">
            {{ mainFilters.length }} main / {{ extraFilters.length }} extra
          </v-chip>
        </div>

        <!-- Main filters -->
        <v-row align-center justify="center">
          <template v-for="f in mainFilters" :key="'main-'+f.id">
            <v-col cols="12" sm="6" md="4" lg="3" class="pt-3">
              <v-card variant="outlined" class="pa-2">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-body-2 font-weight-bold">{{ f.name }}</div>
                  <v-chip size="x-small" variant="tonal">{{ f.tagtype }}</v-chip>
                </div>

                <div class="mt-2">
                  <!-- Alphanumerical: value selection -->
                  <template v-if="isAlpha(f.tagtype)">
                    <v-combobox
                     v-model="local.valueFilters[f.id]"
                     :data-eid="`adv_filter_${f.id}_alpha`"
                     chips
                     closable-chips
                     clearable
                     multiple
                     auto-select-first="exact"
                     :label="f.name"
                     :items="f.values"
                     item-title="value"
                     return-object
                     variant="solo-filled"
                     density="comfortable"
                     @update:model-value="onValueFilterChange(f)"
                    />
                  </template>

                  <!-- Typed filters (numeric/time/date/timestamp) -->
                  <template v-else-if="isRangeType(f.tagtype)">
                    <div class="d-flex align-center ga-2">
                      <v-select
                       v-model="local.rangeInputs[f.id].op"
                       :data-eid="`adv_filter_${f.id}_op`"
                       :items="operatorOptions(f.tagtype)"
                       label="Op"
                       variant="outlined"
                       density="comfortable"
                       hide-details
                       style="max-width: 130px"
                       @update:model-value="onRangeInput(f)"
                      />
                      <v-spacer />
                      <v-chip size="x-small" variant="outlined">
                        {{ local.rangeLeaves[f.id] ? 'Range' : '—' }}
                      </v-chip>
                    </div>

                    <div class="mt-2 d-flex ga-2" v-if="local.rangeInputs[f.id].op !== 'between'">
                      <v-text-field
                       v-model="local.rangeInputs[f.id].a"
                       :data-eid="`adv_filter_${f.id}_a`"
                       :type="inputType(f.tagtype)"
                       :label="singleValueLabel(f)"
                       :placeholder="placeholderFor(f)"
                       variant="outlined"
                       density="comfortable"
                       :hide-details="isTimeField(f) ? 'auto' : true"
                       :rules="timeFieldRules(f)"
                       @update:model-value="onRangeInput(f)"
                      />
                    </div>

                    <div class="mt-2 d-flex ga-2" v-else>
                      <v-text-field
                       v-model="local.rangeInputs[f.id].a"
                       :data-eid="`adv_filter_${f.id}_from`"
                       :type="inputType(f.tagtype)"
                       :label="fromLabel(f)"
                       :placeholder="placeholderFor(f)"
                       variant="outlined"
                       density="comfortable"
                       :hide-details="isTimeField(f) ? 'auto' : true"
                       :rules="timeFieldRules(f)"
                       @update:model-value="onRangeInput(f)"
                      />
                      <v-text-field
                       v-model="local.rangeInputs[f.id].b"
                       :data-eid="`adv_filter_${f.id}_to`"
                       :type="inputType(f.tagtype)"
                       :label="toLabel(f)"
                       :placeholder="placeholderFor(f)"
                       variant="outlined"
                       density="comfortable"
                       :hide-details="isTimeField(f) ? 'auto' : true"
                       :rules="timeFieldRules(f)"
                       @update:model-value="onRangeInput(f)"
                      />
                    </div>

                    <div v-if="isMsNumeric(f)" class="text-caption opacity-70 mt-1">
                      Tip: you can enter <code>HH:MM:SS</code> (converted to ms)
                    </div>
                    <div v-else-if="f.tagtype === 'time'" class="text-caption opacity-70 mt-1">
                      Time format: <code>HH:MM:SS</code>
                    </div>
                  </template>

                  <!-- JSON placeholder -->
                  <template v-else-if="f.tagtype === 'json'">
                    <v-alert type="info" variant="tonal" density="compact" class="mt-2">
                      JSON filters require a custom widget (developer hook).
                    </v-alert>
                  </template>

                  <template v-else>
                    <v-alert type="warning" variant="tonal" density="compact" class="mt-2">
                      Unsupported tag type: {{ f.tagtype }}
                    </v-alert>
                  </template>
                </div>
              </v-card>
            </v-col>
          </template>
        </v-row>

        <!-- Extra filters -->
        <div class="d-flex align-center justify-space-between mt-1">
          <span class="text-subtitle-1">Extra Filters</span>

          <v-btn
           variant="text"
           data-eid="extra_filters_expander"
           icon
           :aria-expanded="toggleExtraFilters"
           :aria-controls="'extra-filters-section'"
           @click="toggleExtraFilters = !toggleExtraFilters"
          >
            <v-icon :class="toggleExtraFilters ? 'rotate-180' : ''">mdi-chevron-right</v-icon>
          </v-btn>
        </div>

        <!-- LAZY MOUNT extra filters to avoid UI hang -->
        <v-expand-transition>
          <div v-if="toggleExtraFilters" id="extra-filters-section" class="mt-2">
            <v-row align-center justify="center">
              <template v-for="f in extraFilters" :key="'extra-'+f.id">
                <v-col cols="12" sm="6" md="4" lg="3" class="pt-3">
                  <v-card variant="outlined" class="pa-2">
                    <div class="d-flex align-center justify-space-between">
                      <div class="text-body-2 font-weight-bold">{{ f.name }}</div>
                      <v-chip size="x-small" variant="tonal">{{ f.tagtype }}</v-chip>
                    </div>

                    <div class="mt-2">
                      <template v-if="isAlpha(f.tagtype)">
                        <v-combobox
                         v-model="local.valueFilters[f.id]"
                         :data-eid="`adv_filter_${f.id}_alpha`"
                         chips
                         closable-chips
                         clearable
                         multiple
                         auto-select-first="exact"
                         :label="f.name"
                         :items="f.values"
                         item-title="value"
                         return-object
                         variant="solo-filled"
                         density="comfortable"
                         @update:model-value="onValueFilterChange(f)"
                        />
                      </template>

                      <template v-else-if="isRangeType(f.tagtype)">
                        <div class="d-flex align-center ga-2">
                          <v-select
                           v-model="local.rangeInputs[f.id].op"
                           :data-eid="`adv_filter_${f.id}_op`"
                           :items="operatorOptions(f.tagtype)"
                           label="Op"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           style="max-width: 130px"
                           @update:model-value="onRangeInput(f)"
                          />
                          <v-spacer />
                          <v-chip size="x-small" variant="outlined">
                            {{ local.rangeLeaves[f.id] ? 'Range' : '—' }}
                          </v-chip>
                        </div>

                        <div class="mt-2 d-flex ga-2" v-if="local.rangeInputs[f.id].op !== 'between'">
                          <v-text-field
                           v-model="local.rangeInputs[f.id].a"
                           :data-eid="`adv_filter_${f.id}_a`"
                           :type="inputType(f.tagtype)"
                           :label="singleValueLabel(f)"
                           :placeholder="placeholderFor(f)"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           @update:model-value="onRangeInput(f)"
                          />
                        </div>

                        <div class="mt-2 d-flex ga-2" v-else>
                          <v-text-field
                           v-model="local.rangeInputs[f.id].a"
                           :data-eid="`adv_filter_${f.id}_from`"
                           :type="inputType(f.tagtype)"
                           :label="fromLabel(f)"
                           :placeholder="placeholderFor(f)"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           @update:model-value="onRangeInput(f)"
                          />
                          <v-text-field
                           v-model="local.rangeInputs[f.id].b"
                           :data-eid="`adv_filter_${f.id}_to`"
                           :type="inputType(f.tagtype)"
                           :label="toLabel(f)"
                           :placeholder="placeholderFor(f)"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           @update:model-value="onRangeInput(f)"
                          />
                        </div>

                        <div v-if="isMsNumeric(f)" class="text-caption opacity-70 mt-1">
                          Tip: you can enter <code>HH:MM:SS</code> (converted to ms)
                        </div>
                        <div v-else-if="f.tagtype === 'time'" class="text-caption opacity-70 mt-1">
                          Time format: <code>HH:MM:SS</code>
                        </div>
                      </template>

                      <template v-else-if="f.tagtype === 'json'">
                        <v-alert type="info" variant="tonal" density="compact" class="mt-2">
                          JSON filters require a custom widget (developer hook).
                        </v-alert>
                      </template>
                    </div>
                  </v-card>
                </v-col>
              </template>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn
         color="primary"
         variant="flat"
         @click="search"
         :disabled="(local.searchType === 'text' && local.queryText.trim() === '')
          || (local.searchType === 'image' && !file)"
        >
          <span v-if="local.searchType === 'feedback'">Show Feedback Results</span>
          <span v-else>Search</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdvancedSearchStore } from '@/stores/advancedSearch'
import { useFilterStore } from '@/stores/filter'
import { useModelStore } from '@/stores/model'
import { useAppStore } from '@/stores/app'
import { logEvents } from '@/services/ExquisitorAPI'
import type { AdvancedSearchPayload } from '@/types/chat'
import type {
  ActiveFiltersDB,
  FilterInfo,
  FilterExpr,
  FilterValue,
  DBRangeConstraint,
} from '@/types/filter'

const advStore = useAdvancedSearchStore()
const { isOpen, payload } = storeToRefs(advStore)

const modelStore = useModelStore()
const filterStore = useFilterStore()
const appStore = useAppStore()

const activeModelId = computed(() => modelStore.activeModel!.id)
const allFilters = computed(() => filterStore.filtersInfo.get(activeModelId.value) ?? [])

// Ensure filters are loaded at component mount so filterNameIdMap is populated
// before any item tiles try to call fetchItemInfo.
if (!filterStore.filtersLoaded || !filterStore.filtersInfo.has(activeModelId.value)) {
  await filterStore.loadFilters(appStore.session, activeModelId.value)
}

const mainFilters = computed(() =>
  allFilters.value.filter(f => filterStore.isMain(f.name) || filterStore.isGroup(f.name))
)
const extraFilters = computed(() =>
  allFilters.value.filter(f => !filterStore.isMain(f.name) && !filterStore.isGroup(f.name))
)

const toggleExtraFilters = ref(false)
const file = ref<File | undefined>(undefined)

type RangeInputState = { op: string; a: string; b: string }

const local = reactive({
  queryName: '',
  queryText: '',
  searchType: 'text',
  searchModel: 'clip',

  // UI selections for alphanumerical filters
  valueFilters: {} as Record<number, FilterValue[]>,

  // operator + bound inputs for range filters
  rangeInputs: {} as Record<number, RangeInputState>,

  // built leaves for range filters (so we don't rebuild everything on submit)
  rangeLeaves: {} as Record<number, FilterExpr>,
})

const emit = defineEmits<{
  (e: 'submit', payload: AdvancedSearchPayload): void
}>()

/* ---------- tagtype classification ---------- */
function isAlpha(t: string) { return t === 'alphanumerical' }
function isNumeric(t: string) { return t === 'numerical_int' || t === 'numerical_dec' }
function isRangeType(t: string) { return isNumeric(t) || t === 'time' || t === 'date' || t === 'timestamp' }

// Only numerical_int tagsets named "(ms)" accept HH:MM:SS -> ms conversion
function isMsNumeric(f: FilterInfo) {
  return f.tagtype === 'numerical_int' && f.name.includes('(ms)')
}

// Groups the two cases that share HH:MM:SS input format
function isTimeField(f: FilterInfo) {
  return f.tagtype === 'time' || isMsNumeric(f)
}

/* ---------- input helpers ---------- */

// Returns a Vuetify validator enforcing HH:MM:SS format on time fields
const TIME_RE = /^\d{2}:\d{2}:\d{2}$/
function timeFieldRules(f: FilterInfo) {
  if (!isTimeField(f)) return []
  return [(v: string) => !v || TIME_RE.test(v) || 'Use HH:MM:SS format']
}

// Date/time types use Before/After/At labels; numeric types use < <= > >= =
function operatorOptions(tagtype: string) {
  if (tagtype === 'date' || tagtype === 'timestamp' || tagtype === 'time') {
    return [
      { title: 'Between', value: 'between' },
      { title: 'Before (<)', value: '<' },
      { title: 'After (>)', value: '>' },
      { title: 'At (=)', value: '=' },
    ]
  }
  return [
    { title: 'Between', value: 'between' },
    { title: '<', value: '<' },
    { title: '≤', value: '<=' },
    { title: '>', value: '>' },
    { title: '≥', value: '>=' },
    { title: '=', value: '=' },
  ]
}

// Maps tagtype to an HTML input type so browsers show date/time pickers
function inputType(tagtype: string) {
  if (tagtype === 'date') return 'date'
  if (tagtype === 'timestamp') return 'datetime-local'
  return 'text'
}

// Labels shown on the range input fields
function singleValueLabel(f: FilterInfo) { return isTimeField(f) ? 'Time (HH:MM:SS)' : 'Value' }
function fromLabel(f: FilterInfo) { return isTimeField(f) ? 'From (HH:MM:SS)' : 'From' }
function toLabel(f: FilterInfo) { return isTimeField(f) ? 'To (HH:MM:SS)' : 'To' }

// Example text shown inside the input before the user types
function placeholderFor(f: FilterInfo) {
  if (f.tagtype === 'time') return '01:23:45'
  if (isNumeric(f.tagtype)) return isMsNumeric(f) ? '00:01:23' : 'e.g. 42'
  return ''
}

/* ---------- logging ---------- */

// Logs the current selected values for a filter after the user changes it
function onValueFilterChange(f: FilterInfo) {
  logEvents([{
    ts: Date.now(),
    action: 'Update Advanced Search Filter ' + f.name,
    session: appStore.session,
    data: JSON.stringify({
      filter: f.name,
      values: (local.valueFilters[f.id] ?? []).map((v: any) => v.value),
    }),
  }])
}

/* ---------- parsing ---------- */

// Accepts ss, mm:ss, or hh:mm:ss
function parseHHMMSSToMs(s: string): number | null {
  const parts = s.trim().split(':').map(p => p.trim())
  if (!parts.length || parts.some(p => p === '' || !/^\d+$/.test(p))) return null
  const nums = parts.map(Number)
  let h = 0, m = 0, sec = 0
  if (nums.length === 3) { h = nums[0]; m = nums[1]; sec = nums[2] }
  else if (nums.length === 2) { m = nums[0]; sec = nums[1] }
  else if (nums.length === 1) { sec = nums[0] }
  else return null
  return ((h * 3600) + (m * 60) + sec) * 1000
}

// Converts raw text input to a number; for ms fields accepts HH:MM:SS as well
function parseRangeInput(f: FilterInfo, raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  if (isMsNumeric(f) && s.includes(':')) return parseHHMMSSToMs(s)
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/* ---------- range leaf building ---------- */

// Debounces buildRangeLeaf per filter so rapid keystrokes don't trigger repeated rebuilds
const rangeTimers = new Map<number, number>()
function onRangeInput(f: FilterInfo) {
  const id = f.id
  const old = rangeTimers.get(id)
  if (old) window.clearTimeout(old)
  const t = window.setTimeout(() => buildRangeLeaf(f), 180)
  rangeTimers.set(id, t)
}

// Translates the current op + input values into a FilterLeaf and stores it; 
// clears the leaf if inputs are incomplete
function buildRangeLeaf(f: FilterInfo) {
  const st = local.rangeInputs[f.id]
  if (!st) return

  const op = st.op
  const aRaw = (st.a ?? '').trim()
  const bRaw = (st.b ?? '').trim()

  if (op !== 'between' && !aRaw) { delete local.rangeLeaves[f.id]; return }
  if (op === 'between' && (!aRaw || !bRaw)) { delete local.rangeLeaves[f.id]; return }

  let lower: number | string | undefined
  let upper: number | string | undefined

  if (f.tagtype === 'date' || f.tagtype === 'timestamp' || f.tagtype === 'time') {
    if (op === '=') { lower = aRaw; upper = aRaw }
    else if (op === '<' || op === '<=') upper = aRaw
    else if (op === '>' || op === '>=') lower = aRaw
    else if (op === 'between') {
      lower = aRaw <= bRaw ? aRaw : bRaw
      upper = aRaw <= bRaw ? bRaw : aRaw
    }
  } else {
    const aN = parseRangeInput(f, aRaw)
    const bN = parseRangeInput(f, bRaw)
    if (op !== 'between' && aN == null) { delete local.rangeLeaves[f.id]; return }
    if (op === 'between' && (aN == null || bN == null)) { delete local.rangeLeaves[f.id]; return }

    if (op === '=') { lower = aN!; upper = aN! }
    else if (op === '<' || op === '<=') upper = aN!
    else if (op === '>' || op === '>=') lower = aN!
    else if (op === 'between') {
      lower = Math.min(aN!, bN!)
      upper = Math.max(aN!, bN!)
    }
  }

  // Build leaf using store helper
  local.rangeLeaves[f.id] = filterStore.makeRangeLeaf(
    f.id,
    f.tagtypeId,
    lower,
    upper,
    false
  )

  logEvents([{
    ts: Date.now(),
    action: 'Update Advanced Search Range Filter ' + f.name,
    session: appStore.session,
    data: JSON.stringify({ filter: f.name, op, a: aRaw, b: bRaw }),
  }])
}

// Combines all selected value filters and range leaves into a single AND group for the API; 
// returns undefined if nothing is selected
function buildActiveFiltersDB(): ActiveFiltersDB | undefined {
  const children: FilterExpr[] = []

  // alpha leaves
  for (const f of allFilters.value) {
    if (!isAlpha(f.tagtype)) continue
    const selected = local.valueFilters[f.id] ?? []
    if (!selected.length) continue
    children.push(
      filterStore.makeValueLeaf(
        f.id,
        f.tagtypeId,
        selected.map((v: FilterValue) => v.id),
        "OR",
        false
      )
    )
  }

  // range leaves
  for (const leaf of Object.values(local.rangeLeaves)) children.push(leaf)

  if (!children.length) return undefined
  // A single filter is sent as the root leaf, a group is only needed to AND several
  const root = children.length === 1 ? children[0] : filterStore.makeGroup("AND", children, false)
  return filterStore.makeActiveFilters(root)
}

// Ensures every filter has a reactive slot so v-model bindings work before the user interacts
function initFilterState() {
  for (const f of allFilters.value) {
    if (!Array.isArray(local.valueFilters[f.id])) local.valueFilters[f.id] = []
    if (isRangeType(f.tagtype) && !local.rangeInputs[f.id]) local.rangeInputs[f.id] = { op: 'between', a: '', b: '' }
  }
}

// Restores the form when re-opening a previously submitted query for editing
function hydrateFilters(af: ActiveFiltersDB) {
  Object.assign(local.valueFilters, filterStore.toAppliedFilters(af, allFilters.value))

  // Reconstruct range input state from stored bounds:
  // both bounds = between, lower only = >, upper only = <
  const byId = new Map(allFilters.value.map(f => [f.id, f]))
  const walk = (expr: FilterExpr) => {
    if (expr.kind === 'leaf') {
      const { id, constraint } = expr.filter
      if (!('lower_bound' in constraint || 'upper_bound' in constraint)) return
      const info = byId.get(id)
      if (!info) return
      const lb = (constraint as DBRangeConstraint).lower_bound
      const ub = (constraint as DBRangeConstraint).upper_bound
      local.rangeInputs[id] = lb != null && ub != null ? { op: 'between', a: String(lb), b: String(ub) }
        : lb != null ? { op: '>', a: String(lb), b: '' }
        : { op: '<', a: String(ub!), b: '' }
      local.rangeLeaves[id] = filterStore.makeRangeLeaf(info.id, info.tagtypeId, lb as any, ub as any)
    } else if (expr.kind === 'group') {
      for (const ch of (expr as { children: FilterExpr[] }).children) walk(ch)
    }
  }
  walk(af.root)
}

// Closes the dialog and resets transient UI state (selected file, extra filters panel)
function close() {
  advStore.close()
  file.value = undefined
  toggleExtraFilters.value = false
}

// Image search requires base64, not a File object
function fileToDataURL(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(f)
  })
}

// Collects the current form state into a payload and emits it to the parent to trigger a search
async function search() {
  logEvents([{
    ts: Date.now(),
    action: 'Execute Advanced Search',
    session: appStore.session,
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
    filters: buildActiveFiltersDB(),
    history: payload.value.history ?? false,
  })

  advStore.close()
}

watch(
  () => isOpen.value,
  async (open) => {
    if (!open) return

    // load filter metadata for model
    if (!filterStore.filtersLoaded || !filterStore.filtersInfo.has(activeModelId.value)) {
      await filterStore.loadFilters(appStore.session, activeModelId.value)
    }

    // hydrate query basics
    local.queryName = payload.value.queryName ?? ''
    local.queryText = payload.value.queryText ?? ''
    local.searchType = payload.value.searchType ?? 'text'
    local.searchModel = payload.value.searchModel ?? 'clip'

    // reset local state
    local.valueFilters = {}
    local.rangeInputs = {}
    local.rangeLeaves = {}
    initFilterState()

    if (payload.value.filters) {
      hydrateFilters(payload.value.filters)
    }
  },
  { immediate: true }
)

watch(activeModelId, async () => {
  if (!isOpen.value) return
  await filterStore.loadFilters(appStore.session, activeModelId.value)
  // reset states for new model
  local.valueFilters = {}
  local.rangeInputs = {}
  local.rangeLeaves = {}
  initFilterState()
})
</script>

<style scoped>
.rotate-180 { transform: rotate(90deg); transition: transform .2s; }
.v-icon { transition: transform .2s; }
</style>