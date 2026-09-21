import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useVoteQuota } from "../lib/voteQuota";

// 1時間あたりのいいね/bad票の残り。超いいね(😍)はいいね2票分。
export function VoteQuotaLabel({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const quota = useVoteQuota();
  if (!quota) return null;
  const resetMinutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));
  const hint = [
    "最初に投票してから1時間たつと、いいね・bad・超いいねの票がすべて回復します。",
    quota.likeResetSeconds > 0 ? `いいね: あと${resetMinutes(quota.likeResetSeconds)}分で全回復` : "",
    quota.badResetSeconds > 0 ? `bad: あと${resetMinutes(quota.badResetSeconds)}分で全回復` : "",
  ]
    .filter(Boolean)
    .join(" / ");
  return (
    <Tooltip title={hint}>
      <Typography
        variant="caption"
        color={light ? "inherit" : "text.secondary"}
        sx={{ display: "block", whiteSpace: "nowrap", ...(compact && { textAlign: "center", lineHeight: 1.3 }), ...(light && { color: "white", textShadow: "0 0 4px rgba(0,0,0,0.9)" }) }}
      >
        {compact ? (
          <>
            いいね {quota.likeRemaining}/{quota.likeLimit}
            <br />
            bad {quota.badRemaining}/{quota.badLimit}
          </>
        ) : (
          <>
            残り票数(1時間): いいね {quota.likeRemaining}/{quota.likeLimit} ・ bad {quota.badRemaining}/{quota.badLimit}
          </>
        )}
      </Typography>
    </Tooltip>
  );
}
