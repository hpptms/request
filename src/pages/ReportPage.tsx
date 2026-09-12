import type { ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { Link as RouterLink } from "react-router-dom";
import gaReportData from "../data/gaReportData.json";

// Public read-only view of a hand-transcribed GA4 snapshot (see
// data/ga_report_data.{json,md} at the repo root for the source and the
// caveats below). Nothing here is fetched live — the whole page renders one
// frozen JSON snapshot bundled at build time, so every number is only ever
// as fresh as data/gaReportData.json. Swapping this for a live GA4 Data API
// call (server-side, via a service account) is the natural next step if this
// needs to stay current rather than being refreshed by hand.
const data = gaReportData;

function formatNumber(value: number): string {
  return value.toLocaleString("ja-JP");
}

function ChangeChip({ changePct }: { changePct: number | null }) {
  if (changePct === null) return null;
  const positive = changePct >= 0;
  return (
    <Typography
      variant="caption"
      sx={{ color: positive ? "success.main" : "error.main", fontWeight: 600, display: "block" }}
    >
      前期間比 {positive ? "+" : ""}
      {formatNumber(changePct)}%
    </Typography>
  );
}

function KpiCard({ label, value, changePct }: { label: string; value: number; changePct: number | null }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: "1 1 130px", minWidth: 130 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
        {formatNumber(value)}
      </Typography>
      <ChangeChip changePct={changePct} />
    </Paper>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {note && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {note}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

// Small generic table so the many similarly-shaped breakdowns below (geo,
// browser/OS/device, acquisition, events...) don't each hand-roll their own
// TableHead/TableBody JSX.
type Column<T> = {
  key: keyof T;
  label: string;
  align?: "left" | "right";
  format?: (value: T[keyof T]) => ReactNode;
};

function DataTable<T extends object>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={String(col.key)} align={col.align ?? "left"} sx={{ whiteSpace: "nowrap" }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={String(col.key)} align={col.align ?? "left"} sx={{ whiteSpace: "nowrap" }}>
                  {col.format ? col.format(row[col.key]) : String(row[col.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const pct = (v: unknown) => `${v}%`;

function ReportPage() {
  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, gap: 1 }}>
          <QueryStatsIcon color="primary" sx={{ mr: 1.5 }} fontSize="large" />
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
            アクセスレポート
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{ whiteSpace: "nowrap" }}
          >
            トップに戻る
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
            <Typography variant="body2">
              {data.property.dataSnapshotDate} 時点の Google アナリティクス(GA4)データのスナップショットです。
              リアルタイムには更新されません。
            </Typography>
            <Stack component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }} spacing={0.5}>
              {data.property.notes.map((note, i) => (
                <Typography key={i} component="li" variant="caption" color="text.secondary">
                  {note}
                </Typography>
              ))}
            </Stack>
          </Paper>

          <Section title={`主要指標（過去7日間: ${data.kpis_last7days.dateRange}）`}>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
              <KpiCard
                label="アクティブユーザー"
                value={data.kpis_last7days.activeUsers.value}
                changePct={data.kpis_last7days.activeUsers.changePct}
              />
              <KpiCard
                label="新規ユーザー数"
                value={data.kpis_last7days.newUsers.value}
                changePct={data.kpis_last7days.newUsers.changePct}
              />
              <KpiCard
                label="イベント数"
                value={data.kpis_last7days.events.value}
                changePct={data.kpis_last7days.events.changePct}
              />
              <KpiCard
                label="キーイベント"
                value={data.kpis_last7days.keyEvents.value}
                changePct={data.kpis_last7days.keyEvents.changePct}
              />
            </Stack>
          </Section>

          <Section title="リアルタイム" note="取得時点から直近30分のアクティブユーザー数">
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {formatNumber(data.realtime.activeUsersLast30Min)}
            </Typography>
            <DataTable
              columns={[
                { key: "country", label: "国" },
                { key: "activeUsers", label: "アクティブユーザー", align: "right" },
              ]}
              rows={data.realtime.byCountry}
            />
          </Section>

          <Section title={`概要スナップショット（過去28日間: ${data.snapshot_last28days.dateRange}）`}>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
              <KpiCard label="アクティブユーザー" value={data.snapshot_last28days.activeUsers} changePct={null} />
              <KpiCard label="新規ユーザー数" value={data.snapshot_last28days.newUsers} changePct={null} />
              <KpiCard label="イベント数" value={data.snapshot_last28days.events} changePct={null} />
              <Paper variant="outlined" sx={{ p: 2, flex: "1 1 130px", minWidth: 130 }}>
                <Typography variant="caption" color="text.secondary">
                  平均エンゲージ時間
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {data.snapshot_last28days.avgEngagementTimePerUser}
                </Typography>
              </Paper>
            </Stack>
          </Section>

          <Section title="上位ページ">
            <DataTable
              columns={[
                { key: "pageTitle", label: "ページ" },
                {
                  key: "views7d",
                  label: "表示回数(7日間)",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                {
                  key: "views28d",
                  label: "表示回数(28日間)",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                {
                  key: "activeUsers28d",
                  label: "アクティブユーザー",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                { key: "bounceRate28d", label: "直帰率", align: "right", format: pct },
              ]}
              rows={data.topPages}
            />
          </Section>

          <Section title="地域（国別・過去28日間）">
            <DataTable
              columns={[
                { key: "country", label: "国" },
                {
                  key: "activeUsers",
                  label: "アクティブユーザー",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                { key: "activeUsersPct", label: "割合", align: "right", format: pct },
                { key: "engagementRate", label: "エンゲージ率", align: "right", format: pct },
                { key: "avgEngagementTime", label: "平均エンゲージ時間", align: "right" },
              ]}
              rows={data.geo.byCountry_last28days}
            />
          </Section>

          <Section title="地域（都道府県別 Top10・過去28日間）">
            <DataTable
              columns={[
                { key: "region", label: "都道府県" },
                {
                  key: "activeUsers",
                  label: "アクティブユーザー",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                { key: "activeUsersPct", label: "割合", align: "right", format: pct },
                { key: "engagementRate", label: "エンゲージ率", align: "right", format: pct },
                { key: "avgEngagementTime", label: "平均エンゲージ時間", align: "right" },
              ]}
              rows={data.geo.byRegion_last28days_top10Of39}
            />
          </Section>

          <Section title="地域（市区町村別 Top10・過去28日間）">
            <DataTable
              columns={[
                { key: "city", label: "市区町村" },
                {
                  key: "activeUsers",
                  label: "アクティブユーザー",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                { key: "activeUsersPct", label: "割合", align: "right", format: pct },
                { key: "engagementRate", label: "エンゲージ率", align: "right", format: pct },
                { key: "avgEngagementTime", label: "平均エンゲージ時間", align: "right" },
              ]}
              rows={data.geo.byCity_last28days_top10Of75}
            />
          </Section>

          <Section title="ブラウザ別（過去28日間）">
            <DataTable
              columns={[
                { key: "browser", label: "ブラウザ" },
                {
                  key: "activeUsers",
                  label: "アクティブユーザー",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                { key: "activeUsersPct", label: "割合", align: "right", format: pct },
                { key: "engagementRate", label: "エンゲージ率", align: "right", format: pct },
              ]}
              rows={data.technology.byBrowser_last28days}
            />
          </Section>

          <Section title="OS別（過去28日間）">
            <DataTable
              columns={[
                { key: "os", label: "OS" },
                {
                  key: "activeUsers",
                  label: "アクティブユーザー",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                { key: "activeUsersPct", label: "割合", align: "right", format: pct },
                { key: "engagementRate", label: "エンゲージ率", align: "right", format: pct },
              ]}
              rows={data.technology.byOS_last28days}
            />
          </Section>

          <Section title="デバイスカテゴリ別（過去28日間）">
            <DataTable
              columns={[
                { key: "category", label: "デバイス" },
                {
                  key: "activeUsers",
                  label: "アクティブユーザー",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                { key: "activeUsersPct", label: "割合", align: "right", format: pct },
                { key: "engagementRate", label: "エンゲージ率", align: "right", format: pct },
              ]}
              rows={data.technology.byDeviceCategory_last28days}
            />
          </Section>

          <Section title={`集客チャネル（過去7日間）`}>
            <DataTable
              columns={[
                { key: "channel", label: "チャネル" },
                {
                  key: "sessions",
                  label: "セッション数",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                {
                  key: "changePct",
                  label: "前期間比",
                  align: "right",
                  format: (v) => (v === null ? "-" : `${v as number >= 0 ? "+" : ""}${v}%`),
                },
              ]}
              rows={data.acquisition_last7days.byDefaultChannelGroup}
            />
          </Section>

          <Section title="参照元 / メディア（セッション・過去7日間）">
            <DataTable
              columns={[
                { key: "sourceMedium", label: "参照元 / メディア" },
                {
                  key: "sessions",
                  label: "セッション数",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                {
                  key: "changePct",
                  label: "前期間比",
                  align: "right",
                  format: (v) => (v === null ? "-" : `${v as number >= 0 ? "+" : ""}${v}%`),
                },
              ]}
              rows={data.acquisition_last7days.bySessionSourceMedium}
            />
          </Section>

          <Section title="イベント内訳（過去7日間）">
            <DataTable
              columns={[
                { key: "eventName", label: "イベント名" },
                {
                  key: "count",
                  label: "イベント数",
                  align: "right",
                  format: (v) => formatNumber(v as number),
                },
                {
                  key: "changePct",
                  label: "前期間比",
                  align: "right",
                  format: (v) => (v === null ? "-" : `${v as number >= 0 ? "+" : ""}${v}%`),
                },
              ]}
              rows={data.events_last7days}
            />
          </Section>

          <Divider />
          <Typography variant="caption" color="text.secondary">
            プロパティ: {data.property.propertyUrl}(account: {data.property.account})
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default ReportPage;
