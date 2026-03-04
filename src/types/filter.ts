export interface FilterInfo {
  id: number,
  name: string,
  tagtypeId: number,
  tagtype: string,
  values: FilterValue[]
}

export type FilterValue = {id: number, value: string}

export type AppliedFilters = Record<number, FilterValue[]>

// Types
export type LogicalOp = "AND" | "OR";

export type FilterGroupKind = "group";
export type FilterLeafKind = "leaf";

export interface DBValueConstraint {
  value_ids: number[];
  operator?: LogicalOp; // defaults to "OR" in builder
}

export interface DBRangeConstraint {
  lower_bound?: number | string;
  upper_bound?: number | string;
}

export type DBConstraint = DBValueConstraint | DBRangeConstraint;

export interface DBFilter {
  id: number;           // tagset ID
  tagtype_id: number;
  constraint: DBConstraint;
}

export interface FilterLeaf {
  kind: FilterLeafKind;
  filter: DBFilter;
  not_?: boolean;
}

export interface FilterGroup {
  kind: FilterGroupKind;
  operator: LogicalOp;
  children: FilterExpr[];
  not_?: boolean;
}

export type FilterExpr = FilterLeaf | FilterGroup;

export interface ActiveFiltersDB {
  root: FilterExpr;
}

