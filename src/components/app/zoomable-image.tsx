"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";

/** Past this, the picture counts as zoomed: the carousel stops taking drags. */
const ZOOMED = 1.01;

/**
 * One uploaded image that can be zoomed: pinch or the mouse wheel, a double
 * tap or click to zoom in and back, and buttons for both directions and a
 * reset. Dragging pans only while zoomed in; at normal size a drag still
 * swipes the carousel it sits in.
 */
export const ZoomableImage = ({
  src,
  alt,
  eager,
  active,
  onZoomedChange,
}: {
  src: string;
  alt: string;
  eager: boolean;
  /** The slide on screen. Leaving it puts the picture back to normal size. */
  active: boolean;
  onZoomedChange: (zoomed: boolean) => void;
}) => {
  const t = useTranslations("common.PatientRecordsSection");
  const controls = React.useRef<ReactZoomPanPinchContentRef>(null);
  const [zoomed, setZoomed] = React.useState(false);

  const report = React.useCallback(
    (next: boolean) => {
      setZoomed(next);
      onZoomedChange(next);
    },
    [onZoomedChange]
  );

  React.useEffect(() => {
    if (!active) controls.current?.resetTransform(0);
  }, [active]);

  return (
    <TransformWrapper
      ref={controls}
      minScale={1}
      maxScale={6}
      doubleClick={{ mode: "toggle" }}
      // Multiplied by the wheel's deltaY: a mouse notch (~100) now adds 0.4.
      // The default added 1.5, taking a picture from 1x to 2.5x in one notch.
      wheel={{ step: 0.004 }}
      panning={{ disabled: !zoomed }}
      onTransform={(_ref, state) => {
        const next = state.scale > ZOOMED;
        if (next !== zoomed) report(next);
      }}
    >
      <TransformComponent
        // A double tap or a drag must not select the caption around it.
        wrapperClass="select-none"
        wrapperStyle={{ width: "100%", height: "100%" }}
        contentStyle={{ width: "100%", height: "100%", position: "relative" }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 640px) 768px, 100vw"
          unoptimized
          loading={eager ? "eager" : "lazy"}
          className="object-contain"
          draggable={false}
        />
      </TransformComponent>

      {active ? (
        <div className="bg-background/80 absolute inset-x-0 bottom-3 mx-auto flex w-fit gap-1 rounded-full p-1 shadow-sm backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label={t("ZoomOut")}
            disabled={!zoomed}
            onClick={() => controls.current?.zoomOut()}
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label={t("ResetZoom")}
            disabled={!zoomed}
            onClick={() => controls.current?.resetTransform()}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label={t("ZoomIn")}
            onClick={() => controls.current?.zoomIn()}
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      ) : null}
    </TransformWrapper>
  );
};
