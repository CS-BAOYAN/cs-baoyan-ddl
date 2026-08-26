/**
 * Runtime LLM extraction: call mimo API to extract camp info from school pages.
 * Uses OpenAI-compatible chat completions format.
 */

const DEFAULT_BASE_URL = 'https://token-plan-cn.xiaomimimo.com/v1';
const DEFAULT_MODEL = 'mimo-v2.5-pro';

export interface ExtractorConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface ExtractResult {
  schoolKey: string;
  data: import('./types').SchoolExtended | null;
  error?: string;
}

export interface ExtractProgress {
  total: number;
  done: number;
  current: string;
  results: ExtractResult[];
}

/* ── Default config (stored in localStorage) ── */

const CONFIG_KEY = 'cs-baoyan-ddl-extractor-config';

export function loadConfig(): ExtractorConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { baseUrl: DEFAULT_BASE_URL, model: DEFAULT_MODEL, apiKey: '' };
}

export function saveConfig(config: ExtractorConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/* ── Fetch page content via multiple CORS proxies ── */

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchPageText(url: string): Promise<string> {
  // Try each proxy in order
  for (const makeUrl of CORS_PROXIES) {
    try {
      const resp = await fetch(makeUrl(url), { signal: AbortSignal.timeout(20000) });
      if (resp.ok) {
        const html = await resp.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 15000);
        if (text.length > 100) return text;
      }
    } catch {}
  }

  // Fallback: direct fetch (might work for CORS-enabled sites)
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (resp.ok) {
      const html = await resp.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000);
      if (text.length > 100) return text;
    }
  } catch {}

  return '';
}

/* ── Call LLM API — send page content text ── */

async function callLLM(
  config: ExtractorConfig,
  schoolName: string,
  institute: string,
  pageText: string,
): Promise<import('./types').SchoolExtended | null> {
  if (!pageText || pageText.length < 50) return null;

  const prompt = `从以下"${schoolName} ${institute}"的夏令营/预推免通知中提取信息。

如果通知中提到了活动时间（如"活动时间：7月15日-7月20日"、"举办时间"、"夏令营时间"等），提取为camp_start和camp_end。
如果只提到了报名/申请截止时间，也把它作为参考日期提取。
日期格式YYYY-MM-DD，没写年份的根据上下文推断。没有提到日期就填null。

只返回JSON，不要解释：
{
  "camp_start": "日期或null",
  "camp_end": "日期或null",
  "reimbursement": {"food_accommodation": null, "travel": null, "other": null},
  "other_notes": "其他重要信息或null"
}

通知正文：
${pageText}`;

  const resp = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`API error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from LLM');

  // Strip markdown code fences if present
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { ...parsed, last_verified: new Date().toISOString().slice(0, 10) };
  } catch {
    console.warn('LLM returned non-JSON:', cleaned.slice(0, 200));
    return null;
  }
}

/* ── Call LLM with URL directly (fallback when CORS proxy fails) ── */

async function callLLMWithUrl(
  config: ExtractorConfig,
  schoolName: string,
  institute: string,
  url: string,
): Promise<import('./types').SchoolExtended | null> {
  const prompt = `请访问以下URL，这是"${schoolName} ${institute}"的夏令营通知页面。
从页面中提取夏令营活动的开始和结束日期（camp_start, camp_end），以及报销信息。

如果页面中有活动时间、举办时间、夏令营时间等，提取为camp_start和camp_end。
日期格式YYYY-MM-DD。没有提到就填null。

只返回JSON：
{"camp_start":"日期或null","camp_end":"日期或null","reimbursement":{"food_accommodation":null,"travel":null,"other":null},"other_notes":"信息或null"}

URL: ${url}`;

  const resp = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`API error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response');

  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(cleaned);
    return { ...parsed, last_verified: new Date().toISOString().slice(0, 10) };
  } catch {
    // Model returned non-JSON (e.g. "I can't access this URL")
    console.warn('LLM returned non-JSON:', cleaned.slice(0, 200));
    return null;
  }
}

/* ── Extract single school ── */

export async function extractSingle(
  config: ExtractorConfig,
  schoolName: string,
  institute: string,
  website: string,
  manualText?: string,
): Promise<ExtractResult> {
  const key = `${schoolName}::${institute}`;
  try {
    // Use manually provided text if available
    let pageText = manualText?.trim() ?? '';

    // Otherwise try to fetch automatically
    if (!pageText) {
      if (!website || website === '_No response_') {
        return { schoolKey: key, data: null, error: '无官网链接' };
      }
      pageText = await fetchPageText(website);
    }

    if (!pageText || pageText.length < 50) {
      // CORS proxy failed — try sending URL directly to LLM
      // Some APIs can fetch URLs server-side
      try {
        const data = await callLLMWithUrl(config, schoolName, institute, website);
        return { schoolKey: key, data };
      } catch {
        return { schoolKey: key, data: null, error: 'CORS_LIMITED' };
      }
    }
    const data = await callLLM(config, schoolName, institute, pageText);
    return { schoolKey: key, data };
  } catch (e) {
    return { schoolKey: key, data: null, error: (e as Error).message };
  }
}

/* ── Batch extract ── */

export interface SchoolInput {
  name: string;
  institute: string;
  website: string;
  manualText?: string;
}

export async function extractBatch(
  config: ExtractorConfig,
  schools: SchoolInput[],
  onProgress: (p: ExtractProgress) => void,
  abortSignal?: AbortSignal,
): Promise<ExtractResult[]> {
  const results: ExtractResult[] = [];
  const total = schools.length;

  for (let i = 0; i < schools.length; i++) {
    if (abortSignal?.aborted) break;

    const s = schools[i];
    onProgress({ total, done: i, current: `${s.name} · ${s.institute}`, results: [...results] });

    const result = await extractSingle(config, s.name, s.institute, s.website, s.manualText);
    results.push(result);

    // Rate limit: 1.5s between requests
    if (i < schools.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  onProgress({ total, done: total, current: '', results });
  return results;
}
