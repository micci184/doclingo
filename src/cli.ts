#!/usr/bin/env node

import { readFile } from "node:fs/promises";

class CliError extends Error {
  constructor(message: string, readonly exitCode = 1) {
    super(message);
  }
}

async function readFromFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? ` (${error.message})` : "";
    throw new CliError(`ファイルを読み込めませんでした: ${filePath}${reason}`);
  }
}

async function readFromStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new CliError(
      "使い方: doclingo <filePath> または `cat file.md | doclingo` を実行してください。"
    );
  }

  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.once("error", reject);
    process.stdin.once("end", () => resolve(data));
    process.stdin.resume();
  });
}

function ensureApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new CliError(
      "環境変数 GEMINI_API_KEY が設定されていません。API キーを設定してください。"
    );
  }
  return apiKey;
}

function ensureInputContent(content: string): string {
  if (!content.trim()) {
    throw new CliError("入力内容が空です。翻訳対象の Markdown を指定してください。");
  }
  return content;
}

function handleError(error: unknown): never {
  if (error instanceof CliError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(error.exitCode);
  }

  const message =
    error instanceof Error && error.message
      ? error.message
      : "不明なエラーが発生しました。";
  process.stderr.write(`予期せぬエラーが発生しました: ${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  ensureApiKey();

  const [filePath] = process.argv.slice(2);
  const rawInput = filePath
    ? await readFromFile(filePath)
    : await readFromStdin();
  const input = ensureInputContent(rawInput);

  // Phase 1 step 3 で Gemini API の結果を出力する。
  process.stdout.write(input);
}

main().catch(handleError);