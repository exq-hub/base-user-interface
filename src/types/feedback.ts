// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { ActiveFiltersDB } from "./filter"

export interface RFSession {
  positives: number[]
  negatives: number[]
  filters: ActiveFiltersDB | undefined
  resultIds: number[]
}