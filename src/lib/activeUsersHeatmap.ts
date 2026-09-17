export type ActiveUsersByCity = {
  city: string;
  lat: number;
  lng: number;
  activeUsers: number;
};

// Coordinates of each city's central station/ward — precise enough at the
// zoom level this map renders (a handful of pixels either way is invisible).
export const JAPAN_CITIES: Omit<ActiveUsersByCity, "activeUsers">[] = [
  { city: "札幌", lat: 43.0618, lng: 141.3545 },
  { city: "函館", lat: 41.7687, lng: 140.7291 },
  { city: "仙台", lat: 38.2682, lng: 140.8694 },
  { city: "新潟", lat: 37.9026, lng: 139.0232 },
  { city: "東京", lat: 35.6762, lng: 139.6503 },
  { city: "横浜", lat: 35.4437, lng: 139.638 },
  { city: "金沢", lat: 36.5613, lng: 136.6562 },
  { city: "名古屋", lat: 35.1815, lng: 136.9066 },
  { city: "京都", lat: 35.0116, lng: 135.7681 },
  { city: "大阪", lat: 34.6937, lng: 135.5023 },
  { city: "神戸", lat: 34.6901, lng: 135.1955 },
  { city: "広島", lat: 34.3853, lng: 132.4553 },
  { city: "福岡", lat: 33.5904, lng: 130.4017 },
  { city: "那覇", lat: 26.2124, lng: 127.6809 },
];

// TEMPORARY mock data — GA4 Realtime Data API (city-level `activeUsers`,
// no IP/user-attribute dimensions) will replace this once the property ID
// and service-account credentials are set up on the backend. Swap this
// constant (and ActiveUsersMap's caller) for a real api.ts call then;
// nothing else about the component should need to change.
export const MOCK_ACTIVE_USERS: ActiveUsersByCity[] = [
  { city: "東京", lat: 35.6762, lng: 139.6503, activeUsers: 420 },
  { city: "横浜", lat: 35.4437, lng: 139.638, activeUsers: 110 },
  { city: "大阪", lat: 34.6937, lng: 135.5023, activeUsers: 180 },
  { city: "名古屋", lat: 35.1815, lng: 136.9066, activeUsers: 70 },
  { city: "福岡", lat: 33.5904, lng: 130.4017, activeUsers: 90 },
  { city: "札幌", lat: 43.0618, lng: 141.3545, activeUsers: 40 },
  { city: "神戸", lat: 34.6901, lng: 135.1955, activeUsers: 45 },
  { city: "京都", lat: 35.0116, lng: 135.7681, activeUsers: 38 },
  { city: "広島", lat: 34.3853, lng: 132.4553, activeUsers: 30 },
  { city: "仙台", lat: 38.2682, lng: 140.8694, activeUsers: 25 },
  { city: "那覇", lat: 26.2124, lng: 127.6809, activeUsers: 15 },
  { city: "金沢", lat: 36.5613, lng: 136.6562, activeUsers: 12 },
  { city: "新潟", lat: 37.9026, lng: 139.0232, activeUsers: 10 },
  { city: "函館", lat: 41.7687, lng: 140.7291, activeUsers: 8 },
];
