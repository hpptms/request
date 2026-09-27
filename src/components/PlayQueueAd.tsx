import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";

// admax 728x90 banner, tag 81a7e2cac2837657568af6a07ec1b354, above /play's
// waiting-queue column — desktop only. Loaded the same way as PcRailAd /
// MobileAnchorAd (see MobileAnchorAd.tsx for why it goes through the
// sandboxed ads.request.tokyo iframe). The column is narrower than 728px on
// most desktop widths, and the creative mustn't be scaled or clipped, so it
// only renders while the column actually has room for it.
const AD_SRC = "https://ads.request.tokyo/ad/banner?tag=81a7e2cac2837657568af6a07ec1b354";
const AD_WIDTH = 728;
const AD_HEIGHT = 90;

export function PlayQueueAd() {
  const isDesktop = useMediaQuery("(min-width:1024px)");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fits, setFits] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setFits(entry.contentRect.width >= AD_WIDTH));
    observer.observe(el);
    return () => observer.disconnect();
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <Box ref={containerRef} sx={{ width: "100%", display: "flex", justifyContent: "center", mb: fits ? 2 : 0 }}>
      {fits && (
        <Box
          component="iframe"
          title="広告"
          src={AD_SRC}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          sx={{ border: 0, width: AD_WIDTH, height: AD_HEIGHT, flexShrink: 0 }}
        />
      )}
    </Box>
  );
}
