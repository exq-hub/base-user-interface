import type { 
    ExqRFRequest, 
    ExqInitResponse, 
    ExqInitModelResponse,
    ExqApplyFiltersRequest,
    ExqRFResponse,
    ExqSessionInfo,
    ExqGetFiltersInfoResponse
} from "@/types/exq"
import { FilterInfo } from "@/types/filter"
import type MediaItem from "@/types/mediaitem"
import { Info, MediaType } from "@/types/mediaitem"
import type { GridGroup } from "@/types/model"

const mockItems : number[] = [...Array(200).keys()]

function getTestImagePaths() : string[] {
    var imgs : string[] = []
    for (var i = 0; i < 200; i++) {
        const imgName = i.toString().padStart(5, '0')
        imgs.push('/test-images-lsc/'+imgName+'.jpg')
    }
    return imgs
}
const imgPaths : string[] = getTestImagePaths()

// Initialize Exquisitor
export const initSession = (): ExqInitResponse => { 
    const evaluations: {id: string, name: string}[] = [
        {
            id: "1247184-fae-14o41",
            name: "mock evaluation 1"
        },
        {
            id: "1iahfewo-182319io-8492",
            name: "mock evaluation 2"
        }]
    return { session: 'testSession', collections: ["Test Collection 1", "Test Collection 2"], evaluations: evaluations}
} 

export const initModel = (req: ExqSessionInfo): ExqInitModelResponse => {
    var groups: GridGroup[] = []
    // for (var i = 0; i < req.groups.length; i++) {
    //     groups.push({
    //         id: req.groups[i].id,
    //         itemsToShow: req.groups[i].itemsToShow,
    //         items: mockItems.sort(() => .5 - Math.random()).slice(0, req.groups[i].itemsToShow),
    //         name: req.groups[i].name
    //     })
    // }
    return { groups: groups }
}

export const removeModel = (req: ExqSessionInfo) : void => {}

// Get information for collections 
// export const getCollections = async (): Promise<string[]> =>
//     await fetch('CALL_TO_API_HERE').then((val) => val.json())

// Get suggestions from the current model
export const doURF = async (req: ExqRFRequest): Promise<ExqRFResponse> => {
    const resp : number[] = []
    for (var i = 0; i < 100; i++) {
        let next = false
        for (var j = 0; j < req.seen.length; j++) {
            if (i == req.seen[j]) {
                console.log(i, 'found in seen')
                next = true
                break
            }
        }
        if (next) { continue }
        resp.push(mockItems[i])
        if (resp.length == req.n)
            return {suggestions: resp}
    }
    return { suggestions : resp }
}

export const getItem = async (exqId: number, modelId: number): Promise<MediaItem> => {
    const ilsets = new Map<number,boolean[]>()
    ilsets.set(modelId, [false,false,false,false])
    return {
        id: exqId, 
        name: 'name-' + exqId,
        mediaId: exqId, 
        currentSets: ilsets, 
        relatedGroupId: '0',
        mediaType: MediaType.Image, 
        thumbPath: imgPaths[exqId], 
        srcPath: imgPaths[exqId],
    }
}

export const getItemInfoMock = async (itemId: number): Promise<Record<string, Info>> => {
    var info: Record<string, Info> = {}
    info['Start (ms)'] = {
        values: 15000,
        isMain: false,
        isGroup: false
    }
    info['End (ms)'] = {
        values: 30000,
        isMain: false,
        isGroup: false
    }
    info['Group ID'] = {
        values: 12,
        isMain: true,
        isGroup: true
    }
    return info
} 


const mockFilters : FilterInfo[] = [
//     {
//         id: 0,
//         collectionId: 'mock',
//         name: 'Day',
//         values: [
//             'Monday',
//             'Tuesday',
//             'Wednesday',
//             'Thursday',
//             'Friday',
//             'Saturday',
//             'Sunday'
//         ],
//         filterType: FilterType.Single,
//     },
//     {
//         id: 1,
//         collectionId: 'mock',
//         name: 'Dominant Color',
//         values: [
//             'Red',
//             'Yellow',
//             'Blue',
//             'Green',
//             'Purple',
//             'Pink',
//             'Orange',
//             'Brown',
//             'Black',
//             'White'
//         ],
//         filterType: FilterType.Single,
//     },
//     {
//         id: 2,
//         collectionId: 'mock',
//         name: 'Month',
//         values: [
//             'January',
//             'February',
//             'March',
//             'April',
//             'May',
//             'June',
//             'July',
//             'August',
//             'September',
//             'October',
//             'November',
//             'December',
//         ],
//         filterType: FilterType.Multi,
//     },
//     {
//         id: 3,
//         collectionId: 'mock',
//         name: 'Hour',
//         values: [0,23],
//         filterType: FilterType.RangeNumber,
//         range: [0,23]
//     },
//     {
//         id: 4,
//         collectionId: 'mock',
//         name: 'Hour',
//         values: [0,23],
//         filterType: FilterType.RangeNumberMulti,
//         range: [0,23]
//     },
//     {
//         id: 5,
//         collectionId: 'mock',
//         name: 'Objects',
//         values: [
//             'apple',
//             'helmet',
//             'car',
//             'skateboard',
//             'ski',
//         ],
//         filterType: FilterType.Count,
//         count: [[0,4],[1,3],[2,6],[3,5],[2,4]]
//     },
//     {
//         id: 6,
//         collectionId: 'mock',
//         name: 'Objects (Multi)',
//         values: [
//             'apple',
//             'helmet',
//             'car',
//             'skateboard',
//             'ski',
//         ],
//         filterType: FilterType.CountMulti,
//         count: [[0,4],[1,3],[2,6],[3,5],[2,4]]
//     }
]

export const getFilters = async (): Promise<ExqGetFiltersInfoResponse> => {
    return { filters: mockFilters }
}

export const applyFilters = async (req: ExqApplyFiltersRequest): Promise<void> => {
    return;
}