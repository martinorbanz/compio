import type { Composition, Layer, Matrix2D } from "@compio/domain-composition";
import { Event } from "event-hive";

export interface LayerAddedPayload {
  layer: Layer;
}
export class LayerAddedEvent extends Event<LayerAddedPayload> {
  static readonly type = "composition/layer-added";
  constructor(payload: LayerAddedPayload) {
    super(LayerAddedEvent.type, payload);
  }
}

export interface LayerTransformedPayload {
  layerId: string;
  transform: Matrix2D;
}
export class LayerTransformedEvent extends Event<LayerTransformedPayload> {
  static readonly type = "composition/layer-transformed";
  constructor(payload: LayerTransformedPayload) {
    super(LayerTransformedEvent.type, payload);
  }
}

export interface LayerRemovedPayload {
  layerId: string;
}
export class LayerRemovedEvent extends Event<LayerRemovedPayload> {
  static readonly type = "composition/layer-removed";
  constructor(payload: LayerRemovedPayload) {
    super(LayerRemovedEvent.type, payload);
  }
}

export interface SelectionChangedPayload {
  layerIds: string[];
}
export class SelectionChangedEvent extends Event<SelectionChangedPayload> {
  static readonly type = "composition/selection-changed";
  constructor(payload: SelectionChangedPayload) {
    super(SelectionChangedEvent.type, payload);
  }
}

export interface CompositionLoadedPayload {
  composition: Composition;
}
export class CompositionLoadedEvent extends Event<CompositionLoadedPayload> {
  static readonly type = "composition/loaded";
  constructor(payload: CompositionLoadedPayload) {
    super(CompositionLoadedEvent.type, payload);
  }
}
