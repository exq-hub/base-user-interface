// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGP-3.0-or-later
import type { 
    ExqRFRequest as ExqRFRequest, 
    ExqRFResponse as ExqRFResponse,
    ExqGetItemResponse, 
    ExqInitResponse,
    ExqSubmissionRequest,
    ExqTextSearchRequest,
    ExqQueryRewriteRequest,
    ExqExcludeGroupRequest,
    ExqExcludeGroupResponse,
    ExqSessionInfo,
    ExqIsExcludedRequest,
    ExqImageSearchRequest,
    ExqTemporalSearchRequest,
} from "@/types/exq"
import type MediaItem from "@/types/mediaitem"
import {
    initSession as mockInitExq, 
    doURF as mockDoURF,
    getItem as mockGetItem,
    getFilters as mockGetFilters,
    getItemInfoMock,
} from "@/services/MockExquisitorAPI"
import type { ExqSearchResponse, ExqQueryRewriteResponse } from "@/types/chat"
import { useAppStore } from "@/stores/app"
import { FilterInfo, FilterValue } from "@/types/filter"

const exqURI = 'https://localhost:5000'
const mock = false


function generateString(length: number) : string {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export const getMainURI = () => { return exqURI } 
// Initialize Session
// TODO: Start Page options?
export const initSession = async () : Promise<ExqInitResponse> => {
    if (mock) return mockInitExq()
    const session = generateString(10)
    const resp : {session: string, totalItems: number[], collections: string[]} =
        await fetch(exqURI+'/exq/init/'+session)
              .then(val => val.json())
    const evals : {id: string, name: string}[] = 
        await fetch(exqURI+'/dres/evaluation_list/')
              .then(val => val.status !== 404 ? val.json() : [])
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

export const logEvents = (events: ClientEvent[]): void => {
    if (mock) return
    console.log("Logging events:", events)
    if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(events)], { type: "application/json" })
        navigator.sendBeacon(getMainURI() + '/exq/log/clientEvent', blob)
        return
    }
    fetch(getMainURI() + '/log/clientEvent', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
    }).then()
}


export const getItem = async (
    session: string,
    exqId: number,
    modelId: number,
    collection: string,
    opts?: { signal?: AbortSignal }
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
                mediaId: exqId,
            }),
            signal: opts?.signal
        })
        .then(val => val.json()) 
    return { 
        id: resp.id, 
        name: resp.name,
        itemId: resp.itemId, 
        currentSets: sets, 
        groupId: resp.groupId,
        mediaType: resp.mediaType, 
        thumbPath: resp.thumbPath, 
        srcPath: resp.srcPath
    }
}

export const getItemInfo = async (
    model: number, mediaId: number, collection: string, 
    filterIds: number[]
): Promise<Record<string, number | string | (number | string)[]>> => {
    if (mock) return getItemInfoMock(mediaId)
    const resp : Record<string, number | string | (number | string)[]> = 
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
                mediaId: mediaId,
                filterIds: filterIds,
            })
        }).then(val => val.json())
    return resp
}

export const getRelatedItems = async (model: number, mediaId: number, collection: string): Promise<number[]> => {
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
                mediaId: mediaId
            })
        }).then(val => val.json())
    return resp.related
}



export const getFiltersInfo = async (session: string, collection: string): Promise<FilterInfo[]> => {
//Promise<ExqGetFiltersInfoResponse> => {
    if (mock) return (await mockGetFilters()).filters
    return await fetch(exqURI+'/exq/info/filters/' + session + '/' + collection, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(val => val.json())
}


export const getFilterValues = async (session: string, collection: string, tagtypeId: number, filterId: number): 
    Promise<FilterValue[]> => { 
        return await fetch(exqURI + '/exq/info/filters/values/' + session + '/' + collection + '/' + tagtypeId + '/' + filterId, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(val => val.json())
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

// Get suggestions from the current model
export const searchRF = async (req: ExqRFRequest): Promise<ExqRFResponse> => {
    if (mock) return await mockDoURF(req)
    const resp : ExqRFResponse = await fetch(exqURI+'/exq/search/rf', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    return resp
}

export const searchText = async (req: ExqTextSearchRequest): Promise<ExqSearchResponse> => {
    if (mock) {
        if (req.text === 'test')
            return { suggestions: [33,15,20,22]} // VBS / LSC
        else 
            return { suggestions: [21,59,68,25,99]} // VBS / LSC
    }
    // Calling different server instead of the Exquisitor Server
    let search_uri = '/exq/search/clip'
    if (req.search_model == 'caption')
        search_uri = '/exq/search/caption'
    else if (req.search_model == 'aggregate')
        search_uri = '/exq/search/aggregate'

    delete req.search_model  // Remove before sending to server

    console.log("Search object", req)
    const resp: { suggestions: number[] } = await fetch(exqURI+search_uri, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    return resp
}

export const searchImage = async (req: ExqImageSearchRequest): Promise<ExqSearchResponse> => {
    delete req.search_model  // Remove before sending to server
    const resp: { suggestions: number[] } = await fetch(exqURI+'/exq/search/image', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    return resp
}

export const searchQueryRewrite = async (req: ExqQueryRewriteRequest): Promise<ExqQueryRewriteResponse> => {
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


export const searchTemporal = async (req: ExqTemporalSearchRequest): Promise<ExqSearchResponse> => {
    if (mock) return { suggestions: Array(100).fill(0).map((_, idx) => idx + 1) }
    const resp: { suggestions: number[] } = await fetch(exqURI+'/exq/search/temporal', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req)
    }).then(val => val.json())
    return resp
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