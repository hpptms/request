import type { HeatmapReport } from "../types";

// Shapes the map/table consume — same as the backend's /api/heatmap
// payload. City names are resolved to coordinates server-side (see
// backend/internal/ga4heatmap) and never reach the browser.
export type ActiveUsersPoint = HeatmapReport["points"][number];
export type ActiveUsersByPrefecture = HeatmapReport["prefectures"][number];

// TEMPORARY placeholder — shown whenever GET /api/heatmap returns nothing
// yet (no GA4 property configured, or the backend's background refresher
// hasn't completed its first run). See useActiveUsersHeatmap.ts.
export const MOCK_ACTIVE_USERS: HeatmapReport = {
  points: [
    { lat: 35.6762, lng: 139.6503, prefecture: "東京都", activeUsers: 420 },
    { lat: 35.4437, lng: 139.638, prefecture: "神奈川県", activeUsers: 110 },
    { lat: 34.6937, lng: 135.5023, prefecture: "大阪府", activeUsers: 180 },
    { lat: 35.1815, lng: 136.9066, prefecture: "愛知県", activeUsers: 70 },
    { lat: 33.5904, lng: 130.4017, prefecture: "福岡県", activeUsers: 90 },
    { lat: 43.0618, lng: 141.3545, prefecture: "北海道", activeUsers: 40 },
    { lat: 34.6901, lng: 135.1955, prefecture: "兵庫県", activeUsers: 45 },
    { lat: 35.0116, lng: 135.7681, prefecture: "京都府", activeUsers: 38 },
    { lat: 34.3853, lng: 132.4553, prefecture: "広島県", activeUsers: 30 },
    { lat: 38.2682, lng: 140.8694, prefecture: "宮城県", activeUsers: 25 },
    { lat: 26.2124, lng: 127.6809, prefecture: "沖縄県", activeUsers: 15 },
    { lat: 36.5613, lng: 136.6562, prefecture: "石川県", activeUsers: 12 },
    { lat: 37.9026, lng: 139.0232, prefecture: "新潟県", activeUsers: 10 },
  ],
  prefectures: [
    { prefecture: "東京都", activeUsers: 420 },
    { prefecture: "大阪府", activeUsers: 180 },
    { prefecture: "神奈川県", activeUsers: 110 },
    { prefecture: "福岡県", activeUsers: 90 },
    { prefecture: "愛知県", activeUsers: 70 },
    { prefecture: "兵庫県", activeUsers: 45 },
    { prefecture: "北海道", activeUsers: 40 },
    { prefecture: "京都府", activeUsers: 38 },
    { prefecture: "広島県", activeUsers: 30 },
    { prefecture: "宮城県", activeUsers: 25 },
    { prefecture: "沖縄県", activeUsers: 15 },
    { prefecture: "石川県", activeUsers: 12 },
    { prefecture: "新潟県", activeUsers: 10 },
  ],
};
