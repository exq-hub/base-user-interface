// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { logEvents } from "./services/ExquisitorAPI"
import { useAppStore } from "./stores/app"

type GetRoute = () => string
const MIN_HOVER_MS = 500;


function pickElementId(target: EventTarget | null): string | undefined {
  const el = target instanceof Element ? target : null
  const tracked = el?.closest?.("[data-eid]") as HTMLElement | null
  if (tracked?.dataset.eid) return tracked.dataset.eid
  
  // fallback (less stable, but better than nothing)
  const id = (el as HTMLElement | null)?.id
  return id || undefined
}

function elementLabel(eid?: string) {
  return eid ? `<${eid}>` : "<unknown>"
}

function isTrackable(el: Element): boolean {
  return el.hasAttribute("data-eid");
}


function isTextOrPlayerInput(el: EventTarget | null): el is
| HTMLInputElement
| HTMLTextAreaElement
| HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  
  // Native text inputs
  if (el instanceof HTMLVideoElement) return true
  if (el instanceof HTMLTextAreaElement) return true
  
  if (el instanceof HTMLInputElement) {
    return [
      "text",
      "email",
      "password",
      "search",
      "tel",
      "url",
      "number",
    ].includes(el.type)
  }
  
  // Contenteditable (Vuetify, rich editors, etc.)
  if (el.isContentEditable) return true
  
  return false
}


export function createTracker(opts: {
  getRoute: GetRoute
  maxBatch?: number
  flushIntervalMs?: number
}) {
  const maxBatch = opts.maxBatch ?? 50
  const flushIntervalMs = opts.flushIntervalMs ?? 2000
  
  const appStore = useAppStore()
  
  let q: ClientEvent[] = []
  let flushing = false
  
  const enqueue = (ev: Omit<ClientEvent, "session" | "route">) => {
    const sessionId = appStore.session
    q.push({
      ...ev,
      session: sessionId,
      route: opts.getRoute(),
    })
    if (q.length >= maxBatch) flush()
    }
  
  const send = (payload: ClientEvent[]) => {
    logEvents(payload)
  }
  
  const flush = () => {
    if (flushing || q.length === 0) return
    flushing = true
    const batch = q.splice(0, maxBatch)
    try {
      send(batch)
    } finally {
      flushing = false
    }
  }
  
  // periodic flush + on tab close
  const timer = window.setInterval(flush, flushIntervalMs)
  window.addEventListener("pagehide", flush)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush()
    })
  
  // ---- Event listeners (capture phase) ----
  
  // Clicks
  document.addEventListener(
    "click",
    (e) => {
      const eid = pickElementId(e.target)
      if (!eid) return
      enqueue({
        ts: Date.now(),
        action: `Click ${elementLabel(eid)}`,
        element_id: eid,
      })
    },
    true
  )
  
  // Can throttle so holding a key doesn’t spam
  let lastKeyTs = 0
  document.addEventListener(
    "keydown",
    (e) => {
      const now = Date.now()
      if (now - lastKeyTs < 20) return
      lastKeyTs = now
      
      const isTypingField = isTextOrPlayerInput(e.target)
      if (!isTypingField) return
      
      const eid = pickElementId(e.target)
      enqueue({
        ts: now,
        action: `Keypress ${e.key} in ${elementLabel(eid)}`,
        element_id: eid,
        data: e.key,
      })
    },
    true
  )
  
  // Input commit (more meaningful than every key)
  document.addEventListener(
    "change",
    (e) => {
      const eid = pickElementId(e.target)
      enqueue({
        ts: Date.now(),
        action: `Change ${elementLabel(eid)}`,
        element_id: eid,
      })
    },
    true
  )
  
  // Scroll summary (debounced per element)
  const scrollState = new Map<EventTarget, { lastTop: number; lastTs: number; timer?: number }>()
  document.addEventListener(
    "scroll",
    (e) => {
      const target = e.target
      const el = target instanceof Element ? (target as HTMLElement) : null
      if (!el) return
      
      // ignore tiny scrolls on document unless you want them
      const top = (el as any).scrollTop ?? 0
      const now = Date.now()
      
      const st = (target && scrollState.get(target!)) ?? { lastTop: top, lastTs: now, timer: undefined }
      const delta = top - st.lastTop
      st.lastTop = top
      st.lastTs = now
      
      // debounce: log one "Scroll ..." after user pauses
      if (st.timer) window.clearTimeout(st.timer)
        st.timer = window.setTimeout(() => {
        const eid = pickElementId(el)
        const dir = delta > 0 ? "down" : delta < 0 ? "up" : "none"
        enqueue({
          ts: Date.now(),
          action: `Scroll ${dir} ${elementLabel(eid)}`,
          element_id: eid,
        })
      }, 250)
      
      scrollState.set(target!, st)
    },
    true
  )
  
  const hoverStart = new WeakMap<Element, number>(); // element -> enter timestamp
  
  document.addEventListener(
    "mouseover",
    (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (!isTrackable(el)) return;
      
      // Ignore internal movements within the same element
      const related = e.relatedTarget instanceof Element ? e.relatedTarget : null;
      if (related && el.contains(related)) return;
      
      // Only record if not already hovering
      if (!hoverStart.has(el)) {
        hoverStart.set(el, Date.now());
      }
    },
    true // capture = true (recommended for global listeners)
  );
  
  document.addEventListener(
    "mouseout",
    (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (!isTrackable(el)) return;
      
      const related = e.relatedTarget instanceof Element ? e.relatedTarget : null;
      if (related && el.contains(related)) return;
      
      const start = hoverStart.get(el);
      if (!start) return;
      
      const duration = Date.now() - start;
      hoverStart.delete(el);
      if (duration < MIN_HOVER_MS) return;
      
      const eid = pickElementId(el);
      enqueue({
        ts: Date.now(),
        action: `Hovered ${elementLabel(eid)}`,
        element_id: eid,
        data: duration.toString()
      });
    },
    true
  );
  
  const lastTimeupdateAt = new WeakMap<HTMLVideoElement, number>();
  const lastTimeupdateTime = new WeakMap<HTMLVideoElement, number>();
  const lastLoggedSeekTo = new WeakMap<HTMLVideoElement, number>();
  
  const EPS = 0.01;         // ~10ms
  const PROGRAMMATIC_MS = 120; // window where loop correction seeked usually lands
  
  document.addEventListener(
    "timeupdate",
    (e) => {
      const v = e.target;
      if (!(v instanceof HTMLVideoElement)) return;
      
      // only bother for tracked videos (optional but reduces noise)
      const eid = pickElementId(v);
      if (!eid) return;
      
      lastTimeupdateAt.set(v, performance.now());
      lastTimeupdateTime.set(v, v.currentTime);
    },
    true
  );
  
  document.addEventListener(
    "seeked",
    (e) => {
      const v = e.target;
      if (!(v instanceof HTMLVideoElement)) return;
      
      const eid = pickElementId(v);
      if (!eid) return;
      
      const to = v.currentTime;
      
      // dedupe/no-op
      const prevLogged = lastLoggedSeekTo.get(v);
      if (prevLogged !== undefined && Math.abs(prevLogged - to) < EPS) return;
      
      // ignore likely loop corrections when looping is on
      const looping = (v.dataset.looping === "1");
      if (looping) {
        const tAt = lastTimeupdateAt.get(v);
        const tTime = lastTimeupdateTime.get(v);
        if (tAt !== undefined && tTime !== undefined) {
          const dt = performance.now() - tAt;
          const jumpedBack = (tTime - to) > 0.25; // jumped back at least 250ms
          if (dt < PROGRAMMATIC_MS && jumpedBack) {
            // swallow programmatic clamp/jump-back
            lastLoggedSeekTo.set(v, to); // optional: prevents immediate duplicates
            return;
          }
        }
      }
      
      lastLoggedSeekTo.set(v, to);
      
      enqueue({
        ts: Date.now(),
        action: `Video seeked ${elementLabel(eid)}`,
        element_id: eid,
        data: to,
      });
    },
    true
  );
  
  const VIDEO_EVENTS = ["play", "pause", "volumechange"] as const;
  for (const type of VIDEO_EVENTS) {
    document.addEventListener(
      type,
      (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        
        // video events fire from the <video> element itself
        if (t.tagName !== "VIDEO") return;
        
        const eid = pickElementId(t);
        if (!eid) return;
        
        enqueue({
          ts: Date.now(),
          action: `Video ${type} ${elementLabel(eid)}`,
          element_id: eid,
          data: (e.target as HTMLVideoElement).currentTime
        });
      },
      true
    );
  }
  
  
  return {
    flush,
    stop() {
      window.clearInterval(timer)
      window.removeEventListener("pagehide", flush)
      // (Optionally remove listeners too if you keep refs)
    },
  }
}