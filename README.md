# doclingo

`doclingo` is a TypeScript CLI that translates technical documentation through Gemini. It accepts Markdown from a file path or stdin and prints the translated Markdown directly to stdout so it can be piped into other tools.

> ⚠️ The Gemini API integration is coming next. For now the CLI validates inputs, language metadata, and prompt construction.

## Requirements

- Node.js 24 LTS (Krypton) or newer
- `GEMINI_API_KEY` environment variable (Gemini API key)

## Setup

```bash
npm install
npm run build
npm link   # exposes the local CLI as the `doclingo` command
```

## Usage

```bash
doclingo <lang> [file]
cat file.md | doclingo <lang>
```

- `<lang>` — target language code (e.g. `ja`, `en`, `es`, `zh-CN`, `zh-TW`)
- `[file]` — optional source Markdown. When omitted, stdin is used.
- On success the CLI prints only the translated Markdown to stdout. Errors go to stderr with a non-zero exit code.

## Examples

```bash
# Japanese
doclingo ja api-doc-en.md > api-doc-ja.md
cat api-doc-en.md | doclingo ja > api-doc-ja.md

# Spanish
doclingo es api-doc-en.md > api-doc-es.md

# Simplified Chinese
doclingo zh-CN api-doc-en.md > api-doc-zh-cn.md

# Traditional Chinese
doclingo zh-TW api-doc-en.md > api-doc-zh-tw.md

# Back to English
doclingo en api-doc-ja.md > api-doc-en.md
```

## Validation checklist

After running `npm run build` and `npm link`, verify the following commands with `GEMINI_API_KEY` set:

- `doclingo ja api-doc-en.md > api-doc-ja.md`
- `cat api-doc-en.md | doclingo ja > api-doc-ja.md`
- `doclingo es api-doc-en.md > api-doc-es.md`
- `doclingo zh-CN api-doc-en.md > api-doc-zh-cn.md`
- `doclingo zh-TW api-doc-en.md > api-doc-zh-tw.md`
- `doclingo en api-doc-ja.md > api-doc-en.md`

Each command should exit successfully without emitting extra stdout noise beyond the translated Markdown (currently the original Markdown until the Gemini call is added).
