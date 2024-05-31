// Utilities
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import Model, { Settings, ResourceValues, GridGroup } from '@/types/model'
import { ExqURFRequest } from '@/types/exq'
import { searchURF, initModel, removeModel } from '@/services/ExquisitorAPI'
import { useAppStore } from './app'

export const useModelStore = defineStore('model', () => {
    const nModels = ref(0)
    const models = reactive<Model[]>([]) 
    const totalItems = ref(0)

    function defaultSettings() : Settings {
        return { 
            groups: [{
                id: 0, 
                name: 'RF', 
                itemsToShow: 20
            }], 
            resources: ResourceValues.Low 
        }
    }

    const firstModel : Model = {
        session: useAppStore().session,
        id: 0,
        name: 'Model 0',
        settings: defaultSettings(),
        grid: [],
    }
    const activeModel = ref<Model>(firstModel)
    models.push(firstModel)

    function initializeModelItems(modelId: number) {
        for (let i = 0; i < models[modelId].settings.groups.length; i++) {
            let grp : GridGroup = { 
                id: models[modelId].settings.groups[i].id, 
                itemsToShow: models[modelId].settings.groups[i].itemsToShow ,
                items: [] 
            }
            let rngItems = new Set<number>()
            while (rngItems.size != grp.itemsToShow) {
                rngItems.add(Math.floor(Math.random()*totalItems.value)+1)
            }
            grp.items = Array.from(rngItems)
            models[modelId].grid.push(grp)
        }
    }

    function updateActiveModel(modelId: number) {
        console.log('Changing active model to ', modelId)
        let indx = models.findIndex(e => e.id === modelId)
        activeModel.value = models[indx]
    }

    function addModel(session: string, name?: string) : void {
        nModels.value++
        const mid = nModels.value
        const mname = 'Model ' + mid
        const settings = computed(() => defaultSettings())
        initModel({ modelId: mid, session: session })
        models.push({ 
            session: session, 
            id: mid, 
            name: mname, 
            settings: settings.value,
            grid: [],
        })
        initializeModelItems(models.length-1)
        console.log(models)
        activeModel.value = models[models.length-1]
        console.log(activeModel.value.id)
    }
    
    function deleteModel(session: string, model: Model) : void {
        let indx = models.findIndex(e => e.id === model.id && e.name === model.name)
        console.log(activeModel.value)
        if (models[indx].id === activeModel.value.id) {
            if (indx > 0)
                activeModel.value = models[indx-1]
            else
                activeModel.value = models[indx+1]
        }
        let m : Model = models.splice(indx, 1)[0]
        removeModel({ session: session, modelId: model.id })
        console.log('Removed Model:', m.id)
        console.log(m)
        console.log(activeModel.value.id)
    }
    
    // Load models from a saved file (assumed implementation)
    function initLoadModels(modelsToLoad: Model[]) {
        models.splice(0,models.length)
        nModels.value = 0
        modelsToLoad.forEach(m => {
            const mid = ref(nModels.value++)
            m.id = mid.value
            models.push(m)
        })
    }
    
    function loadModel(model: Model) {
        nModels.value++
        model.id = nModels.value
        models.push(model)
    }
    
    function resetModel(model: Model) {
        const idx : number = models.findIndex(e => e.id === model.id)
        models[idx].grid = []
        models[idx].activeFilters?.clear()
        models[idx].activeSearch = []
        initModel({ modelId: model.id, session: model.session })
        initializeModelItems(model.id)
    }
    
    function getModel (id: number) : Model {
        return models.filter(e => e.id === id)[0]
    }
    
    function getModelGrid(id: number) : GridGroup[] | undefined {
        return models[id].grid
    }
    
    function updateName(model: Model, newName: string) {
        let indx = models.findIndex(e => e.id === model.id && e.name === model.name)
        models[indx].name = newName
    }

    async function getSuggestions(req: ExqURFRequest, gridIdx: number, itemIdx?: number) {
        let suggs = await searchURF(req) // Call Exquisitor
        let model = models.filter(e => e.id === req.modelId)[0] // Get model
        if (req.n == model.grid[gridIdx].itemsToShow) { // Is it a full update?
            // Returned items NOT equal to the requested amount
            if (suggs.suggestions.length != req.n) {
                // Remove grid items
                model.grid[gridIdx].items.splice(0, model.grid[0].items.length) 
                // Add suggestions to grid
                for (let i = 0; i < suggs.suggestions.length; i++) {
                    model.grid[gridIdx].items.push(suggs.suggestions[i]);
                }
            }
            // Returned items equal to the requested amount
            if (suggs.suggestions.length == req.n) {
                // Replace grid items with suggestions
                for (let i = 0; i < req.n; i++) {
                    model.grid[gridIdx].items[i] = suggs.suggestions[i];
                }
            } 
        } else if (req.n == 1 && itemIdx !== undefined) {
            console.log('Replace item:', itemIdx!)
            console.log('Replace', model.grid[gridIdx].items[itemIdx], 'from index:', itemIdx)
            model.grid[gridIdx].items[itemIdx] = suggs.suggestions[0]
            console.log('Suggs:', suggs.suggestions)
            console.log('Suggs.suggestions[0]:', suggs.suggestions[0])
        }
    }

    return { 
        models, 
        activeModel,
        totalItems,
        initializeModelItems,
        updateActiveModel,
        addModel, 
        deleteModel, 
        initLoadModels, 
        loadModel, 
        resetModel,
        updateName, 
        getModel, 
        getModelGrid,
        getSuggestions,
    }    
})