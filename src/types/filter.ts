export enum FilterType {
    Single=0,
    Multi,
    RangeNumber,
    RangeNumberMulti,
    RangeLabel,
    RangeLabelMulti,
    Count,
    CountMulti,
}

export enum FilterProperty {
    Color=0,
}

export interface Filter {
    // TODO: In case the filters change ids there needs to be a check when loading a saved model
    // TODO: In case a filter is not found display a warning dialog and ask if they wish to continue
    // Example: VBS 20 and VBS 22 have different categories and tags data
    id: number
    collectionId : string
    name: string
    values : number[] | string[]
    filterType : FilterType
    range?: [number, number] | [string, number][]
    count?: [number, number][]
    property?: FilterProperty
}