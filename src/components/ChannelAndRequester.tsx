// 「チャンネル名 ・ リクエスト: 名前」の一行。固有名詞はブラウザ翻訳の
// 対象から外し (translate="no")、ラベル部分だけ翻訳させる。
export function ChannelAndRequester({ channelTitle, requesterName }: { channelTitle: string; requesterName?: string }) {
  return (
    <>
      <span translate="no">{channelTitle}</span>
      {requesterName && (
        <span>
          {" ・ リクエスト: "}
          <span translate="no">{requesterName}</span>
        </span>
      )}
    </>
  );
}
