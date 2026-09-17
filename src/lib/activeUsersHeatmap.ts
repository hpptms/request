import type { GA4CityUsers } from "../types";
import geonamesJapanCities from "./japanCitiesGeonames.json";

export type ActiveUsersByCity = {
  city: string;
  lat: number;
  lng: number;
  activeUsers: number;
};

export type ActiveUsersByPrefecture = {
  prefecture: string;
  activeUsers: number;
};

// GeoNames admin1 code -> Japanese prefecture name, per the authoritative
// https://download.geonames.org/export/dump/admin1CodesASCII.txt (JP.*
// rows). Not ISO 3166-2:JP numbering — GeoNames' own scheme, confirmed
// against known cities (Nagoya=01/Aichi, Tokyo=40, Sapporo=12/Hokkaido, ...).
const PREFECTURE_BY_ADMIN_CODE: Record<string, string> = {
  "01": "愛知県",
  "02": "秋田県",
  "03": "青森県",
  "04": "千葉県",
  "05": "愛媛県",
  "06": "福井県",
  "07": "福岡県",
  "08": "福島県",
  "09": "岐阜県",
  "10": "群馬県",
  "11": "広島県",
  "12": "北海道",
  "13": "兵庫県",
  "14": "茨城県",
  "15": "石川県",
  "16": "岩手県",
  "17": "香川県",
  "18": "鹿児島県",
  "19": "神奈川県",
  "20": "高知県",
  "21": "熊本県",
  "22": "京都府",
  "23": "三重県",
  "24": "宮城県",
  "25": "宮崎県",
  "26": "長野県",
  "27": "長崎県",
  "28": "奈良県",
  "29": "新潟県",
  "30": "大分県",
  "31": "岡山県",
  "32": "大阪府",
  "33": "佐賀県",
  "34": "埼玉県",
  "35": "滋賀県",
  "36": "島根県",
  "37": "静岡県",
  "38": "栃木県",
  "39": "徳島県",
  "40": "東京都",
  "41": "鳥取県",
  "42": "富山県",
  "43": "和歌山県",
  "44": "山形県",
  "45": "山口県",
  "46": "山梨県",
  "47": "沖縄県",
};

// Coordinates of each city's central station/ward — precise enough at the
// zoom level this map renders (a handful of pixels either way is invisible).
// enName is GA4's own city dimension value for that city (its standard
// English/romanized name) — the join key mapGA4CitiesToPoints uses below.
// pref is only used for the prefecture-level table (aggregateByPrefecture);
// the map itself still plots at city precision.
const JAPAN_CITIES: (Omit<ActiveUsersByCity, "activeUsers"> & { enName: string; pref: string })[] = [
  { city: "札幌", enName: "Sapporo", lat: 43.0618, lng: 141.3545, pref: "北海道" },
  { city: "函館", enName: "Hakodate", lat: 41.7687, lng: 140.7291, pref: "北海道" },
  { city: "仙台", enName: "Sendai", lat: 38.2682, lng: 140.8694, pref: "宮城県" },
  { city: "新潟", enName: "Niigata", lat: 37.9026, lng: 139.0232, pref: "新潟県" },
  { city: "東京", enName: "Tokyo", lat: 35.6762, lng: 139.6503, pref: "東京都" },
  { city: "横浜", enName: "Yokohama", lat: 35.4437, lng: 139.638, pref: "神奈川県" },
  { city: "金沢", enName: "Kanazawa", lat: 36.5613, lng: 136.6562, pref: "石川県" },
  { city: "名古屋", enName: "Nagoya", lat: 35.1815, lng: 136.9066, pref: "愛知県" },
  { city: "京都", enName: "Kyoto", lat: 35.0116, lng: 135.7681, pref: "京都府" },
  { city: "大阪", enName: "Osaka", lat: 34.6937, lng: 135.5023, pref: "大阪府" },
  { city: "神戸", enName: "Kobe", lat: 34.6901, lng: 135.1955, pref: "兵庫県" },
  { city: "広島", enName: "Hiroshima", lat: 34.3853, lng: 132.4553, pref: "広島県" },
  { city: "福岡", enName: "Fukuoka", lat: 33.5904, lng: 130.4017, pref: "福岡県" },
  { city: "那覇", enName: "Naha", lat: 26.2124, lng: 127.6809, pref: "沖縄県" },
  // Tokyo's 23 special wards: absent from GEONAMES_JAPAN_CITIES below (that
  // dataset only covers GeoNames "populated place" entries, not Tokyo's
  // wards), but common enough in real traffic to add by hand. GA4 reports
  // these as "<Ward> City" (confirmed from real production data, e.g. "Ota
  // City", "Shinjuku City") — foldName strips the " city" suffix below so
  // a bare enName here still matches.
  { city: "千代田区", enName: "Chiyoda", lat: 35.6938, lng: 139.7532, pref: "東京都" },
  { city: "中央区", enName: "Chuo", lat: 35.6706, lng: 139.772, pref: "東京都" },
  { city: "港区", enName: "Minato", lat: 35.6581, lng: 139.7516, pref: "東京都" },
  { city: "新宿区", enName: "Shinjuku", lat: 35.6938, lng: 139.7036, pref: "東京都" },
  { city: "文京区", enName: "Bunkyo", lat: 35.708, lng: 139.7519, pref: "東京都" },
  { city: "台東区", enName: "Taito", lat: 35.7128, lng: 139.78, pref: "東京都" },
  { city: "墨田区", enName: "Sumida", lat: 35.7107, lng: 139.8015, pref: "東京都" },
  { city: "江東区", enName: "Koto", lat: 35.6725, lng: 139.8171, pref: "東京都" },
  { city: "品川区", enName: "Shinagawa", lat: 35.6092, lng: 139.7302, pref: "東京都" },
  { city: "目黒区", enName: "Meguro", lat: 35.6414, lng: 139.6982, pref: "東京都" },
  { city: "大田区", enName: "Ota", lat: 35.5614, lng: 139.7161, pref: "東京都" },
  { city: "世田谷区", enName: "Setagaya", lat: 35.6467, lng: 139.6532, pref: "東京都" },
  { city: "渋谷区", enName: "Shibuya", lat: 35.664, lng: 139.6982, pref: "東京都" },
  { city: "中野区", enName: "Nakano", lat: 35.7075, lng: 139.6638, pref: "東京都" },
  { city: "杉並区", enName: "Suginami", lat: 35.6995, lng: 139.6364, pref: "東京都" },
  { city: "豊島区", enName: "Toshima", lat: 35.7261, lng: 139.7161, pref: "東京都" },
  { city: "北区", enName: "Kita", lat: 35.7526, lng: 139.7336, pref: "東京都" },
  { city: "荒川区", enName: "Arakawa", lat: 35.7362, lng: 139.7833, pref: "東京都" },
  { city: "板橋区", enName: "Itabashi", lat: 35.7512, lng: 139.7093, pref: "東京都" },
  { city: "練馬区", enName: "Nerima", lat: 35.7357, lng: 139.6516, pref: "東京都" },
  { city: "足立区", enName: "Adachi", lat: 35.7751, lng: 139.8046, pref: "東京都" },
  { city: "葛飾区", enName: "Katsushika", lat: 35.7434, lng: 139.8474, pref: "東京都" },
  { city: "江戸川区", enName: "Edogawa", lat: 35.7066, lng: 139.8686, pref: "東京都" },
];

// Broad fallback coverage for everything JAPAN_CITIES doesn't name (GA4
// reports whichever of ~1,000+ Japanese municipalities a visitor is
// geolocated to, not just the ~37 above) — derived from the
// `all-the-cities` npm package (GeoNames.org data, CC BY 4.0; attribution:
// https://www.geonames.org), filtered to country=JP and deduped by name
// (keeping the highest-population match for any name collision, since
// that's the more likely resolution for an ambiguous city name). admin is
// the GeoNames admin1 code, resolved to a prefecture name via
// PREFECTURE_BY_ADMIN_CODE above. One-off generated, not hand-maintained —
// see the git history of this file for the generation script if it ever
// needs regenerating.
type GeonamesEntry = { name: string; lat: number; lng: number; admin: string };
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

const byEnName = new Map(JAPAN_CITIES.map((c) => [foldName(c.enName), c]));
const byGeonamesName = new Map(GEONAMES_JAPAN_CITIES.map((c) => [foldName(c.name), c]));

// Joins the backend's GA4 report (English city name + count) against
// JAPAN_CITIES first (for the ~37 major cities'/wards' nicer Japanese
// labels), then GEONAMES_JAPAN_CITIES as broader fallback coverage. Used
// for the map's bubble markers, which plot at city precision — see
// aggregateByPrefecture below for the coarser, prefecture-only table.
// Case- and diacritic-insensitive since GA4's exact spelling isn't a
// documented guarantee. Still-unmatched cities (too small for either
// dataset) are silently dropped rather than plotted without coordinates.
export function mapGA4CitiesToPoints(cities: GA4CityUsers[]): ActiveUsersByCity[] {
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

// Same join as mapGA4CitiesToPoints, but summed up to prefecture level for
// the table under the map — a specific city/town/village name is more
// detail than that table should show. Coverage is broader than the map's
// (a city only needs a known prefecture, not known coordinates), so a few
// municipalities that can't be *plotted* still count toward their
// prefecture's total here.
export function aggregateByPrefecture(cities: GA4CityUsers[]): ActiveUsersByPrefecture[] {
  const totals = new Map<string, number>();
  for (const { city, activeUsers } of cities) {
    const key = foldName(city);
    const pref = byEnName.get(key)?.pref ?? PREFECTURE_BY_ADMIN_CODE[byGeonamesName.get(key)?.admin ?? ""];
    if (!pref) continue;
    totals.set(pref, (totals.get(pref) ?? 0) + activeUsers);
  }
  return [...totals.entries()]
    .map(([prefecture, activeUsers]) => ({ prefecture, activeUsers }))
    .sort((a, b) => b.activeUsers - a.activeUsers);
}

// TEMPORARY placeholder — shown whenever GET /api/heatmap returns nothing
// yet (no GA4 property configured, or the backend's background refresher
// hasn't completed its first run). Shaped exactly like the backend's raw
// response (English city names) so it goes through the same
// mapGA4CitiesToPoints / aggregateByPrefecture join as real data — see
// useActiveUsersHeatmap.ts.
export const MOCK_ACTIVE_USERS_RAW: GA4CityUsers[] = [
  { city: "Tokyo", activeUsers: 420 },
  { city: "Yokohama", activeUsers: 110 },
  { city: "Osaka", activeUsers: 180 },
  { city: "Nagoya", activeUsers: 70 },
  { city: "Fukuoka", activeUsers: 90 },
  { city: "Sapporo", activeUsers: 40 },
  { city: "Kobe", activeUsers: 45 },
  { city: "Kyoto", activeUsers: 38 },
  { city: "Hiroshima", activeUsers: 30 },
  { city: "Sendai", activeUsers: 25 },
  { city: "Naha", activeUsers: 15 },
  { city: "Kanazawa", activeUsers: 12 },
  { city: "Niigata", activeUsers: 10 },
  { city: "Hakodate", activeUsers: 8 },
];
