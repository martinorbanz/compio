import { EventHive } from "event-hive";
import {
  CompositionLoadedEvent,
  LayerAddedEvent,
  LayerRemovedEvent,
  LayerTransformedEvent,
  SelectionChangedEvent,
} from "./events/composition-events";
import { RenderCompleteEvent, RenderRequestedEvent } from "./events/render-events";
import { PluginActivatedEvent, PluginRegisteredEvent } from "./events/plugin-events";

/**
 * One module-level EventHive singleton per domain, shared by every consumer
 * (renderer-core, plugin-registry, plugins-*, apps/compio) via plain
 * addListener/dispatchEvent — NOT via event-hive's React hooks. Those hooks
 * (useEventHiveContext) create a brand-new EventHive per Provider mount, so
 * two components using the hook would get two disconnected buses; the actual
 * cross-domain contract this app needs is one shared bus that both React and
 * non-React code can dispatch/listen on, so components subscribe in a
 * useEffect and call `.unsubscribe()` on cleanup instead.
 *
 * Note: event-hive's Emitter delivers events via a microtask
 * (`Promise.resolve().then(...)`), not synchronously — dispatchEvent always
 * returns before listeners run. Fine for the UI-notification use cases here;
 * don't rely on a dispatch being observed by the very next line of code.
 */

export const compositionEventHive = new EventHive({
  default: [
    LayerAddedEvent.type,
    LayerTransformedEvent.type,
    LayerRemovedEvent.type,
    SelectionChangedEvent.type,
    CompositionLoadedEvent.type,
  ],
});

export const renderEventHive = new EventHive({
  default: [RenderRequestedEvent.type, RenderCompleteEvent.type],
});

export const pluginEventHive = new EventHive({
  default: [PluginRegisteredEvent.type, PluginActivatedEvent.type],
});
