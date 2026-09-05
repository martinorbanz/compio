import type { MaskChannel, Matrix2D, Size2D } from "@compio/domain-composition";
import type { PluginManifest } from "./plugin-manifest";

/** Everything a plugin's execute() may read about the canvas but must not mutate directly. */
export interface PluginExecutionContext {
  canvasSize: Size2D;
  imageSize: Size2D;
  selection?: MaskChannel;
  /** The active layer's transform — `selection` is rasterized in canvas space, so sampling it against local-space pixels needs this. Defaults to identity when absent. */
  layerTransform?: Matrix2D;
}

export interface PluginExecuteOptions<TInput, TParams> {
  input: TInput;
  params: TParams;
  context: PluginExecutionContext;
}

/**
 * A plugin is a pure function (manifest + execute) — it never touches the DOM
 * or dispatches events itself. apps/compio's plugin runner is what wires a
 * plugin's declared UI trigger to actually calling execute() and applying the
 * result to the composition; this keeps plugins UI-framework agnostic.
 */
export interface Plugin<TInput = unknown, TParams = void, TOutput = unknown> {
  manifest: PluginManifest;
  execute: (options: PluginExecuteOptions<TInput, TParams>) => TOutput;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPlugin = Plugin<any, any, any>;
