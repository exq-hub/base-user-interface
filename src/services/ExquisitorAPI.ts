import type { 
    ExqURFRequest, 
    ExqSearchResponse,
    ExqGetItemResponse, 
    ExqInitResponse,
    ExqRemoveModelRequest,
    ExqInitModelRequest,
    ExqGetFiltersResponse,
    ExqApplyFiltersRequest,
    ExqResetFilterRequest,
    ExqSubmissionRequest,
    ExqSearchRequest,
    ExqQueryRewriteRequest,
    ExqClearExcludedGroupRequest,
    ExqExcludeGroupRequest,
    ExqGetExcludedGroupsRequest,
    ExqGetExcludedGroupsResponse,
    ExqExcludeGroupResponse
} from "@/types/exq"
import type MediaItem from "@/types/mediaitem"
import { type ItemInfo, type RelatedItems } from "@/types/mediaitem"
import {
    initSession as mockInitExq, 
    doURF as mockDoURF,
    getItem as mockGetItem,
    getFilters as mockGetFilters,
} from "@/services/MockExquisitorAPI"
import type { ChatEntryQueryText, ChatEntryQueryPos } from "@/types/chat"
import { useAppStore } from "@/stores/app"

const exqURI = 'http://localhost:5001'
// const exqURI = 'http://bjth.itu.dk:5001'
const mock = true 

function generateString(length: number) : string {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

// Initialize Session
// TODO: Start Page options?
export const initSession = async () : Promise<ExqInitResponse> => {
    if (mock) return mockInitExq()
    const session = generateString(10)
    const resp : ExqInitResponse = await fetch(exqURI+'/exq/init/'+session).then(val => val.json())
    return resp
}

// Initialize model for user
export const initModel = (req: ExqInitModelRequest): void => {
    console.log(req)
    if (mock) return
    fetch(exqURI+'/exq/log/addModel', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    })
}

export const removeModel = (req: ExqRemoveModelRequest) : void => {
    if (mock) return
    fetch(exqURI+'/exq/log/removeModel', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    })
}

// Get information for collections 
export const getCollections = async (): Promise<string[]> =>
    await fetch('CALL_TO_API_HERE').then((val) => val.json())



export const getItem = async (session: string, exqId: number, modelId: number): Promise<MediaItem> => {
    if (mock) return await mockGetItem(exqId, modelId)
    const sets = new Map<number,boolean[]>()
    sets.set(modelId, [false,false,false,false])
    const resp : ExqGetItemResponse = 
        await fetch(exqURI+'/exq/item/base', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session: session, modelId: modelId, itemId: exqId })
        })
        .then(val => val.json())
    return { 
        id: resp.id, 
        name: resp.name,
        mediaId: resp.mediaId, 
        currentSets: sets, 
        mediaType: resp.mediaType, 
        thumbPath: resp.thumbPath, 
        srcPath: resp.srcPath
    }
}

export const getItemInfo = async (model: number, itemId: number): Promise<ItemInfo> => {
    if (mock) return { infoPair: [['ID',[itemId.toString()]]] }
    const resp : ItemInfo = 
        await fetch(exqURI+'/getItemInfo', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                session: useAppStore().session,
                model: model,
                itemId: itemId
            })
        }).then(val => val.json())
    return resp
}

export const getRelatedItems = async (itemId: number): Promise<RelatedItems> => {
    if (mock) {
        return {
            nGroup: 10,
            groupRange: [10,20],
            groupItems: []
        }
    }
    const resp: RelatedItems =
        await fetch(exqURI+'/getRelatedItems', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId: itemId })
        }).then(val => val.json())
    return resp
}



export const getFilters = async (session: string): Promise<ExqGetFiltersResponse> => {
    if (mock) return await mockGetFilters()
    return await fetch(exqURI+'/exq/filters/'+session, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(val => val.json())
}

export const applyFilters = (req: ExqApplyFiltersRequest): void => {
    if (mock) return
    fetch(exqURI+'/exq/log/applyFilters', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}

export const resetFilters = (req: ExqResetFilterRequest): void => {
    if (mock) return
    fetch(exqURI+'/exq/log/resetFilters', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}



export const excludeGroup = async (req: ExqExcludeGroupRequest): Promise<void> => {
    if (mock) return
    return await fetch(exqURI+'/excludeVideo', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}

export const isGroupExcluded = async (req: ExqExcludeGroupRequest): Promise<boolean> => {
    if (mock) return false
    const resp: ExqExcludeGroupResponse = await fetch(exqURI+'/isVideoExcluded', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    return resp.excludedOrNot
}

// Remove one or more groups from the excluded list
export const clearExcludedGroups = async (req: ExqClearExcludedGroupRequest): Promise<void> => {
    if (mock) return
    return await fetch(exqURI+'/clearExcludedVideos', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}

export const getExcludedGroups = async (req: ExqGetExcludedGroupsRequest): Promise<ExqGetExcludedGroupsResponse> => {
    if (mock) return {excGroups: []}
    return await fetch(exqURI+'/getExcludedVideos', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
}



// Get suggestions from the current model
export const doURF = async (req: ExqURFRequest): Promise<ExqSearchResponse> => {
    if (mock) return await mockDoURF(req)
    const resp : ExqSearchResponse = await fetch(exqURI+'/exq/search/urf', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    return resp
}

export const searchVLM = async (req: ExqSearchRequest): Promise<ChatEntryQueryText> => {
    // if (mock) return { userQuery: req.query, vlmResults: [30,99,102,101]} // LSC
    if (mock) return { userQuery: req.query, vlmResults: [33,15,20,22]} // VBS
    // return { userQuery: req.query, vlmResults: [10,20,14,50]} // Test
    // Calling different server instead of the Exquisitor Server
    const amReq = { query: req.query, amount: 30 }
    const resp: { results: number[] } = await fetch('http://mandla-1:5001/searchVLM', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(amReq)
    }).then(val => val.json())
    console.log(resp)
    // Logging on Exqusitor server
    fetch(exqURI+'/searchVLM', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({userQuery: req.query, results: resp.results})
    }).then(val => val.json())
    return {userQuery: req.query, vlmResults: resp.results}
}

export const searchQueryRewrite = async (req: ExqQueryRewriteRequest): Promise<ChatEntryQueryPos> => {
    if (mock) return { userQuery: req.query, positive: req.positive, rewriteSuggestion: 'textual response' }
    const resp: string = await fetch('http://mandla-1:5001/rewriteQuery', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    // Logging on Exqusitor server
    fetch(exqURI+'/rewriteQueryLog', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({query: req.query, positive: req.positive, caption: resp})
    }).then(val => val.json())

    return {userQuery: req.query, positive: req.positive, rewriteSuggestion: resp}
}



export const submitAnswer = async (req: ExqSubmissionRequest): Promise<void> => {
    if (mock) return
    return await fetch(exqURI+'/dres/submit', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}