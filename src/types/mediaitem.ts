export enum ILSets {
  Positives=0,
  Negatives,
  History,
  Submitted,
  Excluded,
}

export enum MediaType {
  Image=1,
  Video,
  Audio,
  Text,
  Other
}

export interface GroupMetadata {
  src: string,
  groupMediaType: MediaType,
  items: number[],
  metadata: Record<string, number | string | (number | string)[]>
}

export default interface MediaItem {
  id : number,
  name : string,
  mediaId : number, // Id in its database
  mediaType : MediaType,
  thumbPath : string, // For Items in Grid and Overlays
  srcPath : string // Enlarged version for Summary View, if downloading and rendering is not a performance hit use this path in thumbPath
  groupId? : number, // groupId
  currentSets? : Map<number,boolean[]>, // K = modelId, V = boolean[Positives,Negatives,History,Submitted]
  metadata?: Record<string, number | string | (number | string)[]>
}