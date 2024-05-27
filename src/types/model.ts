export interface GridGroup {
    id : number,
    itemsToShow: number,
    items: number[],
    name? : string,
}

export interface GridGroupInfo {
    id: number,
    itemsToShow: number,
    name?: string
}

export enum ResourceValues {
    Low=0,
    Medium,
    High
}

export interface Settings {
    groups: GridGroupInfo[]
    resources: ResourceValues
}

export default interface Model {
    session: string,
    id : number,
    name : string,
    settings : Settings, //Settings type, number of suggestions, modalities, etc.
    grid : GridGroup[],
    activeFilters? : Map<number,number[][]>
    activeSearch? : string[], //TODO: Consider using a Search type with keyword and search form
}

