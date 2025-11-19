# doclingo

`doclingo` is a TypeScript CLI that translates technical documents through Gemini. It reads Markdown from a file or stdin and is designed to write the translated Markdown directly to stdout with no extra logs.

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

- `<lang>`: target language code (e.g., `ja`, `en`, `es`, `zh-CN`, `zh-TW`)
- `[file]`: optional source file; when omitted, stdin is used
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

> Note: The CLI currently wires inputs, language metadata, and prompt generation. The actual Gemini API call will be added next.
