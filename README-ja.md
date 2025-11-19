# doclingo

`doclingo` は、Gemini を介して技術ドキュメントを翻訳する TypeScript CLI です。ファイルパスまたは標準入力から Markdown を読み込み、翻訳された Markdown を直接標準出力に書き込むため、追加のログなしで他のツールにパイプできます。

## 概要

**説明**
doclingo は、Markdown 構造を維持したまま Gemini にプロンプトを送信する、ターミナルファーストの翻訳ツールです。コマンドラインワークフローを好むエンジニアや、GUI ベースの翻訳アシスタントに依存できないエンジニアのために設計されています。

**トピック**

- CLI 翻訳ユーティリティ
- Gemini API 使用例
- Markdown を維持したローカライゼーション
- Node.js + TypeScript ツール

**ユースケース**

- Claude Code のようなツールがターミナルで利用できない場合に、ドキュメントの翻訳を素早く実行する
- CI またはローカルスクリプトの一部として、API ドキュメント、ADR、または仕様を翻訳する
- ブラウザベースのエディタを開かずに、ローカライゼーションチェックを自動化する

## 要件

- Node.js 24 LTS (Krypton) 以降
- `GEMINI_API_KEY` 環境変数 (Gemini API キー)

## セットアップ

### GitHub からのインストール

```bash
git clone https://github.com/micci184/doclingo.git
cd doclingo
npm install
npm run build
npm link   # ローカル CLI を `doclingo` コマンドとして公開します
```

## 使用方法

```bash
doclingo <lang> [file]
cat file.md | doclingo <lang>
```

- `<lang>`: ターゲット言語コード (例: `ja`, `en`, `es`, `zh-CN`, `zh-TW`)
- `[file]`: オプションのソース Markdown。省略された場合は標準入力が使用されます。
- 成功時には、CLI は翻訳された Markdown のみを標準出力に出力します。エラーは標準エラー出力に、ゼロ以外の終了コードとともに表示されます。

## 例

```bash
# 日本語
doclingo ja api-doc-en.md > api-doc-ja.md
cat api-doc-en.md | doclingo ja > api-doc-ja.md

# スペイン語
doclingo es api-doc-en.md > api-doc-es.md

# 簡体字中国語
doclingo zh-CN api-doc-en.md > api-doc-zh-cn.md

# 繁体字中国語
doclingo zh-TW api-doc-en.md > api-doc-zh-tw.md

# 英語に戻す
doclingo en api-doc-ja.md > api-doc-en.md
```

## 検証チェックリスト

`npm run build` と `npm link` を実行した後、`GEMINI_API_KEY` を設定して以下のコマンドを検証してください。

- `doclingo ja api-doc-en.md > api-doc-ja.md`
- `cat api-doc-en.md | doclingo ja > api-doc-ja.md`
- `doclingo es api-doc-en.md > api-doc-es.md`
- `doclingo zh-CN api-doc-en.md > api-doc-zh-cn.md`
- `doclingo zh-TW api-doc-en.md > api-doc-zh-tw.md`
- `doclingo en api-doc-ja.md > api-doc-en.md`

各コマンドは、Gemini によって返された翻訳済み Markdown 以外の余分な標準出力ノイズを発生させることなく、正常に終了する必要があります。