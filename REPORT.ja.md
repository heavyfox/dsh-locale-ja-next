# API調査・実装・検証報告

調査日：2026年10月7日（日本時間）。成果物：`dsh-locale-ja-next@0.1.1`。検証対象：**DeepSeek Harness 0.2.0-rc.2 のWeb UI**。

## 1. 調査した実環境と公開版

実行環境の `dsh --version` は `0.2.0-rc.2`。グローバルインストールは `npm root -g` 配下の `@deepseek-ai/dsh`。そのpackage.json、配下のlocale・client-modules・package-manifest・app-boot・plugin-managerの実装と型を読みました。

npm registryで確認した公開タグは、DSHの `latest/next=0.2.0-rc.2`、`alpha=0.2.1-alpha.1`。localeパッケージも `next=0.2.0-rc.2`、`alpha=0.2.1-alpha.1` ですが、locale自身の `latest` は `0.0.1-rc.1` のままでした。そのため、開発依存も `latest` には依存せず正確に固定しています。

公式リポジトリーの [rc.2固定ソース](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)（タグ `dsh-v0.2.0-rc.2`）を取得し、インストール済み配布コードと照合しました。DSH本体のアップグレード・ダウングレードは行っていません。

## 2. rc.2のプラグインAPI

| 調査項目 | 確認した仕様と実装 |
|---|---|
| プラグインシステム | CordisのHost Loaderエントリーとブラウザーのclientモジュールを組み合わせる。Node側はESM `apply()` を公開する |
| package manifest | `main`・型定義・`exports["./client"]`・`exports["./package.json"]` と `dsh.client`、`dsh.bundle.patch` を宣言 |
| Webでの検出 | インストールした依存だけでなく、Host Loaderにマウントされたエントリーをclient-modulesが走査する |
| バンドルの導入 | `cordis.patch.yml` のinsertで `locale-ja-next` をマウント。CLIはプロファイルのbundles一覧へ追加する |
| ブラウザー形式 | `window.__ModuleLoader__.load({id, factory})` を使う。ブラウザー向けに生のESMを配布しない |
| manifestのinject | `@deepseek-ai/dsh-client-locale` というパッケージ依存情報。Cordisサービス注入とは別 |
| clientのinject | `inject = ['locale']` でサービスの準備を待つ。`immediately: true` でclientを初期ロード対象にする |
| 言語の追加 | `locale.addLanguage({id:'ja', label:'日本語', fallback:'en'})`。正式なカタログへの追加でLanguage一覧に反映される |
| 翻訳の登録 | `locale.register(namespace, 'ja', dictionary)`。辞書はnamespaceごとの平坦な `Record<string,string>` |
| 置換文字 | `{name}` 形式。翻訳で名前と出現数を保持する |
| フォールバック | エントリーの名前空間でja→enを検索し、その後commonで同じチェーンを検索する |
| 選択の保存 | DSHのHost側locale設定が所有する。独自localStorage、setLocaleのラップ、設定schemaの改変は不要 |
| 活性化 | 辞書を先に、言語を最後に追加し、保存済みのja設定が完全な辞書で有効になるようにする |
| 解除 | `register()` と `addLanguage()` の戻り値のdisposerを `ctx.effect` に所有させる。逆順・1回限りで解除 |
| 部分的失敗 | 登録途中の例外では、それまでに追加した辞書を巻き戻す。既存のja登録を上書きしない |
| メタデータ | `./locale/en.json` と `./locale/ja.json` のexportによる `meta.title/description` は通常のUI辞書と別。DSHの `resolveText()` が選択する |

調査の中心となった公式ソースは [LocaleRuntime](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/locale/src/client/index.ts) と [client manifest](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/modules/src/client/manifest.ts) です。

## 3. 0.1.xと0.2.xの差分

「0.1.x全体に同じAPIだった」とは扱わず、配布物の0.1.0-rc.6、0.1.5-rc.2、0.2.0-rc.2と、最新alphaの0.2.1-alpha.1を比較しました。

| 比較 | 言語パックに関係する確認結果 |
|---|---|
| 0.1.0-rc.6 → 現在 | 初期版には `addLanguage()` がなく、LocaleIdは `zh/en` に限定。現在はBCP 47形式の拡張言語、明示したfallback、disposer付きの公開カタログAPIがある |
| 0.1.5-rc.2 → rc.2 | `addLanguage/register` の言語パック向けシグネチャは継続。設定の型が `SettingsScope` から `ConfigForm` に変更。LocaleRuntimeコンストラクターにnative bootstrapが追加。`resolveText(LocalizedText)` が追加。locale提供側 `apply()` が `Promise<void>` に変更 |
| rc.2 → 0.2.1-alpha.1 | 配布されたlocale client公開型とclient-modules manifest公開型は差分なし。言語パックが使用するAPIは同じ。alphaのDSH全体の起動・インストールは検証していないため互換性の宣言は追加しない |
| 翻訳資源 | 最新インストール全体から再抽出した58名前空間・2,615キーに合わせて旧翻訳を選別・補完。旧版のキー一覧を基準にはしない |

この表は言語パックが使用するAPIの差分です。他のモデル、ツール、セッション永続化など、DSH全領域のbreaking changesを網羅するものではありません。

`@fang2hou/dsh-locale-ja` の調査時HEADは0.3.0で、0.1.5-rc.2を対象とした公開APIの設計でした。`@mimateinn/dsh-i18n` の調査時HEADは既に0.2.8で0.2.xのpeer範囲が追加されていました。ユーザーの0.2.6とは区別しています。同プロジェクトには内部translate/setLocaleのラップ、独自保存、モデルによる自動翻訳があるため、それらは取り込みませんでした。

2プロジェクトはMITです。登録コードをコピーせず新しく実装し、翻訳データだけを現在の実在キーに合わせて適用・補完しました。元の著作権とライセンスは `THIRD_PARTY_NOTICES.md` に同梱しています。

## 4. バージョン指定の判断

peerは `@deepseek-ai/dsh-client-locale: "0.2.0-rc.2"`。正確に検証した1バージョンだけを許可しています。locale peerはoptional指定ですが、これはnpm/pnpmにHostパッケージを二重インストールさせないためです。**DSHの互換性チェックはoptional peerも評価する**ため、制約の回避にはなりません。実際に公式 `evaluatePluginCompatibility()` でrc.2の許可と未検証版の拒否を確認しました。

LLMを使用しないため `dsh-llm` peerはありません。Cordisもruntime importをしないため、本番peerを追加していません。Cordisとlocaleの型は開発依存として使用します。manifestの `engines.dsh` にもrc.2を記載しましたが、CLIの判定を保証するのはpeerの範囲です。

## 5. 完成ファイルと役割

| ファイル | 役割 |
|---|---|
| `package.json` | 正式manifest、正確なpeer、export、ビルド・監査・テストコマンド |
| `pnpm-lock.yaml` | 固定した開発依存の再現可能なインストール |
| `pnpm-workspace.yaml` | esbuildの依存スクリプトを明示的に無効化 |
| `tsconfig.json` | strictな型チェックと型定義生成 |
| `cordis.patch.yml` | web profileへHost Loaderエントリーを追加 |
| `src/index.ts` | 副作用のないHostのapply |
| `src/client.ts` | localeサービス注入、辞書とフォントのCordis effectの所有 |
| `src/locale.ts` | トランザクション型の登録、失敗時の巻き戻し、逆順の解除 |
| `src/font.ts` | 日本語選択中のUIフォント変更、言語変更・無効化時の解除 |
| `src/types.ts` | 使用する公開APIだけをPickした型 |
| `src/translations/ja-JP.json` | 58名前空間のローカル日本語辞書、2,611エントリー |
| `locale/en.json`・`locale/ja.json` | このプラグインの表示メタデータ |
| `lib/index.js` | ビルド済みHost ESM |
| `lib/client.js` | 翻訳を内包した、runtime importのないModuleLoaderバンドル |
| `lib/types/*.d.ts` | 5つの公開型定義 |
| `scripts/build.mjs` | 型定義と両バンドルの生成、runtime require混入の拒否 |
| `scripts/static-data.mjs` | 文字列・静的オブジェクト・定数参照のAST評価器。ソースを実行しない |
| `scripts/extract-locales.mjs` | 実際のDSH client配布物を走査し、英語の登録辞書を抽出 |
| `scripts/check-translations.mjs` | 未翻訳、余分なキー、空文字、置換文字の監査 |
| `scripts/check-compatibility.mjs` | インストール済みDSHの正式な互換性判定による検証 |
| `scripts/e2e.mjs` | 実Web UIで選択・保存・別ブラウザー・無効化と復元を検証 |
| `tests/locale.test.mjs` | 配布されたrc.2 runtimeとCordisを使う5件のテスト |
| `resources/en-0.2.0-rc.2.json` | 英語基準、DSH版、各namespaceの提供パッケージ |
| `resources/accepted-fallbacks.json` | 意図的に保持する4つの書式用キー |
| `resources/coverage.json` | 監査結果：不足4、古いキー0、無効な翻訳0 |
| `README.md`・`README.ja.md` | 導入・開発・トラブルシューティング・更新への追従 |
| `REPORT.ja.md` | この報告書 |
| `LICENSE`・`THIRD_PARTY_NOTICES.md` | 本実装と使用データのMITライセンス |
| `.gitignore` | 開発依存と一時的なテスト結果を除外 |
| `evidence/*` | ソース配布に含む実画面とE2E検証結果。npmパッケージには含めない |

全コードと翻訳はソースZIPとプロジェクトフォルダーに含まれます。大きなJSONをチャットに再掲する代わりに、実際にビルドしたファイルを提供します。

## 6. 実際に行った検証

Windows、Node.js **24.21.0**、pnpm **12.9.1**、Chromium **153.0.8010.12** のヘッドレスブラウザーで実施しました。

| 検証 | 結果 |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | 成功 |
| `pnpm typecheck` | 成功 |
| `pnpm build` | 成功。Host ESM、client、型定義を生成 |
| `pnpm test` | 5/5成功。Host load、実Cordis活性化、登録、翻訳、英語fallback、解除・復元、部分失敗の巻き戻し、全置換文字を確認 |
| `pnpm check-translations <installed-dsh-root>` | 成功。実インストールに対して2,611/2,615（99.8%）。不足は意図的な書式用4キーのみ、stale/invalidは0 |
| `pnpm check-compatibility <installed-dsh-root>` | rc.2は許可。0.1.5-rc.2、0.2.0-rc.1、0.2.0正式版、0.2.1-alpha.1は拒否。exemptionなし |
| `pnpm pack` | ビルド済みtarball生成成功 |
| PowerShellからCLI add | 成功。webプロファイルにbundleとして登録 |
| cmd.exeからCLI add | 最終tarballで成功。互換性エラーなし |
| `dsh plugin --profile web list` | dsh-locale-ja-next@0.1.1を確認 |
| `dsh web --no-open --host 127.0.0.1 --port 19873` | 起動成功。ブラウザーによる正式client load成功 |
| 実UIのLanguageメニュー | 中文・Englishと並んで日本語を確認 |
| 日本語を選択 | 設定・一般・言語・外観・権限・共通ボタン等が日本語へ変更 |
| 再読み込み | 日本語を保持 |
| 新規ブラウザーコンテキスト | 英語ブラウザーでもHostに保存した日本語を復元 |
| プラグイン管理UI | 日本語UIと、このパッケージの日本語説明を確認 |
| 実UIで無効化 | 英語へ復帰。Languageから日本語が消えることを確認 |
| 実UIで再有効化 | 保存済みの日本語を復元 |
| CLI remove | 成功。検証プロファイルからbundleと依存を削除 |
| ブラウザーエラー | E2E全9項目通過、pageerror 0 |

実画面はソース配布の `evidence/settings-ja.png`、`plugins-ja.png`、`disabled-en.png`。機械可読の結果は `evidence/e2e.json`。インストール済みDSHの既存利用データに影響しないよう、全起動・導入テストは作業フォルダー内の `DSH_HOME` で行いました。通常の利用プロファイルへはインストールしていません。

## 7. インストール・ビルド・テスト

導入はビルド済みtarballを指定するだけです。

```bat
dsh plugin --profile web add "<dsh-locale-ja-next-0.1.1.tgzの絶対パス>"
dsh web
```

その後 `Settings → General → Language → 日本語` を選択してください。`allow-version`、`--accept-risk`、peerの `*`、本体コードの書き換えは不要です。

ソースの再ビルドはプロジェクト内で以下を実行します。

```bat
pnpm install --frozen-lockfile --ignore-scripts
pnpm check-translations
pnpm typecheck
pnpm build
pnpm test
pnpm pack --pack-destination ..
```

実UIテストの起動・URL指定方法はREADME.ja.mdを参照してください。UIの活性化・解除まで行う検証には、分離したDSH_HOMEで `pnpm test:e2e --cleanup` を使用します。

## 8. 既知の制限と更新方針

2,615キーは調査時のグローバルDSH配下で抽出できた正式なclient辞書です。通常無効の実験的プラグインの辞書も含むため、すべての項目が常に画面に表示されるわけではありません。音声認識、モデル呼び出し、MCPサーバーへの接続などは実行していません。各キーの読み出しと置換文字はruntimeテストで確認しましたが、全画面の全操作をE2Eで網羅したという意味ではありません。

4つの書式用キーを除き、抽出キーには翻訳値があります。ただし、技術名・URL・APIプロトコル名などは維持しています。表計算プレビュー内の第三者UIとオンボーディング画像も対応資源がないため英語にしています。新しいAPIによるパッケージ所有の説明文、ハードコード文、未登録のバックエンドエラー、CLI、モデルの回答、ユーザーの入力は翻訳対象外です。日本語を持たない公式プラグインの説明が英語で残ることを実画面でも確認しました。

DSHの言語lookupは英語にも存在しないキーを最終的にそのキーで表示します。本プラグインは私有メソッドを上書きしないため、この上流仕様は変更しません。本体・第三者プラグインが英語辞書を持つ範囲では正式な英語フォールバックが動作します。

今後は `check-translations <新しい実インストール>` で差分を調べ、別ファイルへ英語基準を抽出し、公開型・manifestとCLI仕様を比較してください。翻訳と置換文字を補正し、build・test・公式互換性判定・分離プロファイルへのtarball導入・実UIでの選択と解除を完了してから対応版を宣言します。新しい未翻訳キーを例外ファイルに大量追加して監査を通す運用はしません。

## 9. セキュリティとライセンス

Host applyは空です。browserは同梱辞書をDSHのlocaleサービスに登録し、日本語の選択中のみDSHのUIフォント用CSS変数を変更します。シェル、ファイル、credential、APIキー、ネットワーク、テレメトリー、セッション内容、LLMサービスにはアクセスしません。実行時の別パッケージimportも0です。

開発用の抽出・監査・テストだけがソースや固定辞書、検証用設定を読みます。npmに入るruntimeファイルに開発用スクリプトは含めません。使用した翻訳データと英語基準のライセンス文・固定コミットの参照はTHIRD_PARTY_NOTICES.mdを参照してください。



## 10. 0.1.1でのフォント改善

日本語を選択中のUIフォントはBIZ UDPGothicを優先し、未導入ならMeiryoなどのインストール済み日本語フォントへフォールバックします。DSH 0.2.0-rc.2の既存CSS変数 --dsw-font-family を、プラグイン所有のstyle要素で変更します。等幅フォント用の --ds-font-family-code は変更しません。言語を切り替えるとstyle要素を外し、プラグインのdispose時には購読も解除します。フォントをダウンロードする処理はありません。

実ブラウザーのCSSとChromiumの実レンダリング情報で、BIZ UDPGothicが日本語の字形に使用されたことを確認しました。evidence/fonts.jsonに記録しています。英語への変更、プラグイン無効化で元のfont-familyへ復帰するE2E検証も通過しました。
