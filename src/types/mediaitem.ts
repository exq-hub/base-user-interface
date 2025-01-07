export enum ILSets {
    Positives=0,
    Negatives,
    History,
    Submitted,
}

export enum MediaType {
    Image=0,
    Video,
    Audio
}

export interface ItemInfo {
    // infoPairs: [string, string[]][]
    infoPairs: Record<string,any>
}

export interface VideoSegment {
    segmentId: string
    start: number
    end: number
}

export default interface MediaItem {
    id : number,
    mediaId? : number, // Id in its collection, if only one collection then id === mediaId
    relatedGroupId? : string, // videoId | dayId | hourId
    name? : string,
    currentSets? : Map<number,boolean[]>, // K = modelId, V = boolean[Positives,Negatives,History,Submitted]
    mediaType : MediaType,
    thumbPath : string, // For Items in Grid and Overlays
    srcPath : string // Enlarged version for Summary View, if downloading and rendering is not a performance hit use this path in thumbPath
    metadata?: ItemInfo
    segmentInfo?: VideoSegment
    relatedItems?: number[]
}