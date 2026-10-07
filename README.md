# dsh-locale-ja-next

An offline Japanese language pack for the DeepSeek Harness **0.2.0-rc.2 Web UI**.

Version 0.1.1 uses installed BIZ UDPGothic / Meiryo fonts while Japanese is active. Switching languages or unloading restores DSH's original UI font. No fonts are downloaded, and the code font is unchanged.

See [日本語README](README.ja.md) for installation, development, tests, limitations, and upgrade instructions. The package is not published to npm; download the built tarball from [GitHub Releases](https://github.com/heavyfox/dsh-locale-ja-next/releases):

```sh
dsh plugin --profile web add "<absolute-path-to-dsh-locale-ja-next-0.1.1.tgz>"
dsh web
```

Select **Settings → General → Language → 日本語**. Remove with:

```sh
dsh plugin --profile web remove dsh-locale-ja-next
```

The exact locale peer version is `0.2.0-rc.2`. The plugin uses only public `addLanguage` and `register` APIs with Cordis-owned cleanup, preserves Host preferences, and falls back to English. No runtime imports, shell execution, filesystem access, model calls, credentials, telemetry, or networking are added.

The dictionaries cover 58 extracted namespaces and 2,611 of 2,615 entries. Four internal formatting separators intentionally retain upstream values. Technical names and syntax are preserved. Package-owned descriptions, embedded third-party widgets, hardcoded prose, and server error bodies may still appear in English.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm check-translations
pnpm typecheck
pnpm build
pnpm test
pnpm pack --pack-destination ..
```

Translation data is adapted under MIT from the projects credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Registration, lifecycle, static extraction, build and test code are independently implemented. See [REPORT.ja.md](REPORT.ja.md) for investigation and actual Windows verification evidence.
