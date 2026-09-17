import type { GA4CityUsers } from "../types";
import geonamesJapanCities from "./japanCitiesGeonames.json";

export type ActiveUsersByCity = {
  city: string;
  lat: number;
  lng: number;
  activeUsers: number;
};

// Coordinates of each city's central station/ward — precise enough at the
// zoom level this map renders (a handful of pixels either way is invisible).
// enName is GA4's own city dimension value for that city (its standard
// English/romanized name) — the join key mapGA4CitiesToPoints uses below.
// GA4 can report *any* city it recognizes a visitor in, not just these —
// anything outside this curated list has no coordinates to plot and is
// dropped rather than guessed at.
const JAPAN_CITIES: (Omit<ActiveUsersByCity, "activeUsers"> & { enName: string })[] = [
  { city: "札幌", enName: "Sapporo", lat: 43.0618, lng: 141.3545 },
  { city: "函館", enName: "Hakodate", lat: 41.7687, lng: 140.7291 },
  { city: "仙台", enName: "Sendai", lat: 38.2682, lng: 140.8694 },
  { city: "新潟", enName: "Niigata", lat: 37.9026, lng: 139.0232 },
  { city: "東京", enName: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { city: "横浜", enName: "Yokohama", lat: 35.4437, lng: 139.638 },
  { city: "金沢", enName: "Kanazawa", lat: 36.5613, lng: 136.6562 },
  { city: "名古屋", enName: "Nagoya", lat: 35.1815, lng: 136.9066 },
  { city: "京都", enName: "Kyoto", lat: 35.0116, lng: 135.7681 },
  { city: "大阪", enName: "Osaka", lat: 34.6937, lng: 135.5023 },
  { city: "神戸", enName: "Kobe", lat: 34.6901, lng: 135.1955 },
  { city: "広島", enName: "Hiroshima", lat: 34.3853, lng: 132.4553 },
  { city: "福岡", enName: "Fukuoka", lat: 33.5904, lng: 130.4017 },
  { city: "那覇", enName: "Naha", lat: 26.2124, lng: 127.6809 },
  // Tokyo's 23 special wards: absent from GEONAMES_JAPAN_CITIES below (that
  // dataset only covers GeoNames "populated place" entries, not Tokyo's
  // wards), but common enough in real traffic to add by hand. GA4 reports
  // these as "<Ward> City" (confirmed from real production data, e.g. "Ota
  // City", "Shinjuku City") — foldName strips the " city" suffix below so
  // a bare enName here still matches.
  { city: "千代田区", enName: "Chiyoda", lat: 35.6938, lng: 139.7532 },
  { city: "中央区", enName: "Chuo", lat: 35.6706, lng: 139.772 },
  { city: "港区", enName: "Minato", lat: 35.6581, lng: 139.7516 },
  { city: "新宿区", enName: "Shinjuku", lat: 35.6938, lng: 139.7036 },
  { city: "文京区", enName: "Bunkyo", lat: 35.708, lng: 139.7519 },
  { city: "台東区", enName: "Taito", lat: 35.7128, lng: 139.78 },
  { city: "墨田区", enName: "Sumida", lat: 35.7107, lng: 139.8015 },
  { city: "江東区", enName: "Koto", lat: 35.6725, lng: 139.8171 },
  { city: "品川区", enName: "Shinagawa", lat: 35.6092, lng: 139.7302 },
  { city: "目黒区", enName: "Meguro", lat: 35.6414, lng: 139.6982 },
  { city: "大田区", enName: "Ota", lat: 35.5614, lng: 139.7161 },
  { city: "世田谷区", enName: "Setagaya", lat: 35.6467, lng: 139.6532 },
  { city: "渋谷区", enName: "Shibuya", lat: 35.664, lng: 139.6982 },
  { city: "中野区", enName: "Nakano", lat: 35.7075, lng: 139.6638 },
  { city: "杉並区", enName: "Suginami", lat: 35.6995, lng: 139.6364 },
  { city: "豊島区", enName: "Toshima", lat: 35.7261, lng: 139.7161 },
  { city: "北区", enName: "Kita", lat: 35.7526, lng: 139.7336 },
  { city: "荒川区", enName: "Arakawa", lat: 35.7362, lng: 139.7833 },
  { city: "板橋区", enName: "Itabashi", lat: 35.7512, lng: 139.7093 },
  { city: "練馬区", enName: "Nerima", lat: 35.7357, lng: 139.6516 },
  { city: "足立区", enName: "Adachi", lat: 35.7751, lng: 139.8046 },
  { city: "葛飾区", enName: "Katsushika", lat: 35.7434, lng: 139.8474 },
  { city: "江戸川区", enName: "Edogawa", lat: 35.7066, lng: 139.8686 },
];

// Broad fallback coverage for everything JAPAN_CITIES doesn't name (GA4
// reports whichever of ~1,000+ Japanese municipalities a visitor is
// geolocated to, not just the 14 major ones above) — derived from the
// `all-the-cities` npm package (GeoNames.org data, CC BY 4.0; attribution:
// https://www.geonames.org), filtered to country=JP and deduped by name
// (keeping the highest-population match for any name collision, since
// that's the more likely resolution for an ambiguous city name). One-off
// generated, not hand-maintained — see the git history of this file for
// the generation script if it ever needs regenerating.
type GeonamesEntry = { name: string; lat: number; lng: number };
const GEONAMES_JAPAN_CITIES = geonamesJapanCities as GeonamesEntry[];

// Normalizes a city name for matching: strips diacritics (macrons like
// "Yūki" -> "Yuki"), a trailing " city" (GA4 disambiguates Tokyo's wards
// this way — "Ota City" — but GEONAMES_JAPAN_CITIES/JAPAN_CITIES don't use
// that suffix), and hyphens (GA4's "Higashiosaka" vs this dataset's
// "Higashi-ōsaka").
function foldName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/-/g, "")
    .replace(/\s+city$/, "")
    .trim();
}

// Joins the backend's GA4 report (English city name + count) against
// JAPAN_CITIES first (for the ~14 major cities' nicer Japanese labels),
// then GEONAMES_JAPAN_CITIES as broader fallback coverage. Case- and
// diacritic-insensitive since GA4's exact spelling isn't a documented
// guarantee. Still-unmatched cities (a Tokyo special ward, or anything too
// small for either dataset) are silently dropped rather than plotted
// without coordinates.
export function mapGA4CitiesToPoints(cities: GA4CityUsers[]): ActiveUsersByCity[] {
  const byEnName = new Map(JAPAN_CITIES.map((c) => [foldName(c.enName), c]));
  const byGeonamesName = new Map(GEONAMES_JAPAN_CITIES.map((c) => [foldName(c.name), c]));

  const points: ActiveUsersByCity[] = [];
  for (const { city, activeUsers } of cities) {
    const key = foldName(city);
    const curated = byEnName.get(key);
    if (curated) {
      points.push({ city: curated.city, lat: curated.lat, lng: curated.lng, activeUsers });
      continue;
    }
    const geonamesMatch = byGeonamesName.get(key);
    if (geonamesMatch) {
      points.push({ city: geonamesMatch.name, lat: geonamesMatch.lat, lng: geonamesMatch.lng, activeUsers });
    }
  }
  return points;
}

// TEMPORARY placeholder — shown whenever GET /api/heatmap returns nothing
// yet (no GA4 property configured, or the backend's background refresher
// hasn't completed its first run). See HeatmapPage.tsx / AdminHeatmapPage.tsx.
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
