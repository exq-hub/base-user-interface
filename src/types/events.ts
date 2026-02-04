type ClientEvent = {
    ts: number
    action: string              // e.g. "Scroll <OrdersList>", "Keypress in <Email>"
    element_id?: string         // stable id you define or derive
    data?: string | number | boolean
    route?: string
    session: string
}
