import type { PluginManifest } from "@compio/domain-plugin-api";
import { Event } from "event-hive";

export interface PluginRegisteredPayload {
  manifest: PluginManifest;
}
export class PluginRegisteredEvent extends Event<PluginRegisteredPayload> {
  static readonly type = "plugins/registered";
  constructor(payload: PluginRegisteredPayload) {
    super(PluginRegisteredEvent.type, payload);
  }
}

export interface PluginActivatedPayload {
  pluginName: string;
}
/** A tool became the active tool (only meaningful for category === TOOLS). */
export class PluginActivatedEvent extends Event<PluginActivatedPayload> {
  static readonly type = "plugins/activated";
  constructor(payload: PluginActivatedPayload) {
    super(PluginActivatedEvent.type, payload);
  }
}
