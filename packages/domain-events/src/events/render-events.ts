import type { Composition } from "@compio/domain-composition";
import { Event } from "event-hive";

export interface RenderRequestedPayload {
  composition: Composition;
}
/** Dispatched after rAF-coalescing — see renderer-core's `scheduleRender`. */
export class RenderRequestedEvent extends Event<RenderRequestedPayload> {
  static readonly type = "render/requested";
  constructor(payload: RenderRequestedPayload) {
    super(RenderRequestedEvent.type, payload);
  }
}

export interface RenderCompletePayload {
  durationMs: number;
}
export class RenderCompleteEvent extends Event<RenderCompletePayload> {
  static readonly type = "render/complete";
  constructor(payload: RenderCompletePayload) {
    super(RenderCompleteEvent.type, payload);
  }
}
