import type { 
    ExqURFRequest, 
    ExqURFResponse,
    ExqGetItemResponse, 
    ExqInitResponse,
    ExqGetFiltersResponse,
    ExqApplyFiltersRequest,
    ExqSubmissionRequest,
    ExqTextSearchRequest,
    ExqQueryRewriteRequest,
    ExqClearExcludedGroupRequest,
    ExqExcludeGroupRequest,
    ExqExcludeGroupResponse,
    ExqSessionInfo,
    ExqIsExcludedRequest,
    ExqClearItemSetRequest,
} from "@/types/exq"
import type MediaItem from "@/types/mediaitem"
import { MediaType, type ItemInfo } from "@/types/mediaitem"
import {
    initSession as mockInitExq, 
    doURF as mockDoURF,
    getItem as mockGetItem,
    getFilters as mockGetFilters,
    getItemInfoMock,
} from "@/services/MockExquisitorAPI"
import type { ChatEntryQueryText, ChatEntryQueryPos } from "@/types/chat"
import { useAppStore } from "@/stores/app"

const exqURI = 'http://localhost:8000'
const mock = false

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
    const resp : {session: string, totalItems: number[], collections: string[]} = await fetch(exqURI+'/exq/init/'+session).then(val => val.json())
    const evals : {id: string, name: string}[] = await fetch(exqURI+'/dres/evaluation_list/').then(val => val.json())
    const response = {
        session: resp.session,
        collections: resp.collections,
        evaluations: evals
    }
    return response
}

// Initialize model for user
export const initModel = (req: ExqSessionInfo): void => {
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

export const removeModel = (req: ExqSessionInfo) : void => {
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



export const getItem = async (
    session: string,
    exqId: number,
    modelId: number,
    collection: string
): Promise<MediaItem> => {
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
            body: JSON.stringify({ 
                session_info: {
                    session: session,
                    modelId: modelId,
                    collection: collection
                },
                itemId: exqId
            })
        })
        .then(val => val.json())
    if (resp.mediaType === MediaType.Video) {
        return { 
            id: resp.id, 
            name: resp.name,
            mediaId: resp.mediaId, 
            currentSets: sets, 
            relatedGroupId: resp.relatedGroupId,
            mediaType: resp.mediaType, 
            thumbPath: resp.thumbPath, 
            srcPath: resp.srcPath,
            segmentInfo: resp.segmentInfo
        }
    }
    return { 
        id: resp.id, 
        name: resp.name,
        mediaId: resp.mediaId, 
        currentSets: sets, 
        relatedGroupId: resp.relatedGroupId,
        mediaType: resp.mediaType, 
        thumbPath: resp.thumbPath, 
        srcPath: resp.srcPath
    }
}

export const getItemInfo = async (model: number, itemId: number, collection: string): Promise<ItemInfo> => {
    if (mock) return getItemInfoMock(itemId)
    const resp : ItemInfo = 
        await fetch(exqURI+'/exq/item/details', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                session_info: {
                    session: useAppStore().session,
                    modelId: model,
                    collection: collection
                },
                itemId: itemId
            })
        }).then(val => val.json())
    return resp
}

export const getRelatedItems = async (model: number, itemId: number, collection: string): Promise<number[]> => {
    if (mock) return [10, 20, 30, 40, 50]
    const resp: { related: number[] } =
        await fetch(exqURI+'/exq/item/related', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                session_info: {
                    session: useAppStore().session,
                    modelId: model,
                    collection: collection
                },
                itemId: itemId
            })
        }).then(val => val.json())
    return resp.related
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

export const resetFilters = (req: ExqSessionInfo): void => {
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
    return await fetch(exqURI+'/exq/log/exclude', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}

export const isGroupExcluded = async (req: ExqIsExcludedRequest): Promise<boolean> => {
    if (mock) return false
    const resp: ExqExcludeGroupResponse = await fetch(exqURI+'/exq/item/excluded', {
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
    return await fetch(exqURI+'/log/clearExcludedGroups', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}


// Get suggestions from the current model
export const searchURF = async (req: ExqURFRequest): Promise<ExqURFResponse> => {
    if (mock) return await mockDoURF(req)
    const resp : ExqURFResponse = await fetch(exqURI+'/exq/search/urf', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    return resp
}

export const searchVLM = async (req: ExqTextSearchRequest): Promise<ChatEntryQueryText> => {
    if (mock) {
        if (req.text === 'test')
            return { userQuery: req.text, vlmResults: [33,15,20,22]} // VBS / LSC
        else 
            return { userQuery: req.text, vlmResults: [21,59,68,25,99]} // VBS / LSC
    }
    // return { userQuery: req.query, vlmResults: [10,20,14,50]} // Test
    // Calling different server instead of the Exquisitor Server
    const resp: { suggestions: number[] } = await fetch(exqURI+'/exq/search/text', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    console.log(resp)
   return {userQuery: req.text, vlmResults: resp.suggestions}
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
    console.log("EvalId:", req.evalId);
    if (mock) return 
    await fetch(exqURI+'/dres/submit', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json)
}


export const clearItemSet = async (req: ExqClearItemSetRequest): Promise<void> => {
    if (mock) return
    return await fetch(exqURI+'/log/clearItemSet', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}

export const clearURFModel = async (req: ExqSessionInfo): Promise<void> => {
    if (mock) return
    return await fetch(exqURI+'/log/clearURFModel', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}

export const clearConversation = async (req: ExqSessionInfo): Promise<void> => {
    if (mock) return
    return await fetch(exqURI+'/log/clearConversation', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then()
}