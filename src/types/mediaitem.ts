// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
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
  itemsLoaded?: boolean, // false/undefined while related item IDs are being fetched
  metadata: Record<string, number | string | (number | string)[]>
}

export default interface MediaItem {
  id : number,
  name : string,
  itemId : number, // Id in its database
  mediaType : MediaType,
  thumbPath : string | null, // For Items in Grid and Overlays, null when the media has no thumbnail
  srcPath : string // Enlarged version for Summary View, if downloading and rendering is not a performance hit use this path in thumbPath
  groupId? : number, // groupId
  groupKey? : string, // value of the item store's groupKey tagset (Video ID by default), labels the group
  currentSets? : Map<number,boolean[]>, // K = modelId, V = boolean[Positives,Negatives,History,Submitted]
  metadata?: Record<string, number | string | (number | string)[]>
}