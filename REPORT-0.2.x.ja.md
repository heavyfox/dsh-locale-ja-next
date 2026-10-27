# DSH 0.2.x対応・0.2.1-rc.3検証報告

調査日：2026年10月27日（日本時間）。プラグインのバージョン：**0.2.0**。

指定版の公式ソースは [dsh-v0.2.1-rc.3](https://github.com/deepseek-ai/deepseek-harness/tree/1f81c047fc48fa190a683e469daa699857e9afe8) です。実際の調査には、実環境とnpmの配布コード・型定義を使用しました。

## 対応範囲

DSHの対応範囲を `>=0.2.0-rc.2 <0.3.0-0` に変更しました。0.2.x内の通常更新は、パッケージの正確なバージョン固定で拒否されなくなります。0.3.0のalpha以降は除外します。

今回の実画面検証は **0.2.1-rc.3** です。旧 **0.2.0-rc.2** の配布されたLocaleRuntimeでも回帰テストを実施しました。0.2.1-rc.4のlocale公開型・client manifest型も比較しましたが、rc.4のDSH全体の起動は行っていません。将来の0.2.xすべてを事前に実機検証したという意味ではありません。

## 調査した変更

| 項目 | 0.2.1-rc.3での確認結果と対応 |
|---|---|
| 言語API | addLanguage、register、subscribeとdisposerの公開型は0.2.0-rc.2と同じ。rc.4も同じ |
| client manifest | 公開boot graphにrelease.versionとcommitが追加。既存のModuleLoader形式は継続 |
| 互換性判定 | 新Hostはengines.dshを優先。古いHostはDSH peerを確認するため、両方を更新 |
| プレリリース | DSHの正式判定はincludePrerelease付き。peerにはnpm/pnpmで0.2.1のRCが除外されないよう、0.2.1-0からの枝も明記 |
| 翻訳キー | 58名前空間・2,615キーから64名前空間・2,910キーに増加。新規308キー、削除13キー、英語変更14キーを確認 |
| 置換文字 | restartNoticeとinstallDoneRestartにreasonが追加。互換性説明のpeersがrequirementsに変更 |
| 旧版の文章 | 旧Hostにはboot release情報がない。旧版用の14エントリーを別辞書に保持して、従来の置換文字・説明を維持 |
| 新版の文章 | 0.2.1-rc.1/rc.2のプラグイン管理配布物も確認。reasonとrequirementsはこの時点で新形式。alpha.1は旧形式 |
| フォント | 新Hostはbodyのフォントを--dsh-font-family-text-defaultから生成。旧変数と新しい既定値の両方へ対応し、明示された本文フォントを優先 |
| 設定の入口 | rc.3ではアカウントメニューから設定を開く。実画面テストを両導線へ対応 |
| 初期設定 | 認証情報なしの検証には公開オプションcredentialOnboarding:falseを使用。プラグイン本体はサインイン設定を変更しない |

今回追加した主な翻訳対象は、プラグインマーケット、推論の翻訳UI、セッションログ調査、モデル認証・推論レベル、新しいフォント設定、マイク選択などです。これらの機能を日本語化するために辞書を登録するだけで、音声認識、外部翻訳、モデルAPIへの呼び出しをこのプラグインから実行することはありません。

## 辞書と旧版互換性

src/translations/ja-JP.jsonは新旧の実在キーを含む共通辞書です。src/translations/legacy-0.2.0.jsonは旧版の14エントリーです。公開boot graphのrelease情報を使い、旧0.2.0系、release情報のないHost、確認済みの0.2.1-alpha.1には旧版の文章を重ねます。

最新の英語辞書にない13キーは、旧0.2.0系で必要なため保持します。監査はサポート対象のいずれかの英語基準に存在することを確認し、どの基準にもないキーをstaleとして検出します。各版の置換文字は、その版に合わせた日本語辞書で確認します。

rc.3では2,910キー中2,906エントリーを提供します。残る4つは既存の書式用の空接頭辞・空白区切りです。旧rc.2では2,615キー中2,611エントリーで、旧版向けの監査も通過しました。技術名・URLなどは適切な原表記を維持しています。

## 実施した検証

- pnpm build・typecheck：成功。
- pnpm test：rc.3の実LocaleRuntimeで6件成功。
- pnpm test:legacy：旧rc.2の実LocaleRuntimeで6件成功。
- 新旧すべての辞書キーと置換文字、翻訳の読み出し、英語へのフォールバックを確認。
- 登録・無効化・再登録、途中の失敗の巻き戻しを確認。
- 旧peersと新requirements、再起動理由の置換に未展開の文字列が残らないことを確認。
- 正式な互換性判定で0.2.0-rc.2、0.2.0、0.2.1-rc.3、rc.4、0.2.2-rc.1、0.2.99の範囲内判定を確認。範囲判定と各版の実動作検証は区別しています。
- 0.1.x、0.2.0-rc.1、0.3.0-alpha.1以降は範囲外として拒否されることを確認。
- rc.3の分離したwebプロファイルへCLIからtarballを導入。allow-versionは使用していません。
- 実ブラウザーで日本語の選択、保存、再読み込み、別ブラウザーへの反映、プラグイン管理画面を確認。
- 無効化で英語へ戻り日本語の選択肢が消えること、再有効化で設定が復元されることを確認。
- BIZ UDPGothicの実描画、コード用フォントの維持、新しい本文フォント用CSS変数によるユーザー指定の優先を確認。
- 実画面は11項目が通過し、ブラウザーのpageerrorは0件。
- pnpm auditの既知の脆弱性は0件。

実画面の結果はevidence/0.2.1-rc.3/に保存しています。通常利用中のDSH設定やセッションは変更していません。既存のevidence直下の結果は0.2.0-rc.2時点の記録です。

## 追加・変更した主なファイル

| ファイル | 役割 |
|---|---|
| package.json | 0.2.xを受け入れるengines・peer、rc.3の開発型と旧rc.2のテスト用alias |
| src/translations/index.ts | 公開boot release情報を使った新旧辞書の選択 |
| src/translations/legacy-0.2.0.json | 旧版用の14エントリー |
| src/translations/ja-JP.json | rc.3の追加キーと変更された文章への対応 |
| src/font.ts | 新しい本文フォントの既定値へ対応 |
| resources/en-0.2.1-rc.3.json | 最新の英語基準と提供パッケージの記録 |
| scripts/test-legacy.mjs | 旧版の実runtimeを使う回帰テストの起動 |
| scripts/check-translations.mjs | 新旧の実在キーと版別の置換文字を監査 |
| scripts/check-compatibility.mjs | 0.2.x範囲と0.3.x除外を正式APIで検証 |
| scripts/e2e.mjs | 新旧の設定導線とrc.3のフォント・保存・解除を検証 |
| tests/web-no-credentials.patch.yml | 認証情報を使わずに画面を検証するためのHost設定 |
| evidence/0.2.1-rc.3/ | 今回の実画面と機械可読の検証結果 |

初版の構成・調査経緯は [従来の報告](REPORT.ja.md) を参照してください。

## 継続検証のコマンド

```bat
pnpm check-translations
pnpm check-translations --baseline resources/en-0.2.0-rc.2.json
pnpm typecheck
pnpm build
pnpm test
pnpm test:legacy
pnpm check-compatibility "<実際のDSHインストール先>"
```

新しい版の翻訳キーはextract-localesで別の英語基準へ抽出して比較します。想定外の登録形式や、新しい不足キー・置換文字の不一致は監査でエラーになります。今後の0.2.xでAPI・辞書の構造が変わった場合は、この手順で追従します。

## 制限

第三者パッケージの日本語を持たないメタデータ、埋め込みウィジェット、ハードコードされた文、未登録のサーバーエラー、モデルの出力は従来どおり対象外です。日本語がない登録キーはDSH正式の英語辞書へフォールバックします。英語にもない任意のキーについては、上流側に辞書を追加する必要があります。

ライセンスと翻訳データの帰属はTHIRD_PARTY_NOTICES.mdを参照してください。フォントファイルは配布せず、インストール済みのものを使用します。
