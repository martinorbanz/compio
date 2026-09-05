export * from "./events/composition-events";
export * from "./events/render-events";
export * from "./events/plugin-events";
export * from "./hives";
export { Event } from "event-hive";

/** event-hive doesn't re-export this from its package root; mirrored here to avoid a deep import. */
export interface EventSubscription {
  unsubscribe: () => void;
}
