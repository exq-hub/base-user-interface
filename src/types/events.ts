// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
type ClientEvent = {
  ts: number
  action: string              // e.g. "Scroll <OrdersList>", "Keypress in <Email>"
  element_id?: string         // stable id you define or derive
  data?: string | number | boolean
  route?: string
  session: string
}
