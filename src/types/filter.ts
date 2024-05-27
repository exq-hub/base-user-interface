export enum FilterType {
    Single=0,
    Multi,
    NumberRange,
    NumberMultiRange,
    LabelRange,
    LabelMultiRange,
    Count,
    MultiCount,
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
    values : string[] | number[]
    filter : FilterType
    range? : [number,number]
    rangeLabel? : [number,string][] // Only if LabelRange is used
    count? : [number,number][]
    property?: FilterProperty
}