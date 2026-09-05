import { describe, expect, it } from "vitest";
import { LayerRemovedEvent } from "../events/composition-events";
import { compositionEventHive } from "../hives";

describe("compositionEventHive", () => {
  it("delivers dispatched events to listeners and unsubscribes cleanly", async () => {
    const received: string[] = [];
    const subscription = compositionEventHive.addListener<LayerRemovedEvent>(
      LayerRemovedEvent.type,
      (event) => received.push(event.payload!.layerId),
    );

    // event-hive's Emitter.next() schedules callbacks via a microtask (Promise.resolve().then(...)),
    // so delivery is always async — flush it before asserting.
    compositionEventHive.dispatchEvent(new LayerRemovedEvent({ layerId: "layer-1" }));
    await Promise.resolve();
    expect(received).toEqual(["layer-1"]);

    subscription.unsubscribe();
    compositionEventHive.dispatchEvent(new LayerRemovedEvent({ layerId: "layer-2" }));
    await Promise.resolve();
    expect(received).toEqual(["layer-1"]);
  });

  it("rejects event types outside the namespace constraint", () => {
    expect(() => compositionEventHive.addListener("not/a/real/event", () => undefined)).toThrow();
  });
});
