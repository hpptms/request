import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { geoMercator } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { ActiveUsersPoint, ActiveUsersByPrefecture } from "../lib/activeUsersHeatmap";

// Natural Earth 1:50m admin-0 countries (public domain), via the world-atlas
// npm package — vendored as a static asset (public/data/countries-50m.json)
// rather than pulled in as a dependency, since only this one topojson file
// is used.
const JAPAN_GEO_URL = "/data/countries-50m.json";

// Shared between ComposableMap's projectionConfig prop and the standalone
// d3-geo projection below — the two must stay in lockstep or nearest-point
// hover math would target the wrong screen coordinates.
const PROJECTION_CENTER: [number, number] = [137, 34.5];
const PROJECTION_SCALE = 1150;
const VIEWBOX_WIDTH = 520;
const VIEWBOX_HEIGHT = 640;

// Sequential blue ramp (dataviz skill, references/palette.md), 5 of its 13
// documented steps. This app is dark-mode-only (see theme.ts), so the
// "flips anchor in dark" rule applies throughout: low magnitude sits near
// the map's own dark surface, high magnitude gets the lightest/brightest
// step so it's the one that visually pops.
const SEQUENTIAL_STEPS = ["#0d366b", "#1c5cab", "#2a78d6", "#6da7ec", "#b7d3f6"];

const MIN_RADIUS = 5;
const MAX_RADIUS = 28;
const MAP_SURFACE = "#101014";

function bucketColor(value: number, maxValue: number) {
  if (maxValue <= 0) return SEQUENTIAL_STEPS[0];
  const t = value / maxValue;
  const idx = Math.min(SEQUENTIAL_STEPS.length - 1, Math.floor(t * SEQUENTIAL_STEPS.length));
  return SEQUENTIAL_STEPS[idx];
}

// Proportional-symbol convention: encode magnitude in *area*, not radius,
// so a 4x value doesn't look 4x as "big" (it would if r scaled linearly).
function radiusFor(value: number, maxValue: number) {
  if (maxValue <= 0) return MIN_RADIUS;
  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(value / maxValue);
}

// Cheap, deterministic per-point hash so each marker's pulse animation gets
// a stable (not re-randomized every render) but different timing —
// otherwise every bubble breathing in lockstep reads as one blinking mass
// rather than the soft "moya moya" drift asked for.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Proportional-symbol map of active users by city. A single continuous
// measure (magnitude), so no categorical legend box — see
// marks-and-anatomy.md's "single series needs no legend box" — but a
// sequential ramp still gets a scale key since, unlike identity, the
// reader can't otherwise tell where a shade sits on the low<->high range.
//
// points drive the map's bubble markers (city precision); prefectures
// drive the table underneath it (prefecture-only — see
// aggregateByPrefecture's comment for why the table is deliberately
// coarser than the map).
export function ActiveUsersMap({
  points,
  prefectures,
}: {
  points: ActiveUsersPoint[];
  prefectures: ActiveUsersByPrefecture[];
}) {
  const [hovered, setHovered] = useState<ActiveUsersPoint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxValue = useMemo(() => Math.max(0, ...points.map((d) => d.activeUsers)), [points]);
  const sortedPoints = useMemo(() => [...points].sort((a, b) => b.activeUsers - a.activeUsers), [points]);
  const sortedPrefectures = useMemo(() => [...prefectures].sort((a, b) => b.activeUsers - a.activeUsers), [prefectures]);

  // Same projection as ComposableMap below, computed standalone so pointer
  // moves can be matched against each city's screen position directly.
  const projection = useMemo(
    () => geoMercator().center(PROJECTION_CENTER).scale(PROJECTION_SCALE).translate([VIEWBOX_WIDTH / 2, VIEWBOX_HEIGHT / 2]),
    [],
  );
  const projected = useMemo(
    () =>
      sortedPoints.map((d) => {
        const p = projection([d.lng, d.lat]);
        return { ...d, x: p?.[0] ?? 0, y: p?.[1] ?? 0 };
      }),
    [sortedPoints, projection],
  );

  // Nearest-point hit testing (interaction.md's guidance for dense
  // scatter/bubble marks) instead of a hover handler per circle: at this
  // map's zoom, cities close together (Tokyo/Yokohama) have markers that
  // overlap heavily, so whichever circle happens to paint on top would
  // otherwise swallow the pointer for anything underneath it — including
  // Tokyo, the largest and most important point on the map.
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = VIEWBOX_WIDTH / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    let nearest: (typeof projected)[number] | null = null;
    let nearestDist = Infinity;
    for (const p of projected) {
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = p;
      }
    }
    if (!nearest) return;
    const hitR = Math.max(radiusFor(nearest.activeUsers, maxValue) + 8, 16);
    setHovered(nearestDist <= hitR + 20 ? nearest : null);
  };

  return (
    <Box>
      {/* Gentle, staggered breathing so the map reads as "live" rather than
          static — each circle's duration/delay come from hashString(city)
          below so they drift out of sync with each other ("moya moya"),
          not in one uniform pulse. Respects prefers-reduced-motion. */}
      <style>{`
        @keyframes heatmap-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.18); opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          .heatmap-pulse-circle { animation: none !important; }
        }
      `}</style>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          bgcolor: MAP_SURFACE,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          overflow: "hidden",
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: PROJECTION_CENTER, scale: PROJECTION_SCALE }}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <Geographies geography={JAPAN_GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#2a2a2e"
                  stroke="#3a3a3f"
                  strokeWidth={0.5}
                  style={{ outline: "none" }}
                />
              ))
            }
          </Geographies>

          {/* Sorted descending so small markers still get a hit target on
              top of (not buried under) any larger, overlapping ones. Mouse
              hover is handled by the container's onPointerMove above
              (nearest-point); these circles only need to carry keyboard
              focus + a11y labels. */}
          {sortedPoints.map((d) => {
            const r = radiusFor(d.activeUsers, maxValue);
            const hitR = Math.max(r + 8, 16);
            const key = `${d.lat},${d.lng}`;
            const hash = hashString(key);
            const duration = 2.6 + ((hash % 100) / 100) * 1.8;
            const delay = -((hash % 137) / 137) * duration;
            return (
              <Marker key={key} coordinates={[d.lng, d.lat]}>
                {/* Hit target: bigger than the painted mark (interaction.md). */}
                <circle
                  r={hitR}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.prefecture}: アクティブユーザー ${d.activeUsers}人`}
                  onFocus={() => setHovered(d)}
                  onBlur={() => setHovered((h) => (h === d ? null : h))}
                  style={{ cursor: "pointer" }}
                />
                {/* 2px surface ring so overlapping bubbles (e.g. Tokyo/
                    Yokohama) stay legible — marks-and-anatomy.md. */}
                <circle
                  className="heatmap-pulse-circle"
                  r={r}
                  fill={bucketColor(d.activeUsers, maxValue)}
                  stroke={MAP_SURFACE}
                  strokeWidth={2}
                  pointerEvents="none"
                  style={{
                    opacity: 0.8,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    animation: `heatmap-pulse ${duration}s ease-in-out ${delay}s infinite`,
                  }}
                />
              </Marker>
            );
          })}
        </ComposableMap>

        {hovered && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              bgcolor: "rgba(20,20,22,0.92)",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              px: 1.25,
              py: 0.75,
              pointerEvents: "none",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {hovered.activeUsers.toLocaleString()}人
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hovered.prefecture}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            bgcolor: "rgba(20,20,22,0.85)",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            少
          </Typography>
          <Box
            sx={{
              width: 60,
              height: 8,
              borderRadius: 4,
              background: `linear-gradient(90deg, ${SEQUENTIAL_STEPS[0]}, ${SEQUENTIAL_STEPS[SEQUENTIAL_STEPS.length - 1]})`,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            多
          </Typography>
        </Box>
      </Box>

      <TableContainer sx={{ mt: 2 }}>
        <Table size="small" aria-label="都道府県別アクティブユーザー数">
          <TableHead>
            <TableRow>
              <TableCell>都道府県</TableCell>
              <TableCell align="right">アクティブユーザー</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPrefectures.map((d) => (
              <TableRow key={d.prefecture} hover>
                <TableCell>{d.prefecture}</TableCell>
                <TableCell align="right">{d.activeUsers.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
