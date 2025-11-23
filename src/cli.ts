#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const usageMessage = [
  "Usage: doclingo <lang> [file]",
  "Examples:",
  "  doclingo ja api-doc-en.md",
  "  cat api-doc-en.md | doclingo ja",
].join("\n");

type LanguageMetadata = {
  code: string;
  displayName: string;
  instructions: string;
};

const languagePresets: Record<string, Omit<LanguageMetadata, "code">> = {
  ja: {
    displayName: "Japanese",
    instructions:
      "Write clear Japanese technical documentation in polite です・ます調 without additional commentary.",
  },
  en: {
    displayName: "English",
    instructions:
      "Produce concise, neutral American English suitable for software documentation.",
  },
  es: {
    displayName: "Spanish",
    instructions:
      "Use neutral international Spanish with formal tone for professional technical docs.",
  },
  "zh-cn": {
    displayName: "Simplified Chinese",
    instructions:
      "Use Simplified Chinese with precise terminology and a professional yet approachable tone.",
  },
  "zh-tw": {
    displayName: "Traditional Chinese",
    instructions:
      "Use Traditional Chinese with Taiwan technical vocabulary and a polite instructional tone.",
  },
};

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
 * Resolves human-friendly metadata for the requested language.
 */
const resolveLanguageMetadata = (lang: string): LanguageMetadata => {
  const normalizedCode = lang.trim();
  const lookupKey = normalizedCode.toLowerCase().replace(/_/g, "-");
  const preset = languagePresets[lookupKey];

  if (preset) {
    return {
      code: normalizedCode,
      displayName: preset.displayName,
      instructions: preset.instructions,
    };
  }

  return {
    code: normalizedCode,
    displayName: normalizedCode,
    instructions:
      "Maintain a professional, neutral tone appropriate for technical documentation in the requested language.",
  };
};

/**
 * Builds the Gemini prompt, embedding metadata and preserving Markdown.
 */
const buildTranslationPrompt = (
  metadata: LanguageMetadata,
  content: string
): string => {
  return [
    "You are a translator for international software-engineering documentation.",
    `Translate the following Markdown into ${metadata.displayName} (${metadata.code}).`,
    `Style guidance: ${metadata.instructions}`,
    "Preserve the Markdown structure and output only the translated Markdown.",
    "=== Source Markdown ===",
    content,
  ].join("\n\n");
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
const DEFAULT_GEMINI_MODEL_ID = "gemini-2.5-flash-lite";

const buildModelEndpoint = (modelId: string): string => {
  if (modelId.startsWith("http://") || modelId.startsWith("https://")) {
    return modelId;
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
};

const resolveModelId = (cliModelOverride?: string): string => {
  const cliModel = cliModelOverride?.trim();
  if (cliModel === "") {
    throw new CliError("Model id cannot be empty.");
  }
  if (cliModel) {
    return cliModel;
  }

  const envModel = process.env.DOCLINGO_MODEL?.trim();
  if (envModel === "") {
    throw new CliError("DOCLINGO_MODEL cannot be empty.");
  }
  if (envModel) {
    return envModel;
  }

  return DEFAULT_GEMINI_MODEL_ID;
};

const callGemini = async (
  prompt: string,
  cliModelOverride?: string
): Promise<string> => {
  const apiKey = ensureApiKey();
  const modelId = resolveModelId(cliModelOverride);
  const modelEndpoint = buildModelEndpoint(modelId);
  const response = await fetch(modelEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new CliError(
      `Gemini API request failed with status ${response.status}: ${errorPayload}`
    );
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const translatedText = json.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part?.text ?? "")
    .join("")
    .trim();

  if (!translatedText) {
    throw new CliError(
      "Gemini API returned an empty response. Please try again later."
    );
  }

  return translatedText;
};

const parseCliArgs = (
  argv: string[]
): { positional: string[]; modelOverride?: string } => {
  const positional: string[] = [];
  let modelOverride: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--model") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new CliError("`--model` flag requires a model id value.");
      }
      modelOverride = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--model=")) {
      const value = arg.slice("--model=".length);
      if (!value.trim()) {
        throw new CliError("`--model` flag requires a model id value.");
      }
      modelOverride = value;
      continue;
    }

    positional.push(arg);
  }

  return { positional, modelOverride };
};

const main = async (): Promise<void> => {
  ensureApiKey();

  const args = process.argv.slice(2);
  const { positional, modelOverride } = parseCliArgs(args);
  const [langArg, filePath] = positional;

  const targetLanguage = ensureTargetLanguage(langArg);
  const languageMetadata = resolveLanguageMetadata(targetLanguage);
  const rawInput = await resolveInputSource(filePath);
  const input = ensureInputContent(rawInput);

  const prompt = buildTranslationPrompt(languageMetadata, input);
  const translation = await callGemini(prompt, modelOverride);
  process.stdout.write(translation);
};

void main().catch(handleError);
