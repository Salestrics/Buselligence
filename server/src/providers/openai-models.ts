/** Primary OpenAI model slugs for The Buselligence Project runtime. */
export const OPENAI_MODELS = {
  sol: "gpt-5.6-sol",
  luna: "gpt-5.6-luna",
  terra: "gpt-5.6-terra",
} as const;

export const OPENAI_DEFAULT_MODEL = OPENAI_MODELS.sol;

export type OpenAIModelId = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];
