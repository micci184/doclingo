# doclingo

`doclingo` is a TypeScript CLI that translates technical documentation through Gemini. It reads Markdown from a file path or stdin and writes the translated Markdown directly to stdout so it can be piped into other tools without extra logs. The CLI targets the cost-effective **gemini-2.5-flash-lite** model by default.

## About

**Description**  
doclingo is a terminal-first translator that keeps Markdown structure intact while sending prompts to Gemini.  
It’s designed for engineers who prefer command-line workflows or can’t rely on GUI-based translation assistants.

**Use Cases**

- Running quick document translations when tools like Claude Code aren’t available in the terminal
- Translating API docs, ADRs, or specs as part of CI or local scripts
- Automating localization checks without opening browser-based editors

## Requirements

- Node.js 24 LTS (Krypton) or newer
- `GEMINI_API_KEY` environment variable (Gemini API key with access to Gemini 2.5 Flash Lite model)
- Optional model override:
  - CLI flag: `--model gemini-2.5-flash`
  - Env variable: `DOCLINGO_MODEL=gemini-2.5-flash`
  - Defaults to `gemini-2.5-flash-lite`
- Optional style preset:
  - CLI flag: `--preset docs` / `--preset casual`
  - Env variable: `DOCLINGO_PRESET=docs`
  - Defaults to `technical`

## Setup

### Install from npm

```bash
npm install -g doclingo
doclingo ja api-doc-en.md > api-doc-ja.md
```

### Run once with npx

```bash
npx doclingo ja api-doc-en.md > api-doc-ja.md
```

### Install from GitHub

```bash
git clone https://github.com/micci184/doclingo.git
cd doclingo
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
- `[file]`: optional source Markdown; when omitted, stdin is used
- On success the CLI prints only the translated Markdown to stdout. Errors go to stderr with a non-zero exit code.

## Examples

```bash
# Japanese
doclingo ja api-doc-en.md > api-doc-ja.md
cat api-doc-en.md | doclingo ja > api-doc-ja.md
# Switch to the docs preset for user-friendly tone
doclingo ja api-doc-en.md --preset docs

# Spanish
doclingo es api-doc-en.md > api-doc-es.md

# Simplified Chinese
doclingo zh-CN api-doc-en.md > api-doc-zh-cn.md

# Traditional Chinese
doclingo zh-TW api-doc-en.md > api-doc-zh-tw.md

# Back to English
doclingo en api-doc-ja.md > api-doc-en.md

# Override model via CLI flag
doclingo ja api-doc-en.md --model gemini-2.5-flash
```

## Validation checklist

After running `npm run build` and `npm link`, verify the following commands with `GEMINI_API_KEY` set:

- `doclingo ja api-doc-en.md > api-doc-ja.md`
- `cat api-doc-en.md | doclingo ja > api-doc-ja.md`
- `doclingo es api-doc-en.md > api-doc-es.md`
- `doclingo zh-CN api-doc-en.md > api-doc-zh-cn.md`
- `doclingo zh-TW api-doc-en.md > api-doc-zh-tw.md`
- `doclingo en api-doc-ja.md > api-doc-en.md`

Each command should exit successfully without emitting extra stdout noise beyond the translated Markdown returned by Gemini.

## Style presets

| Preset    | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| technical | Precise, concise engineer-facing docs. (default)                         |
| docs      | Clear, user-focused tone for developer guides and public docs.           |
| casual    | More relaxed, conversational tone for internal notes or blog-style docs. |

Use `--preset <name>` or set `DOCLINGO_PRESET=<name>` to switch presets.
