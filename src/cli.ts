#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const usageMessage = [
  "Usage: doclingo <lang> [file]",
  "Examples:",
  "  doclingo ja api-doc-en.md",
  "  cat api-doc-en.md | doclingo ja",
].join("\n");

/**
 * Custom error type so we can attach friendly CLI messages with dedicated exit codes.
 */
class CliError extends Error {
  constructor(message: string, readonly exitCode = 1) {
    super(message);
  }
}

/**
 * Reads UTF-8 text from a file path and wraps any failure in a CliError.
 */
const readFromFile = async (filePath: string): Promise<string> => {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    const reason =
      error instanceof Error && error.message ? ` (${error.message})` : "";
    throw new CliError(`Failed to read file: ${filePath}${reason}`);
  }
};

/**
 * Collects UTF-8 text from stdin.
 */
const readFromStdin = async (): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.once("error", reject);
    process.stdin.once("end", () => resolve(data));
    process.stdin.resume();
  });
};

/**
 * Ensures the Gemini API key is configured before the CLI proceeds.
 */
const ensureApiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new CliError(
      "Missing GEMINI_API_KEY. Please set your Gemini API key before running doclingo."
    );
  }
  return apiKey;
};

/**
 * Normalizes user input and prevents empty payloads that would waste an API call.
 */
const ensureInputContent = (content: string): string => {
  if (!content.trim()) {
    throw new CliError("Input is empty. Provide Markdown via a file or stdin.");
  }
  return content;
};

/**
 * Ensures a target language was provided.
 */
const ensureTargetLanguage = (lang?: string): string => {
  if (!lang?.trim()) {
    throw new CliError(`Missing <lang> argument.\n${usageMessage}`);
  }
  return lang;
};

/**
 * Determines whether to read from a file path or stdin, enforcing usage rules.
 */
const resolveInputSource = async (filePath?: string): Promise<string> => {
  if (filePath) {
    return await readFromFile(filePath);
  }

  if (process.stdin.isTTY) {
    throw new CliError(`No file provided and stdin is empty.\n${usageMessage}`);
  }

  return await readFromStdin();
};

/**
 * Emits user-friendly errors while preserving non-zero exit codes.
 */
const handleError = (error: unknown): never => {
  if (error instanceof CliError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(error.exitCode);
  }

  const message =
    error instanceof Error && error.message
      ? error.message
      : "An unknown error occurred.";
  process.stderr.write(`Unexpected error: ${message}\n`);
  process.exit(1);
};

/**
 * CLI entry point. Validates configuration, gathers input, and (temporarily)
 * echoes it until the Gemini integration is added.
 */
const main = async (): Promise<void> => {
  ensureApiKey();

  const [langArg, filePath] = process.argv.slice(2);
  const targetLanguage = ensureTargetLanguage(langArg);
  const rawInput = await resolveInputSource(filePath);
  const input = ensureInputContent(rawInput);

  // TODO: use targetLanguage when constructing prompts for Gemini.
  void targetLanguage;

  // Phase 1 step 3 will replace this echo with the Gemini translation result.
  process.stdout.write(input);
};

void main().catch(handleError);
