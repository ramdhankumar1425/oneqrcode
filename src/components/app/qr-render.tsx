"use client";

import { useEffect, useRef } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Download } from "@/components/ui/icons";

export type QrRenderProps = {
  value: string;
  fg?: string;
  bg?: string;
  logo?: string | null;
  size?: number;
  fileName?: string;
  showDownload?: boolean;
  className?: string;
};

function buildOptions({
  value,
  fg = "#0c1f15",
  bg = "#ffffff",
  logo,
  size = 240,
}: QrRenderProps): Options {
  return {
    width: size,
    height: size,
    type: "canvas",
    data: value || " ",
    image: logo ?? undefined,
    margin: 8,
    qrOptions: { errorCorrectionLevel: logo ? "H" : "M" },
    dotsOptions: { color: fg, type: "rounded" },
    cornersSquareOptions: { color: fg, type: "extra-rounded" },
    cornersDotOptions: { color: fg, type: "dot" },
    backgroundOptions: { color: bg },
    imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.4 },
  };
}

export function QrRender(props: QrRenderProps) {
  const { size = 240, fileName = "oneqrcode", showDownload, className } = props;
  const holderRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QRCodeStylingCtor = (await import("qr-code-styling")).default;
      if (cancelled || !holderRef.current) return;
      const options = buildOptions(props);
      if (!qrRef.current) {
        qrRef.current = new QRCodeStylingCtor(options);
        holderRef.current.innerHTML = "";
        qrRef.current.append(holderRef.current);
      } else {
        qrRef.current.update(options);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, props.fg, props.bg, props.logo, size]);

  function download(extension: "png" | "svg") {
    qrRef.current?.download({ name: fileName, extension });
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        ref={holderRef}
        className="overflow-hidden rounded-md"
        style={{ width: size, height: size }}
      />
      {showDownload && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => download("png")}>
            <Download size={14} /> PNG
          </Button>
          <Button size="sm" variant="outline" onClick={() => download("svg")}>
            <Download size={14} /> SVG
          </Button>
        </div>
      )}
    </div>
  );
}
