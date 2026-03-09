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
                     @update:model-value="onAlphaChange(f)"
                    />
                  </template>

                  <!-- Typed filters (numeric/time/date/timestamp) -->
                  <template v-else-if="isRangeType(f.tagtype)">
                    <div class="d-flex align-center ga-2">
                      <v-select
                       v-model="local.typed[f.id].op"
                       :data-eid="`adv_filter_${f.id}_op`"
                       :items="operatorOptions(f.tagtype)"
                       label="Op"
                       variant="outlined"
                       density="comfortable"
                       hide-details
                       style="max-width: 130px"
                       @update:model-value="debouncedApplyRangeLeaf(f)"
                      />
                      <v-spacer />
                      <v-chip size="x-small" variant="outlined">
                        {{ local.rangeLeaves[f.id] ? 'Range' : '—' }}
                      </v-chip>
                    </div>

                    <div class="mt-2 d-flex ga-2" v-if="local.typed[f.id].op !== 'between'">
                      <v-text-field
                       v-model="local.typed[f.id].a"
                       :data-eid="`adv_filter_${f.id}_a`"
                       :type="inputType(f.tagtype)"
                       :label="singleValueLabel(f)"
                       :placeholder="placeholderFor(f)"
                       variant="outlined"
                       density="comfortable"
                       :hide-details="isTimeField(f) ? 'auto' : true"
                       :rules="timeFieldRules(f)"
                       @update:model-value="debouncedApplyRangeLeaf(f)"
                      />
                    </div>

                    <div class="mt-2 d-flex ga-2" v-else>
                      <v-text-field
                       v-model="local.typed[f.id].a"
                       :data-eid="`adv_filter_${f.id}_from`"
                       :type="inputType(f.tagtype)"
                       :label="fromLabel(f)"
                       :placeholder="placeholderFor(f)"
                       variant="outlined"
                       density="comfortable"
                       :hide-details="isTimeField(f) ? 'auto' : true"
                       :rules="timeFieldRules(f)"
                       @update:model-value="debouncedApplyRangeLeaf(f)"
                      />
                      <v-text-field
                       v-model="local.typed[f.id].b"
                       :data-eid="`adv_filter_${f.id}_to`"
                       :type="inputType(f.tagtype)"
                       :label="toLabel(f)"
                       :placeholder="placeholderFor(f)"
                       variant="outlined"
                       density="comfortable"
                       :hide-details="isTimeField(f) ? 'auto' : true"
                       :rules="timeFieldRules(f)"
                       @update:model-value="debouncedApplyRangeLeaf(f)"
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
                         @update:model-value="onAlphaChange(f)"
                        />
                      </template>

                      <template v-else-if="isRangeType(f.tagtype)">
                        <div class="d-flex align-center ga-2">
                          <v-select
                           v-model="local.typed[f.id].op"
                           :data-eid="`adv_filter_${f.id}_op`"
                           :items="operatorOptions(f.tagtype)"
                           label="Op"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           style="max-width: 130px"
                           @update:model-value="debouncedApplyRangeLeaf(f)"
                          />
                          <v-spacer />
                          <v-chip size="x-small" variant="outlined">
                            {{ local.rangeLeaves[f.id] ? 'Range' : '—' }}
                          </v-chip>
                        </div>

                        <div class="mt-2 d-flex ga-2" v-if="local.typed[f.id].op !== 'between'">
                          <v-text-field
                           v-model="local.typed[f.id].a"
                           :data-eid="`adv_filter_${f.id}_a`"
                           :type="inputType(f.tagtype)"
                           :label="singleValueLabel(f)"
                           :placeholder="placeholderFor(f)"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           @update:model-value="debouncedApplyRangeLeaf(f)"
                          />
                        </div>

                        <div class="mt-2 d-flex ga-2" v-else>
                          <v-text-field
                           v-model="local.typed[f.id].a"
                           :data-eid="`adv_filter_${f.id}_from`"
                           :type="inputType(f.tagtype)"
                           :label="fromLabel(f)"
                           :placeholder="placeholderFor(f)"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           @update:model-value="debouncedApplyRangeLeaf(f)"
                          />
                          <v-text-field
                           v-model="local.typed[f.id].b"
                           :data-eid="`adv_filter_${f.id}_to`"
                           :type="inputType(f.tagtype)"
                           :label="toLabel(f)"
                           :placeholder="placeholderFor(f)"
                           variant="outlined"
                           density="comfortable"
                           hide-details
                           @update:model-value="debouncedApplyRangeLeaf(f)"
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
         :disabled="(['clip','caption','aggregate'].includes(local.searchType) && local.queryText === '')
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
  AppliedFilters,
  FilterInfo,
  FilterExpr,
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

type TypedState = { op: string; a: string; b: string }

const local = reactive({
  queryName: '',
  queryText: '',
  searchType: 'text',
  searchModel: 'clip',

  // UI selections for alphanumerical filters
  valueFilters: {} as AppliedFilters,

  // typed inputs for range filters
  typed: {} as Record<number, TypedState>,

  // built leaves for range filters (so we don’t rebuild everything on submit)
  rangeLeaves: {} as Record<number, FilterExpr>,
})

const emit = defineEmits<{
  (e: 'submit', payload: AdvancedSearchPayload): void
}>()

/* ---------- helpers: types ---------- */
function isAlpha(t: string) { return t === 'alphanumerical' }
function isNumeric(t: string) { return t === 'numerical_int' || t === 'numerical_dec' }
function isTime(t: string) { return t === 'time' }
function isRangeType(t: string) { return isNumeric(t) || isTime(t) || t === 'date' || t === 'timestamp' }

// ONLY numerical_int tagsets named "(ms)" accept HH:MM:SS -> ms conversion
function isMsNumeric(f: FilterInfo) {
  return f.tagtype === 'numerical_int' && f.name.includes('(ms)')
}
function isTimeField(f: FilterInfo) {
  return f.tagtype === 'time' || isMsNumeric(f)
}

const TIME_RE = /^\d{2}:\d{2}:\d{2}$/
function timeFieldRules(f: FilterInfo) {
  if (!isTimeField(f)) return []
  return [(v: string) => !v || TIME_RE.test(v) || 'Use HH:MM:SS format']
}

/* ---------- UX: operators + labels ---------- */
function operatorOptions(tagtype: string) {
  if (tagtype === 'date' || tagtype === 'timestamp' || tagtype === 'time') {
    return [
      { title: 'Between', value: 'between' },
      { title: 'Before (<)', value: '<' },
      { title: 'After (>)', value: '>' },
      { title: 'At (=)', value: '=' },
    ]
  }
  // numeric
  return [
    { title: 'Between', value: 'between' },
    { title: '<', value: '<' },
    { title: '≤', value: '<=' },
    { title: '>', value: '>' },
    { title: '≥', value: '>=' },
    { title: '=', value: '=' },
  ]
}

function inputType(tagtype: string) {
  if (tagtype === 'date') return 'date'
  if (tagtype === 'timestamp') return 'datetime-local'
  return 'text'
}

function singleValueLabel(f: FilterInfo) {
  if (f.tagtype === 'date' || f.tagtype === 'timestamp') return 'Value'
  if (f.tagtype === 'time') return 'Time (HH:MM:SS)'
  return isMsNumeric(f) ? 'Time (HH:MM:SS)' : 'Value'
}
function fromLabel(f: FilterInfo) {
  if (f.tagtype === 'date' || f.tagtype === 'timestamp') return 'From'
  if (f.tagtype === 'time') return 'From (HH:MM:SS)'
  return isMsNumeric(f) ? 'From (HH:MM:SS)' : 'From'
}
function toLabel(f: FilterInfo) {
  if (f.tagtype === 'date' || f.tagtype === 'timestamp') return 'To'
  if (f.tagtype === 'time') return 'To (HH:MM:SS)'
  return isMsNumeric(f) ? 'To (HH:MM:SS)' : 'To'
}
function placeholderFor(f: FilterInfo) {
  if (f.tagtype === 'time') return '01:23:45'
  if (isNumeric(f.tagtype)) return isMsNumeric(f) ? '00:01:23' : 'e.g. 42'
  return ''
}

/* ---------- logging ---------- */
function onAlphaChange(f: FilterInfo) {
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

/* ---------- parsing (only what we truly need) ---------- */
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

function parseNumeric(f: FilterInfo, raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  if (isMsNumeric(f) && s.includes(':')) return parseHHMMSSToMs(s)
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/* ---------- debounce to prevent UI thrash ---------- */
const rangeTimers = new Map<number, number>()
function debouncedApplyRangeLeaf(f: FilterInfo) {
  const id = f.id
  const old = rangeTimers.get(id)
  if (old) window.clearTimeout(old)
  const t = window.setTimeout(() => applyRangeLeafNow(f), 180)
  rangeTimers.set(id, t)
}

/* ---------- build range leaves using store helper ---------- */
function applyRangeLeafNow(f: FilterInfo) {
  const st = local.typed[f.id]
  if (!st) return

  const op = st.op
  const aRaw = (st.a ?? '').trim()
  const bRaw = (st.b ?? '').trim()

  if (op !== 'between' && !aRaw) { delete local.rangeLeaves[f.id]; return }
  if (op === 'between' && (!aRaw || !bRaw)) { delete local.rangeLeaves[f.id]; return }

  let lower: number | string | undefined
  let upper: number | string | undefined

  if (f.tagtype === 'date' || f.tagtype === 'timestamp') {
    if (op === '=') { lower = aRaw; upper = aRaw }
    else if (op === '<' || op === '<=') upper = aRaw
    else if (op === '>' || op === '>=') lower = aRaw
    else if (op === 'between') {
      lower = aRaw <= bRaw ? aRaw : bRaw
      upper = aRaw <= bRaw ? bRaw : aRaw
    }
  } else if (f.tagtype === 'time') {
    // keep HH:MM:SS as strings, no ms conversion
    if (op === '=') { lower = aRaw; upper = aRaw }
    else if (op === '<' || op === '<=') upper = aRaw
    else if (op === '>' || op === '>=') lower = aRaw
    else if (op === 'between') {
      lower = aRaw <= bRaw ? aRaw : bRaw
      upper = aRaw <= bRaw ? bRaw : aRaw
    }
  } else {
    const aN = parseNumeric(f, aRaw)
    const bN = parseNumeric(f, bRaw)
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

/* ---------- ActiveFiltersDB builder using store helpers ---------- */
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
        selected.map(v => v.id),
        "OR",
        false
      )
    )
  }

  // range leaves
  for (const leaf of Object.values(local.rangeLeaves)) children.push(leaf)

  if (!children.length) return undefined
  const root = filterStore.makeGroup("AND", children, false)
  return filterStore.makeActiveFilters(root)
}

/* ---------- hydration (supports both legacy & ActiveFiltersDB) ---------- */
function cloneAppliedFilters(src: any): AppliedFilters {
  const out: AppliedFilters = {}
  if (!src || typeof src !== 'object' || Array.isArray(src)) return out
  for (const [k, v] of Object.entries(src)) {
    if (Array.isArray(v)) out[Number(k)] = (v as any[]).slice() as any
  }
  return out
}

function ensureAllKeys() {
  for (const f of allFilters.value) {
    if (!Array.isArray(local.valueFilters[f.id])) local.valueFilters[f.id] = []
    if (isRangeType(f.tagtype) && !local.typed[f.id]) local.typed[f.id] = { op: 'between', a: '', b: '' }
  }
}

// Walk ActiveFiltersDB and hydrate UI
function hydrateFromActiveFiltersDB(af: ActiveFiltersDB) {
  const byId = new Map<number, FilterInfo>()
  for (const f of allFilters.value) byId.set(f.id, f)

  const walk = (expr: any) => {
    if (!expr) return
    if (expr.kind === 'leaf') {
      const id = expr.filter?.id
      const c = expr.filter?.constraint
      if (typeof id !== 'number' || !c) return
      const info = byId.get(id)
      if (!info) return

      // DBValueConstraint -> UI select values
      if ('value_ids' in c) {
        const ids: number[] = c.value_ids ?? []
        local.valueFilters[id] = info.values.filter(v => ids.includes(v.id))
        return
      }

      // DBRangeConstraint -> typed fields + range leaf
      if ('lower_bound' in c || 'upper_bound' in c) {
        const lb = (c as DBRangeConstraint).lower_bound
        const ub = (c as DBRangeConstraint).upper_bound
        if (!local.typed[id]) local.typed[id] = { op: 'between', a: '', b: '' }

        if (lb != null && ub != null) {
          local.typed[id] = { op: 'between', a: String(lb), b: String(ub) }
        } else if (lb != null) {
          local.typed[id] = { op: '>', a: String(lb), b: '' }
        } else if (ub != null) {
          local.typed[id] = { op: '<', a: String(ub), b: '' }
        }

        // build leaf using store helper
        local.rangeLeaves[id] = filterStore.makeRangeLeaf(
          info.id,
          info.tagtypeId,
          lb as any,
          ub as any,
          false
        )
      }
      return
    }
    if (expr.kind === 'group' && Array.isArray(expr.children)) {
      for (const ch of expr.children) walk(ch)
    }
  }

  walk(af.root)
}

function close() {
  advStore.close()
  file.value = undefined
  toggleExtraFilters.value = false
}

function fileToDataURL(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(f)
  })
}

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

  const filtersDB = buildActiveFiltersDB()

  emit('submit', {
    queryName: local.queryName,
    queryText: local.queryText,
    searchType: local.searchType,
    searchModel: local.searchModel,
    // NOTE: This emits ActiveFiltersDB | undefined. We’ll update types after.
    filters: (filtersDB ?? {}) as any,
    history: payload.value.history ?? false,
  } as any)

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
    local.typed = {}
    local.rangeLeaves = {}
    ensureAllKeys()

    // hydrate filters: supports legacy AppliedFilters map OR ActiveFiltersDB
    const pf: any = payload.value.filters
    if (pf && typeof pf === 'object' && 'root' in pf) {
      hydrateFromActiveFiltersDB(pf as ActiveFiltersDB)
    } else {
      local.valueFilters = cloneAppliedFilters(pf)
      ensureAllKeys()
    }
  },
  { immediate: true }
)

watch(activeModelId, async () => {
  if (!isOpen.value) return
  await filterStore.loadFilters(appStore.session, activeModelId.value)
  // reset states for new model
  local.valueFilters = {}
  local.typed = {}
  local.rangeLeaves = {}
  ensureAllKeys()
})
</script>

<style scoped>
.rotate-180 { transform: rotate(90deg); transition: transform .2s; }
.v-icon { transition: transform .2s; }
</style>