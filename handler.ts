import { readFileSync } from 'node:fs';
import type { StartTaskMessage, TaskContext, HandlerResult } from '@blocks-network/sdk';

type CleanerInput = {
  text: string;
};

const promptText = readFileSync(new URL('./ai-copy-cleaner.md', import.meta.url), 'utf8');

const phraseReplacements: Array<[RegExp, string]> = [
  [/\bin today's (?:fast-paced|digital|ever-changing) world,?\s*/gi, ''],
  [/\bnow more than ever,?\s*/gi, ''],
  [/\bit'?s important to (?:note|remember) that\s*/gi, ''],
  [/\bit'?s worth noting that\s*/gi, ''],
  [/\bit goes without saying that\s*/gi, ''],
  [/\bat its core,?\s*/gi, ''],
  [/\bat the end of the day,?\s*/gi, ''],
  [/\bthat being said,?\s*/gi, ''],
  [/\barguably,?\s*/gi, ''],
  [/\bthe future of ([A-Za-z0-9 _-]+)/gi, '$1'],
  [/\b([A-Za-z0-9 _-]+), reimagined\b/gi, '$1'],
  [/\breimagine ([A-Za-z0-9 _-]+)/gi, 'change $1'],
  [/\bexciting to share,?\s*/gi, ''],
  [/\bthrilled to announce,?\s*/gi, ''],
  [/\btoday, we'?re excited to (?:share\s+)?/gi, ''],
  [/\bthe AI understands your intent\b/gi, 'the system uses your input'],
  [/\bunlock the power of\b/gi, 'use'],
  [/\bunleash the power of\b/gi, 'use'],
  [/\bmay potentially be able to help\b/gi, 'can help'],
  [/\bmay potentially\b/gi, 'may'],
  [/\bpotentially be able to\b/gi, 'can'],
  [/\bbe able to\b/gi, 'can'],
  [/\bprovides the ability to\b/gi, 'lets you'],
  [/\ballows users to\b/gi, 'lets users'],
  [/\benables users to\b/gi, 'lets users'],
  [/\benables teams to\b/gi, 'helps teams'],
  [/\bthe implementation of\b/gi, ''],
  [/\bthe utilization of\b/gi, 'using'],
  [/\benables the reduction of\b/gi, 'reduces'],
  [/\breduction of\b/gi, 'cuts'],
];

const wordReplacements: Array<[RegExp, string]> = [
  [/\bdelve(?:s|d|ing)? into\b/gi, 'look at'],
  [/\bdelve(?:s|d|ing)?\b/gi, 'examine'],
  [/\bleverage[sd]?|leveraging\b/gi, 'use'],
  [/\butilize[sd]?|utilizing\b/gi, 'use'],
  [/\bharness(?:es|ed|ing)?\b/gi, 'use'],
  [/\bstreamline[sd]?|streamlining\b/gi, 'simplify'],
  [/\belevate[sd]?|elevating\b/gi, 'improve'],
  [/\bfoster(?:s|ed|ing)?\b/gi, 'build'],
  [/\bunlock(?:s|ed|ing)?\b/gi, 'use'],
  [/\bunleash(?:es|ed|ing)?\b/gi, 'use'],
  [/\bsupercharge[sd]?|supercharging\b/gi, 'improve'],
  [/\bempower(?:s|ed|ing)?\b/gi, 'help'],
  [/\bdive deep\b/gi, 'look closely'],
  [/\bunpack(?:s|ed|ing)?\b/gi, 'explain'],
  [/\bpivotal\b/gi, 'important'],
  [/\brobust\b/gi, 'strong'],
  [/\binnovative\b/gi, ''],
  [/\bseamless(?:ly)?\b/gi, ''],
  [/\bcutting-edge\b/gi, ''],
  [/\bcomprehensive\b/gi, ''],
  [/\bgame-changing\b/gi, ''],
  [/\brevolutionary\b/gi, ''],
  [/\btransformative\b/gi, ''],
  [/\bgroundbreaking\b/gi, ''],
  [/\bnext-generation\b/gi, ''],
  [/\benterprise-grade\b/gi, ''],
  [/\blandscape\b/gi, 'field'],
  [/\brealm\b/gi, 'area'],
  [/\btapestry\b/gi, 'mix'],
  [/\bsynergy\b/gi, 'fit'],
  [/\btestament\b/gi, 'proof'],
  [/\bunderpinnings\b/gi, 'details'],
  [/\bintelligent\b/gi, ''],
  [/\bsmart(?:er|est)?\b/gi, 'better'],
  [/\beffortless(?:ly)?\b/gi, ''],
  [/\bintuitive(?:ly)?\b/gi, ''],
];

export default async function handler(
  task: StartTaskMessage,
  ctx?: TaskContext,
): Promise<HandlerResult> {
  const input = readInput(task);

  ctx?.reportStatus(`Loaded ${ruleCount()} copy-cleaning rules from ai-copy-cleaner.md.`);
  ctx?.reportStatus('Cleaning copy...');

  const cleaned = cleanCopy(input.text);

  ctx?.reportStatus('Copy cleaned.');

  return {
    artifacts: [{
      data: cleaned,
      mimeType: 'text/plain',
      fileName: 'cleaned-copy.txt',
      outputId: 'result',
    }],
  };
}

function readInput(task: StartTaskMessage): CleanerInput {
  const part = task.requestParts?.[0] as unknown;
  const parsed = parsePart(part);

  if (typeof parsed === 'string') {
    return { text: parsed };
  }

  if (isRecord(parsed)) {
    return { text: readString(parsed.text, '') };
  }

  return { text: '' };
}

function parsePart(part: unknown): unknown {
  if (isRecord(part)) {
    if (typeof part.text === 'string') return parseMaybeJson(part.text);
    if ('data' in part) return parseMaybeJson(part.data);
  }

  return parseMaybeJson(part);
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function cleanCopy(text: string): string {
  const original = text.trim();
  if (!original) return '';

  const cleaned = pipe(
    original,
    normalizeText,
    sentenceCaseMarkdownHeadings,
    removeFormulaicTransitions,
    rewriteGerundBullets,
    applyPhraseReplacements,
    applyWordReplacements,
    fixMechanicalGrammar,
    rewriteVagueThisSubjects,
    cleanPunctuation,
    trimParagraphs,
    capitalizeSentences,
  );

  return cleaned || original;
}

function normalizeText(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s*[\u2014]\s*/g, '. ')
    .replace(/\s*[\u2013]\s*/g, ' - ');
}

function sentenceCaseMarkdownHeadings(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(/^(#{1,6}\s+)(.+)$/);
      if (!match) return line;

      return `${match[1]}${toSentenceCase(match[2])}`;
    })
    .join('\n');
}

function removeFormulaicTransitions(text: string): string {
  const transition = '(Furthermore|Moreover|Consequently|Notably|Importantly|Thus|In conclusion|To summarize|In summary)';

  return text
    .replace(new RegExp(`(^|\\n)\\s*${transition},?\\s+`, 'gi'), '$1')
    .replace(new RegExp(`([.!?]\\s+)${transition},?\\s+`, 'gi'), '$1');
}

function rewriteGerundBullets(text: string): string {
  return text
    .split('\n')
    .map((line) => line
      .replace(/^(\s*[-*]\s+)Enabling\s+/i, '$1Helps ')
      .replace(/^(\s*[-*]\s+)Allowing\s+/i, '$1Lets ')
      .replace(/^(\s*\d+\.\s+)Enabling\s+/i, '$1Helps ')
      .replace(/^(\s*\d+\.\s+)Allowing\s+/i, '$1Lets '))
    .join('\n');
}

function applyPhraseReplacements(text: string): string {
  return phraseReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  );
}

function applyWordReplacements(text: string): string {
  return wordReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  );
}

function rewriteVagueThisSubjects(text: string): string {
  return text
    .replace(/(^|[.!?]\s+)[Tt]his allows\b/g, '$1The change lets')
    .replace(/(^|[.!?]\s+)[Tt]his enables\b/g, '$1The change lets')
    .replace(/(^|[.!?]\s+)[Tt]his lets users\b/g, '$1Users')
    .replace(/(^|[.!?]\s+)[Tt]his creates\b/g, '$1The change creates')
    .replace(/(^|[.!?]\s+)[Tt]his means\b/g, '$1The result means')
    .replace(/(^|[.!?]\s+)[Tt]his helps\b/g, '$1The change helps');
}

function fixMechanicalGrammar(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\bhelp ([a-z]+s?) to\b/gi, 'helps $1')
    .replace(/\bhelps ([a-z]+s?) to\b/gi, 'helps $1')
    .replace(/\blets ([a-z]+s?) to\b/gi, 'lets $1')
    .replace(/\bplatform that helps\b/gi, 'platform helps')
    .replace(/\btool that helps\b/gi, 'tool helps')
    .replace(/\bservice that helps\b/gi, 'service helps')
    .replace(/\bapp that helps\b/gi, 'app helps')
    .replace(/\b(platform|tool|service|app) that help\b/gi, '$1 helps')
    .replace(/\b(platform|tool|service|app) that helps\b/gi, '$1 helps')
    .replace(/\b(platform|tool|service|app) that lets\b/gi, '$1 lets')
    .replace(/\buse the power of\b/gi, 'use');
}

function cleanPunctuation(text: string): string {
  return text
    .replace(/!+/g, '.')
    .replace(/\?+/g, '.')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([.!?])([A-Za-z#])/g, '$1 $2')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .replace(/\.{2,}/g, '.');
}

function trimParagraphs(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function capitalizeSentences(text: string): string {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, letter: string) => {
    return `${prefix}${letter.toUpperCase()}`;
  });
}

function toSentenceCase(text: string): string {
  const wordsToKeep = new Set(['AI', 'API', 'HTTP', 'JSON', 'LLM', 'SDK', 'SQL', 'UI', 'URL', 'UX']);
  const lowered = text.toLowerCase().replace(/\b(ai|api|http|json|llm|sdk|sql|ui|url|ux)\b/gi, (match) => {
    return wordsToKeep.has(match.toUpperCase()) ? match.toUpperCase() : match;
  });

  return lowered.replace(/[a-z]/, (letter) => letter.toUpperCase());
}

function pipe(value: string, ...transforms: Array<(input: string) => string>): string {
  return transforms.reduce((current, transform) => transform(current), value);
}

function ruleCount(): number {
  const promptSections = ['Red flag patterns', 'Structural patterns to fix', 'Formatting rules'];
  const sectionCount = promptSections.filter((section) => promptText.includes(section)).length;

  return phraseReplacements.length + wordReplacements.length + sectionCount;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
