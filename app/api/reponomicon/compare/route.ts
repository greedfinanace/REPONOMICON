import { NextResponse } from "next/server";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Rate limiter for compare endpoint
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Lower limit for compare (more expensive)
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean } {
  if (!IS_PRODUCTION) return { allowed: true };
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT) return { allowed: false };
  record.count++;
  return { allowed: true };
}

interface CompareRequest {
  repo1: string;
  repo2: string;
}

interface RAGResult {
  content: string;
  source: string;
  score: number;
}

async function ingestRepo(url: string): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || "Failed to ingest" };
    }
    const data = await response.json();
    return { success: true, files: data.files };
  } catch {
    return { success: false, error: "Failed to connect to parser" };
  }
}

async function queryRAG(query: string, repoUrl: string): Promise<RAGResult[]> {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, repo_url: repoUrl, k: 3 }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

function getRepoName(url: string): string {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  return match ? `${match[1]}/${match[2]}` : url;
}

export async function POST(request: Request) {
  try {
    // Rate limiting (production only)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute." },
        { status: 429 }
      );
    }

    const body: CompareRequest = await request.json();
    const { repo1, repo2 } = body;

    if (!repo1 || !repo2) {
      return NextResponse.json({ error: "Two repos required" }, { status: 400 });
    }

    // Ingest both repos
    console.log("📦 Ingesting repos for comparison...");
    const [ingest1, ingest2] = await Promise.all([
      ingestRepo(repo1),
      ingestRepo(repo2),
    ]);

    if (!ingest1.success || !ingest2.success) {
      return NextResponse.json({
        id: crypto.randomUUID(),
        role: "reponomicon",
        content: `Failed to analyze: ${ingest1.error || ingest2.error}`,
        citations: [],
      });
    }

    // Query both repos for their main functionality
    const [results1, results2] = await Promise.all([
      queryRAG("What is the main purpose and how does it work?", repo1),
      queryRAG("What is the main purpose and how does it work?", repo2),
    ]);

    // Build comparison context
    const repo1Name = getRepoName(repo1);
    const repo2Name = getRepoName(repo2);

    const context1 = results1.map((r, i) => 
      `[${repo1Name} - Code ${i + 1}]:\n\`\`\`\n${r.content.slice(0, 800)}\n\`\`\``
    ).join("\n\n");

    const context2 = results2.map((r, i) => 
      `[${repo2Name} - Code ${i + 1}]:\n\`\`\`\n${r.content.slice(0, 800)}\n\`\`\``
    ).join("\n\n");

    const systemPrompt = `You compare two GitHub repositories and explain the differences in simple terms a beginner can understand.

FORMAT YOUR RESPONSE LIKE THIS:

## Quick Summary
[1-2 sentences comparing both]

## Repo 1: ${repo1Name}
- Purpose: [what it does]
- Tech: [main technologies]
- Complexity: [simple/medium/complex]

## Repo 2: ${repo2Name}
- Purpose: [what it does]
- Tech: [main technologies]
- Complexity: [simple/medium/complex]

## Key Differences
| Aspect | ${repo1Name} | ${repo2Name} |
|--------|--------------|--------------|
| ... | ... | ... |

## Which Should You Use?
[Recommendation based on use case]

Be direct, use simple words, no jargon.`;

    const userPrompt = `Compare these two repositories:

REPO 1 (${repo1Name}):
Files: ${ingest1.files?.join(", ")}
${context1}

REPO 2 (${repo2Name}):
Files: ${ingest2.files?.join(", ")}
${context2}

Compare them in simple terms.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Reponomicon",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "Comparison failed.";

    const allCitations = [
      ...(ingest1.files || []).slice(0, 3),
      ...(ingest2.files || []).slice(0, 3),
    ];

    return NextResponse.json({
      id: crypto.randomUUID(),
      role: "reponomicon",
      content: aiResponse,
      citations: allCitations,
    });
  } catch (error: unknown) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: "Comparison failed" },
      { status: 500 }
    );
  }
}
