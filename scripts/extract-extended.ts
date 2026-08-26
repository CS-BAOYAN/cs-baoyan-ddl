/**
 * Build-time script: extract extended camp info (dates, reimbursement) from
 * school notification pages using an LLM API.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... tsx scripts/extract-extended.ts
 *
 * Reads:  src/data/schools.json (existing), src/data/extended.json (if exists)
 * Writes: src/data/extended.json
 *
 * Only processes entries that don't already have data in extended.json,
 * or whose last_verified is older than 30 days.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCHOOLS_PATH = resolve(ROOT, 'src/data/schools.json');
const EXTENDED_PATH = resolve(ROOT, 'src/data/extended.json');

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

/* ── Types ── */

interface School {
  name: string;
  institute: string;
  description: string;
  deadline: string;
  website: string;
  tags: string[];
  province?: string;
}

interface SchoolExtended {
  camp_start?: string;
  camp_end?: string;
  reimbursement?: {
    food_accommodation: boolean | null;
    travel?: string;
    other?: string;
  };
  other_notes?: string;
  last_verified?: string;
}

type ExtendedData = Record<string, Record<string, SchoolExtended>>;

/* ── Helpers ── */

function schoolKey(name: string, institute: string): string {
  return `${name}::${institute}`;
}

function isStale(lastVerified?: string): boolean {
  if (!lastVerified) return true;
  const verified = new Date(lastVerified).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - verified > thirtyDays;
}

async function fetchPage(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 CS-BAOYAN-DDL-Extractor/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return '';
    const html = await resp.text();
    // Strip HTML tags for cleaner LLM input, keep text content
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);
  } catch {
    return '';
  }
}

async function extractWithLLM(
  schoolName: string,
  institute: string,
  pageText: string,
): Promise<SchoolExtended | null> {
  if (!pageText || pageText.length < 50) return null;

  const prompt = `从以下"${schoolName} ${institute}"夏令营/预推免通知正文中提取结构化信息。
如果某项信息文中未提及，对应字段填 null。日期格式用 ISO 8601 (YYYY-MM-DD)。

返回 JSON 格式：
{
  "camp_start": "开营日期",
  "camp_end": "结束日期",
  "reimbursement": {
    "food_accommodation": true/false/null,
    "travel": "路费报销说明",
    "other": "其他福利"
  },
  "other_notes": "其他重要信息（材料要求等）"
}

正文：
${pageText}`;

  try {
    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      console.error(`  LLM API error: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      last_verified: new Date().toISOString().slice(0, 10),
    };
  } catch (e) {
    console.error(`  LLM call failed:`, (e as Error).message);
    return null;
  }
}

/* ── Main ── */

async function main() {
  if (!API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    console.error('Usage: OPENAI_API_KEY=sk-... tsx scripts/extract-extended.ts');
    process.exit(1);
  }

  // Load existing data
  const schools = JSON.parse(readFileSync(SCHOOLS_PATH, 'utf8')) as Record<string, School[]>;
  const extended: ExtendedData = existsSync(EXTENDED_PATH)
    ? JSON.parse(readFileSync(EXTENDED_PATH, 'utf8'))
    : {};

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const [source, entries] of Object.entries(schools)) {
    if (!extended[source]) extended[source] = {};

    for (const school of entries) {
      const key = schoolKey(school.name, school.institute);
      const existing = extended[source][key];

      // Skip if recently verified
      if (existing && !isStale(existing.last_verified)) {
        skipped++;
        continue;
      }

      // Skip if no website
      if (!school.website || school.website === '_No response_') {
        skipped++;
        continue;
      }

      console.log(`[${source}] Processing: ${school.name} · ${school.institute}`);

      const pageText = await fetchPage(school.website);
      const extracted = await extractWithLLM(school.name, school.institute, pageText);

      if (extracted) {
        extended[source][key] = extracted;
        processed++;
        console.log(`  ✓ Extracted: camp ${extracted.camp_start} → ${extracted.camp_end}`);
      } else {
        failed++;
        console.log(`  ✗ No data extracted`);
      }

      // Rate limit: 1 request per second
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Write back
  writeFileSync(EXTENDED_PATH, JSON.stringify(extended, null, 2));
  console.log(`\nDone: ${processed} extracted, ${skipped} skipped, ${failed} failed`);
  console.log(`Output: ${EXTENDED_PATH}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
