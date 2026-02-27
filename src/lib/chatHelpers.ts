export interface ParsedMessage {
  mainContent: string;
  translation: string | null;
  transliteration: string | null;
  suggestions: string[];
  corrections: string[];
}

export function parseAssistantMessage(content: string): ParsedMessage {
  let mainContent = content;
  let translation: string | null = null;
  let transliteration: string | null = null;
  const suggestions: string[] = [];
  const corrections: string[] = [];

  // Extract suggestions
  const suggestionsMatch = mainContent.match(/SUGGESTIONS:\s*\n([\s\S]*?)$/i);
  if (suggestionsMatch) {
    mainContent = mainContent.slice(0, suggestionsMatch.index).trim();
    const sugLines = suggestionsMatch[1].trim().split("\n");
    for (const line of sugLines) {
      const cleaned = line.replace(/^\d+\.\s*/, "").trim();
      if (cleaned) suggestions.push(cleaned);
    }
  }

  // Catch old emoji format
  const oldSugMatch = mainContent.match(/💡\s*Suggestions:\s*\n([\s\S]*?)$/i);
  if (oldSugMatch) {
    mainContent = mainContent.slice(0, oldSugMatch.index).trim();
    const sugLines = oldSugMatch[1].trim().split("\n");
    for (const line of sugLines) {
      const cleaned = line.replace(/^\d+\.\s*/, "").trim();
      if (cleaned) suggestions.push(cleaned);
    }
  }

  // Also catch old "Suggestion: " line format
  const suggestionLines: string[] = [];
  const nonSuggestionLines: string[] = [];
  for (const line of mainContent.split("\n")) {
    if (line.trim().startsWith("Suggestion:")) {
      const s = line.replace(/^Suggestion:\s*/i, "").trim();
      if (s) suggestionLines.push(s);
    } else {
      nonSuggestionLines.push(line);
    }
  }
  if (suggestionLines.length > 0 && suggestions.length === 0) {
    suggestions.push(...suggestionLines);
    mainContent = nonSuggestionLines.join("\n");
  }

  // Extract corrections block (if present)
  const correctionsBlockMatch = mainContent.match(/CORRECTIONS:\s*\n([\s\S]*?)(?=TRANSLITERATION:|TRANSLATION:|$)/i);
  if (correctionsBlockMatch) {
    const lines = correctionsBlockMatch[1].trim().split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^\s*[-*•]\s*/, "").trim();
      if (cleaned) corrections.push(cleaned);
    }
    mainContent = mainContent.replace(correctionsBlockMatch[0], "").trim();
  }

  // Extract transliteration (before translation to avoid order issues)
  const translitMatch = mainContent.match(/TRANSLITERATION:\s*([\s\S]*?)(?=TRANSLATION:|$)/i);
  if (translitMatch) {
    transliteration = translitMatch[1].trim();
    mainContent = mainContent.replace(translitMatch[0], "").trim();
  }

  // Extract translation
  const transMatch = mainContent.match(/TRANSLATION:\s*([\s\S]*?)(?=TRANSLITERATION:|$)/i);
  if (transMatch) {
    translation = transMatch[1].trim();
    mainContent = mainContent.replace(transMatch[0], "").trim();
  }

  // Catch old "Translation: " line format
  const translationLines: string[] = [];
  const nonTranslationLines: string[] = [];
  for (const line of mainContent.split("\n")) {
    if (line.trim().startsWith("Translation:")) {
      const t = line.replace(/^Translation:\s*/i, "").trim();
      if (t && !translation) translation = t;
    } else {
      nonTranslationLines.push(line);
    }
  }
  if (translationLines.length === 0 && translation) {
    mainContent = nonTranslationLines.join("\n");
  }

  // Extract correction lines into separate meta
  const cleanLines: string[] = [];
  for (const line of mainContent.split("\n")) {
    if (line.trim().startsWith("Correction:")) {
      const c = line.replace(/^Correction:\s*/i, "").trim();
      if (c) corrections.push(c);
    } else {
      cleanLines.push(line);
    }
  }

  // Strip leftover emojis from mainContent
  mainContent = cleanLines.join("\n")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, "")
    .trim();

  return { mainContent, translation, transliteration, suggestions, corrections };
}

export function getSpeakableText(content: string): string {
  const { mainContent } = parseAssistantMessage(content);
  return mainContent;
}
