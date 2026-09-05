import * as RadixPopover from "@radix-ui/react-popover";
import { useMemo, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { clampUnit, hsvToRgb, rgbToHsv, type HsvColor } from "./color-conversion";

export interface ColorPickerValue {
  /** 0..255 */
  r: number;
  /** 0..255 */
  g: number;
  /** 0..255 */
  b: number;
  /** 0..1 */
  a: number;
}

export interface ColorPickerProps {
  label: string;
  value: ColorPickerValue;
  onChange: (value: ColorPickerValue) => void;
}

const SWATCH_SIZE_PX = 24;
const SV_SQUARE_SIZE_PX = 160;
const STRIP_LENGTH_PX = SV_SQUARE_SIZE_PX;
const STRIP_THICKNESS_PX = 12;
const HUE_MAX_DEGREES = 360;
const PERCENT_MAX = 100;
const OPAQUE_ALPHA = 1;

const CHECKERBOARD_STYLE = {
  backgroundImage:
    "conic-gradient(#e5e7eb 90deg, #f9fafb 90deg 180deg, #e5e7eb 180deg 270deg, #f9fafb 270deg)",
  backgroundSize: "8px 8px",
};

const rgbaToCss = ({ r, g, b, a }: ColorPickerValue): string => `rgba(${r}, ${g}, ${b}, ${a})`;

interface FractionFromPointOptions {
  event: { clientX: number; clientY: number };
  element: Element;
}

const getFractionX = ({ event, element }: FractionFromPointOptions): number => {
  const rect = element.getBoundingClientRect();
  return clampUnit((event.clientX - rect.left) / rect.width);
};

const getFractionY = ({ event, element }: FractionFromPointOptions): number => {
  const rect = element.getBoundingClientRect();
  return clampUnit((event.clientY - rect.top) / rect.height);
};

interface DraggableStripOptions {
  elementRef: { current: HTMLDivElement | null };
  onDrag: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

/** Shared pointer-capture wiring for the square and both strips — drag continues past the element's own bounds. */
const useDraggableStrip = ({ elementRef, onDrag }: DraggableStripOptions) => {
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onDrag(event);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.buttons === 0) return;
    onDrag(event);
  };

  return { handlePointerDown, handlePointerMove, ref: elementRef };
};

interface SaturationValueSquareProps {
  hsv: HsvColor;
  onChange: (next: { saturation: number; value: number }) => void;
}

const SaturationValueSquare = ({ hsv, onChange }: SaturationValueSquareProps): ReactNode => {
  const squareRef = useRef<HTMLDivElement>(null);

  const updateFromEvent = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const element = squareRef.current;
    if (!element) return;
    onChange({
      saturation: getFractionX({ event, element }),
      value: OPAQUE_ALPHA - getFractionY({ event, element }),
    });
  };

  const { handlePointerDown, handlePointerMove } = useDraggableStrip({
    elementRef: squareRef,
    onDrag: updateFromEvent,
  });

  const thumbColor = useMemo(() => hsvToRgb(hsv), [hsv]);

  return (
    <div
      ref={squareRef}
      role="slider"
      aria-label="Saturation and value"
      aria-valuenow={Math.round(hsv.value * PERCENT_MAX)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative cursor-crosshair rounded"
      style={{
        width: SV_SQUARE_SIZE_PX,
        height: SV_SQUARE_SIZE_PX,
        backgroundColor: `hsl(${hsv.hue}, 100%, 50%)`,
        backgroundImage:
          "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
      }}
    >
      <div
        className="absolute h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{
          left: `${hsv.saturation * PERCENT_MAX}%`,
          bottom: `${hsv.value * PERCENT_MAX}%`,
          backgroundColor: `rgb(${thumbColor.red}, ${thumbColor.green}, ${thumbColor.blue})`,
        }}
      />
    </div>
  );
};

interface HueStripProps {
  hue: number;
  onChange: (hue: number) => void;
}

const HueStrip = ({ hue, onChange }: HueStripProps): ReactNode => {
  const stripRef = useRef<HTMLDivElement>(null);

  const updateFromEvent = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const element = stripRef.current;
    if (!element) return;
    onChange(getFractionX({ event, element }) * HUE_MAX_DEGREES);
  };

  const { handlePointerDown, handlePointerMove } = useDraggableStrip({
    elementRef: stripRef,
    onDrag: updateFromEvent,
  });

  return (
    <div
      ref={stripRef}
      role="slider"
      aria-label="Hue"
      aria-valuenow={Math.round(hue)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative cursor-pointer rounded"
      style={{
        width: STRIP_LENGTH_PX,
        height: STRIP_THICKNESS_PX,
        backgroundImage: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
      }}
    >
      <div
        className="absolute top-0 h-full w-1 -translate-x-1/2 border border-white shadow"
        style={{ left: `${(hue / HUE_MAX_DEGREES) * PERCENT_MAX}%` }}
      />
    </div>
  );
};

interface AlphaStripProps {
  color: ColorPickerValue;
  onChange: (alpha: number) => void;
}

const AlphaStrip = ({ color, onChange }: AlphaStripProps): ReactNode => {
  const stripRef = useRef<HTMLDivElement>(null);

  const updateFromEvent = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const element = stripRef.current;
    if (!element) return;
    onChange(getFractionX({ event, element }));
  };

  const { handlePointerDown, handlePointerMove } = useDraggableStrip({
    elementRef: stripRef,
    onDrag: updateFromEvent,
  });

  const opaqueColor = rgbaToCss({ ...color, a: OPAQUE_ALPHA });
  const transparentColor = rgbaToCss({ ...color, a: 0 });

  return (
    <div
      ref={stripRef}
      role="slider"
      aria-label="Alpha"
      aria-valuenow={Math.round(color.a * PERCENT_MAX)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative cursor-pointer rounded"
      style={{ width: STRIP_LENGTH_PX, height: STRIP_THICKNESS_PX, ...CHECKERBOARD_STYLE }}
    >
      <div
        className="absolute inset-0 rounded"
        style={{
          backgroundImage: `linear-gradient(to right, ${transparentColor}, ${opaqueColor})`,
        }}
      />
      <div
        className="absolute top-0 h-full w-1 -translate-x-1/2 border border-white shadow"
        style={{ left: `${color.a * PERCENT_MAX}%` }}
      />
    </div>
  );
};

export const ColorPicker = ({ label, value, onChange }: ColorPickerProps): ReactNode => {
  const hsv = useMemo(
    () => rgbToHsv({ red: value.r, green: value.g, blue: value.b }),
    [value.r, value.g, value.b],
  );

  const applyHsv = (nextHsv: HsvColor): void => {
    const rgb = hsvToRgb(nextHsv);
    onChange({ r: rgb.red, g: rgb.green, b: rgb.blue, a: value.a });
  };

  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="rounded border border-gray-300 dark:border-gray-600 shadow-sm"
          style={{ width: SWATCH_SIZE_PX, height: SWATCH_SIZE_PX, ...CHECKERBOARD_STYLE }}
        >
          <span
            className="block h-full w-full rounded"
            style={{ backgroundColor: rgbaToCss(value) }}
          />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={6}
          className="flex flex-col gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-lg"
        >
          <SaturationValueSquare
            hsv={hsv}
            onChange={({ saturation, value: nextValue }) =>
              applyHsv({ ...hsv, saturation, value: nextValue })
            }
          />
          <HueStrip hue={hsv.hue} onChange={(hue) => applyHsv({ ...hsv, hue })} />
          <AlphaStrip color={value} onChange={(alpha) => onChange({ ...value, a: alpha })} />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
};
