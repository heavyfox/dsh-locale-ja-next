# dsh-locale-ja-next

DeepSeek Harness **0.2.x（0.2.0-rc.2以降）** の `web` プロファイルに「日本語」を追加する、オフラインの言語パックです。正式な `addLanguage` / `register` APIを使用し、DSH本体や既存メソッドを変更しません。

## インストール

このパッケージはnpmには未公開です。[GitHub Releases](https://github.com/heavyfox/dsh-locale-ja-next/releases) から完成したtarballをダウンロードし、そのファイルを置いたディレクトリーでインストールしてください。PowerShellとcmd.exeで同じコマンドを使用できます。

```bat
dsh --version
dsh plugin --profile web add ".\dsh-locale-ja-next-0.2.0.tgz"
dsh web
```

別のディレクトリーから実行する場合は、ダウンロードしたファイルの絶対パスに置き換えてください。導入先は**コマンドを実行した環境の `DSH_HOME` のwebプロファイル**です。通常は `~/.dsh` です。作業中の検証には別の `DSH_HOME` を使っています。

0.1.0などの旧版を導入済みの場合は、先に `dsh plugin --profile web remove dsh-locale-ja-next` で削除してから新版を導入し、DSHとブラウザーを再起動してください。

npm公開後は次の形式でもインストールできます。現時点ではこの名前だけを指定してもnpmから取得できません。

```bat
dsh plugin --profile web add dsh-locale-ja-next@0.2.0
```

## 日本語への変更

`Settings → General → Language → 日本語` を選択します。0.2.1系では、左下のアカウントメニューからSettingsを開きます。変更後は `設定 → 一般 → 言語` になります。選択はDSHのホスト設定に保存され、再読み込みや同じホストに接続する別ブラウザーにも反映されます。初回のサインイン・APIキー設定画面がある場合は、案内に従って初期設定を済ませてください。

言語IDは `ja` です。翻訳ファイル名は `ja-JP.json` ですが、DSHの言語登録には言語共通の `ja` を使っています。ブラウザーの `ja-JP` にもDSHが対応付けます。

## 日本語フォント（0.2.0）

日本語の選択中は、DSHのUIフォントを「BIZ UDPゴシック」優先に変更します。入っていない環境では、メイリオ、Hiragino Sans、Noto Sans JPなどのインストール済みフォントを順に使用します。フォントのダウンロードや外部通信は行いません。英語などへ変更したときや、プラグインを無効にしたときは元のUIフォントへ戻ります。コード・ターミナル用の等幅フォントは維持します。

DSH 0.2.1系で本文フォントを明示的に指定している場合は、その指定を優先します。

## アンインストール

```bat
dsh plugin --profile web remove dsh-locale-ja-next
```

必要に応じて `dsh web` を再起動し、ブラウザーを再読み込みしてください。日本語の辞書と選択肢は解除され、表示は英語へ戻ります。DSHの保存済み言語設定は消さないため、再導入すると日本語を復元できます。

## 対応バージョンと範囲

- 実画面検証：Windows、Node.js 24.21.0、pnpm 12.9.1、DSH 0.2.1-rc.3。0.2.0-rc.2の実runtimeでも回帰テストを実施。
- 対応範囲は0.2.0-rc.2以降の0.2.x（プレリリースを含む）です。0.3.0のalpha以降は対象外です。allow-versionは不要です。
- 将来の0.2.xで追加される未翻訳キーは英語へフォールバックします。上流のAPIや置換文字の変更は、抽出・監査・回帰テストで追従します。
- 配布コードの64名前空間・2,910キーを抽出し、2,906エントリーを日本語辞書で提供します。固有名詞、URL、コマンド名、単位などは必要に応じて元の表記を維持します。
- 残り4キーはDSHが文章を結合するための空の接頭辞・空白区切りです。意図的にDSHの英語値へフォールバックします。未翻訳の表示文はありませんが、以下の対象外はあります。

## 既知の制限

プラグイン名・説明文など、DSHが `locale.resolveText()` で処理するパッケージ所有の多言語メタデータは、通常のlocale辞書とは別です。第三者プラグインが日本語を持たない場合は英語が表示されます。公式プラグインの `Agent Teams` などの説明もこれに該当します。このパッケージ自身の説明文には日本語メタデータを同梱しています。

英語・中国語しか同梱されていないオンボーディング画像と、表計算プレビュー内の第三者ライブラリーのUIは英語を使用します。表計算プレビューのDSH側のボタン・エラー説明は日本語です。ハードコードされた文、バックエンドから届く未登録のエラー本文、CLI出力、モデルの回答、ファイル名・セッション名は翻訳しません。

日本語のキーがない場合は、DSH正式APIの `ja → en` を使用します。英語にも登録がない任意のキーはDSH自身の仕様でキー表示になります。言語パックからDSHのlookupを上書きしないため、このケースは上流または該当プラグイン側で英語辞書を追加して修正します。

## 開発

プロジェクトディレクトリーで、PowerShellまたはcmd.exeから実行してください。

```bat
pnpm install --frozen-lockfile --ignore-scripts
pnpm check-translations
pnpm typecheck
pnpm build
pnpm test
pnpm test:legacy
pnpm pack --pack-destination ..
```

ビルドはNode向けESMの空のHostエントリー、DSH ModuleLoader形式の自己完結したブラウザーバンドル、型定義を生成します。ブラウザーバンドルにruntime `require()` が混入した場合はビルドを拒否します。インストール時にビルドスクリプトを実行する必要はありません。

開発用の `pnpm-workspace.yaml` はesbuildのインストールスクリプトを明示的に無効にします。esbuildはOS別のoptionalパッケージに同梱されたバイナリーを使います。依存スクリプトを許可する操作は不要です。

## DSH更新への追従

`<installed-dsh-root>` は `npm root -g` 配下の `@deepseek-ai/dsh` ディレクトリーなど、調査対象の実際のインストール先です。

```bat
pnpm check-translations "<installed-dsh-root>"
pnpm extract-locales "<installed-dsh-root>" "resources\en-candidate.json"
pnpm check-compatibility "<installed-dsh-root>"
```

抽出スクリプトはTypeScript ASTから静的な辞書だけを読み取り、調査対象のJavaScriptを実行しません。想定外の登録形式はエラーにして、抽出漏れを隠しません。監査は不足キー、削除済みキー、空の翻訳、置換文字の不一致を検出し、`resources/coverage.json` に保存します。新たな不足キーは終了コード1になります。`accepted-fallbacks.json` は4つの書式用キーだけを例外にしています。

0.2.x内の通常更新では対応範囲の書き換えは不要です。新しい実インストールに対して辞書の抽出・監査を行い、追加キーと置換文字を補正してください。言語API、manifest、フォント設定の変更も確認し、build・test・test:legacy・公式互換性判定・分離したプロファイルでの実画面検証を実施します。監査を通すために不足キーを例外へ大量追加する運用はしません。

## 実画面テスト

通常の設定・セッションと混ぜないため、PowerShellで検証用のホームを指定して起動します。検証用フォルダーは任意の書き込み可能な場所にしてください。

```powershell
$env:DSH_HOME = Join-Path $PWD 'test-results\dsh-home'
dsh plugin --profile web add "..\dsh-locale-ja-next-0.2.0.tgz"
dsh --patch tests/web-no-credentials.patch.yml --profile web --no-open --host 127.0.0.1 --port 19873
```

別のPowerShellでブラウザーを用意し、起動ログに表示されたtoken付きURLを指定します。URLは実行ごとに変わるのでREADMEに保存しません。

```powershell
pnpm exec playwright install chromium
$env:DSH_TEST_URL = '<起動ログのtoken付きURL>'
pnpm test:e2e
```

分離した検証プロファイルでは `pnpm test:e2e --cleanup` で、実UIから無効化・再有効化して登録の解除と復元も確認できます。通常利用中のプロファイルには、この検証用操作を実行しないでください。

cmd.exeの場合は `set "DSH_HOME=C:\path\to\test-home"`、`set "DSH_TEST_URL=<起動ログのURL>"` を使用します。実画面テストは日本語の選択、設定画面、再読み込み、別ブラウザーへの設定反映、プラグイン管理画面を確認します。音声入力の有効化やモデル呼び出しは行いません。

## トラブルシューティング

- 日本語が出ない：`dsh --version` と `dsh plugin --profile web list` を確認し、利用中のwebプロファイルへ導入したことを確認します。再起動とブラウザー再読み込みを行ってください。
- 旧日本語化プラグインとの競合：同じ `ja` の登録が既にあるとDSHが拒否します。既存の言語パックを無効化または削除してから、このパッケージを使用してください。既存の登録は上書きしません。
- `incompatible`：DSHの版とプラグインの版を確認してください。プラグイン0.2.0はDSH 0.2.0-rc.2以降の0.2.xを対象にします。旧プラグイン0.1.1はrc.2固定だったため、新版へ入れ替えてください。
- ローカルディレクトリーから入れる場合：先に `pnpm build` を実行してください。配布用 `.tgz` はビルド済みです。
- 権限エラー：指定した `DSH_HOME` への書き込み権限を確認してください。DSHの一覧表示やhelpもプロファイルの初期化・ロック取得を伴います。

## ファイルと調査結果

[実装・API調査・検証報告](REPORT-0.2.x.ja.md)にファイル一覧と役割、実施した検証、API差分をまとめています。翻訳データの帰属・MITライセンスは [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) に記載しています。

実行時の機能は言語・辞書の登録と、日本語表示中のフォント調整です。このプラグインはシェル実行、ファイルアクセス、APIキー取得、LLM翻訳、外部通信、テレメトリーを行いません。
