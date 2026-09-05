import { createEmptyComposition, createEmptyRaster } from "@compio/domain-composition";
import { MenuName, PluginCategory, PluginTriggerType } from "@compio/domain-plugin-api";
import { PluginRegisteredEvent, pluginEventHive } from "@compio/domain-events";
import {
  exportCompositionAsJson,
  exportCompositionAsPng,
  importCompositionFromJsonFile,
} from "@compio/export-core";
import { getPluginsByCategory } from "@compio/plugin-registry";
import { MenuBar, type MenuBarMenu } from "@compio/ui-kit";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { DEFAULT_CANVAS_SIZE } from "../../../../app/constants";
import { DEFAULT_ZOOM, type EditorState, type ViewportZoomState } from "../../../../app/hooks";

export interface AppMenuBarProps {
  editor: EditorState;
  viewportZoom: ViewportZoomState;
  onOpenEffectDialog: (pluginName: string) => void;
  onFitToWindow: () => void;
}

export const AppMenuBar = ({
  editor,
  viewportZoom,
  onOpenEffectDialog,
  onFitToWindow,
}: AppMenuBarProps): ReactElement => {
  const [, forceRefresh] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const subscription = pluginEventHive.addListener<PluginRegisteredEvent>(
      PluginRegisteredEvent.type,
      () => forceRefresh((previousCount) => previousCount + 1),
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleImageFile = (file: File): void => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(image, 0, 0);
      const raster = context.getImageData(0, 0, image.width, image.height);
      editor.addRasterLayer(
        { width: raster.width, height: raster.height, data: raster.data },
        file.name,
      );
    };
    image.src = URL.createObjectURL(file);
  };

  const imageEffectPlugins = getPluginsByCategory(PluginCategory.EFFECTS).filter((plugin) =>
    plugin.manifest.uiComponents.some(
      (component) =>
        component.trigger.type === PluginTriggerType.MENU &&
        component.trigger.menu === MenuName.IMAGE_SETTINGS,
    ),
  );

  const menus: MenuBarMenu[] = [
    {
      id: MenuName.FILE,
      label: "File",
      items: [
        {
          id: "new",
          label: "New Canvas",
          onSelect: () => editor.loadComposition(createEmptyComposition(DEFAULT_CANVAS_SIZE)),
        },
        { id: "open-image", label: "Open Image…", onSelect: () => imageInputRef.current?.click() },
        {
          id: "open-composition",
          label: "Open Composition…",
          onSelect: () => jsonInputRef.current?.click(),
        },
        {
          id: "export-png",
          label: "Export as PNG…",
          onSelect: () => void exportCompositionAsPng({ composition: editor.composition }),
        },
        {
          id: "export-json",
          label: "Export as Compio JSON…",
          onSelect: () => exportCompositionAsJson({ composition: editor.composition }),
        },
      ],
    },
    {
      id: MenuName.EDIT,
      label: "Edit",
      items: [
        { id: "undo", label: "Undo", onSelect: editor.undo, disabled: !editor.canUndo },
        { id: "redo", label: "Redo", onSelect: editor.redo, disabled: !editor.canRedo },
        { id: "delete-layer", label: "Delete Layer", onSelect: editor.removeSelectedLayers },
      ],
    },
    {
      id: MenuName.IMAGE_SETTINGS,
      label: "Image",
      items:
        imageEffectPlugins.length > 0
          ? imageEffectPlugins.map((plugin) => ({
              id: plugin.manifest.name,
              label: plugin.manifest.name,
              onSelect: () => onOpenEffectDialog(plugin.manifest.name),
            }))
          : [
              {
                id: "no-effects",
                label: "No effects registered",
                onSelect: () => undefined,
                disabled: true,
              },
            ],
    },
    {
      id: MenuName.LAYER,
      label: "Layer",
      items: [
        {
          id: "add-blank-layer",
          label: "Add Blank Layer",
          onSelect: () =>
            editor.addRasterLayer(
              createEmptyRaster(editor.composition.canvasSize),
              `Layer ${editor.composition.layers.length + 1}`,
            ),
        },
        { id: "delete-layer", label: "Delete Layer", onSelect: editor.removeSelectedLayers },
      ],
    },
    {
      id: MenuName.SELECT,
      label: "Select",
      items: [{ id: "deselect", label: "Deselect", onSelect: editor.clearSelection }],
    },
    {
      id: MenuName.VIEW,
      label: "View",
      items: [
        { id: "zoom-in", label: "Zoom In", onSelect: viewportZoom.zoomIn },
        { id: "zoom-out", label: "Zoom Out", onSelect: viewportZoom.zoomOut },
        {
          id: "zoom-100",
          label: "Zoom to 100%",
          onSelect: viewportZoom.resetZoom,
          disabled: viewportZoom.zoom === DEFAULT_ZOOM,
        },
        { id: "fit-to-window", label: "Fit to Window", onSelect: onFitToWindow },
      ],
    },
  ];

  return (
    <>
      <MenuBar menus={menus} />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleImageFile(file);
          event.target.value = "";
        }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importCompositionFromJsonFile(file).then(editor.loadComposition);
          event.target.value = "";
        }}
      />
    </>
  );
};
