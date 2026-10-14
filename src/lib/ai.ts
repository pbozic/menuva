import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { cleanAllergens } from "./allergens";
import { glossaryForPrompt } from "./glossary";
import { LANGUAGES, type I18nText, type Lang } from "./languages";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

function client() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic();
}

// ---------------------------------------------------------------------------
// 1. Extraction: photo / PDF / pasted text → structured menu in the source language
// ---------------------------------------------------------------------------

const ExtractedMenu = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          description: z.string().optional().default(""),
          price: z.number().nullable().optional(),
          suggested_allergens: z.array(z.number()).optional().default([]),
        }),
      ),
    }),
  ),
});
export type ExtractedMenu = z.infer<typeof ExtractedMenu>;

const extractTool: Anthropic.Tool = {
  name: "save_menu",
  description: "Save the structured menu extracted from the source.",
  input_schema: {
    type: "object",
    properties: {
      categories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Category name exactly as on the menu (e.g. 'Juhe', 'Glavne jedi')" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string", description: "Ingredients/description as written, empty if none" },
                  price: { type: ["number", "null"], description: "Price in euros as a number, null if missing" },
                  suggested_allergens: {
                    type: "array",
                    items: { type: "integer", minimum: 1, maximum: 14 },
                    description: "EU allergen numbers (1 gluten, 2 crustaceans, 3 eggs, 4 fish, 5 peanuts, 6 soy, 7 milk, 8 tree nuts, 9 celery, 10 mustard, 11 sesame, 12 sulphites, 13 lupin, 14 molluscs). Use numbers printed on the menu if present; otherwise your best guess from typical ingredients.",
                  },
                },
                required: ["name", "description", "price", "suggested_allergens"],
              },
            },
          },
          required: ["name", "items"],
        },
      },
    },
    required: ["categories"],
  },
};

export type MenuSource =
  | { kind: "image"; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; base64: string }
  | { kind: "pdf"; base64: string }
  | { kind: "text"; text: string };

export async function extractMenu(source: MenuSource, sourceLang: Lang = "sl"): Promise<ExtractedMenu> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (source.kind === "image") {
    content.push({ type: "image", source: { type: "base64", media_type: source.mediaType, data: source.base64 } });
  } else if (source.kind === "pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: source.base64 } });
  } else {
    content.push({ type: "text", text: `<menu>\n${source.text}\n</menu>` });
  }
  content.push({
    type: "text",
    text: `Extract every dish from this restaurant menu. Keep names and descriptions in the original language (${LANGUAGES[sourceLang].label}); do not translate. Fix obvious OCR typos only. Keep the menu's own category order and dish order. If a dish has several prices (e.g. small/large), put the main price in "price" and mention the variants in the description. Ignore wine-list producer notes, opening hours and decorative text.`,
  });

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 16000,
    tools: [extractTool],
    tool_choice: { type: "tool", name: "save_menu" },
    messages: [{ role: "user", content }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Menu extraction returned no data");
  const parsed = ExtractedMenu.parse(block.input);
  parsed.categories.forEach((c) => c.items.forEach((i) => (i.suggested_allergens = cleanAllergens(i.suggested_allergens))));
  return parsed;
}

// ---------------------------------------------------------------------------
// 2. Translation: source-language strings → all target languages, with glossary
// ---------------------------------------------------------------------------

export type TranslatableEntry = { id: string; kind: "category" | "dish_name" | "dish_description"; text: string };

const TranslationResult = z.object({
  translations: z.array(z.object({ id: z.string(), values: z.record(z.string(), z.string()) })),
});

/**
 * Translates a batch of menu strings into every target language.
 * Returns a map id → I18nText (including the source language).
 */
export async function translateEntries(
  entries: TranslatableEntry[],
  sourceLang: Lang,
  targetLangs: Lang[],
): Promise<Record<string, I18nText>> {
  const targets = targetLangs.filter((l) => l !== sourceLang);
  const out: Record<string, I18nText> = {};
  entries.forEach((e) => (out[e.id] = { [sourceLang]: e.text }));
  const toTranslate = entries.filter((e) => e.text.trim());
  if (!targets.length || !toTranslate.length) return out;

  const tool: Anthropic.Tool = {
    name: "save_translations",
    description: "Save translations for every entry.",
    input_schema: {
      type: "object",
      properties: {
        translations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              values: {
                type: "object",
                properties: Object.fromEntries(targets.map((l) => [l, { type: "string" }])),
                required: targets,
              },
            },
            required: ["id", "values"],
          },
        },
      },
      required: ["translations"],
    },
  };

  const system = `You translate restaurant menus in Slovenia for tourists. Your translations must read like a good local restaurant wrote them, not like machine translation.

Rules:
- Source language: ${LANGUAGES[sourceLang].label}. Target languages: ${targets.map((l) => `${l} (${LANGUAGES[l].label})`).join(", ")}.
- dish_name: for traditional or regional dishes KEEP the original name and add a short description after an en dash, e.g. "Štruklji – rolled dumplings with cottage cheese". For generic dishes just translate naturally ("Goveja juha" → "Beef soup").
- Never translate literally word-by-word. Use the culinary terms a native menu would use in that language (e.g. DE "Rindssuppe" in Austria-friendly style, IT "zuppa di manzo").
- dish_description: translate ingredients/descriptions naturally and concisely. Keep units and numbers.
- category: short, standard menu section names ("Predjedi" → "Starters" / "Vorspeisen" / "Antipasti" / "Predjela").
- Do not invent ingredients. Do not add prices.

Glossary of regional dishes (meaning, for your descriptions):
${glossaryForPrompt()}`;

  // Batch to keep each request comfortably sized.
  const BATCH = 60;
  for (let i = 0; i < toTranslate.length; i += BATCH) {
    const batch = toTranslate.slice(i, i + BATCH);
    const res = await client().messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: "save_translations" },
      messages: [
        {
          role: "user",
          content: `Translate every entry. Return one result per id.\n\n${JSON.stringify(batch, null, 1)}`,
        },
      ],
    });
    const block = res.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("Translation returned no data");
    const parsed = TranslationResult.parse(block.input);
    for (const tr of parsed.translations) {
      if (!out[tr.id]) continue;
      for (const l of targets) if (tr.values[l]) out[tr.id][l] = tr.values[l].trim();
    }
  }
  return out;
}
