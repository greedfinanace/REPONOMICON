import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Simple in-memory rate limiter (resets on server restart)
// In production, use Redis or similar for persistence
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  // Skip rate limiting in development
  if (!IS_PRODUCTION) {
    return { allowed: true, remaining: RATE_LIMIT };
  }

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

interface ReponomIconRequest {
  url: string;
  query?: string;
  messages?: Array<{ role: string; content: string }>;
  checkMalicious?: boolean;
}

// Fetch repository contents directly from GitHub API
async function fetchRepoContents(repoUrl: string): Promise<{ files: Array<{ name: string; content: string }>; error?: string }> {
  try {
    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return { files: [], error: "Invalid GitHub URL" };
    
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");
    
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Reponomicon",
    };
    
    if (GITHUB_TOKEN && GITHUB_TOKEN !== "ghp_your-github-token-here") {
      headers["Authorization"] = `token ${GITHUB_TOKEN}`;
    }

    // Get repo tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/HEAD?recursive=1`,
      { headers }
    );

    if (!treeResponse.ok) {
      return { files: [], error: `GitHub API error: ${treeResponse.status}` };
    }

    const treeData = await treeResponse.json();
    
    // Filter for code files
    const codeExtensions = [".js", ".ts", ".tsx", ".jsx", ".py", ".java", ".go", ".rs", ".c", ".cpp", ".h", ".cs", ".rb", ".php", ".swift", ".kt", ".vue", ".svelte"];
    const codeFiles = treeData.tree
      .filter((item: any) => 
        item.type === "blob" && 
        codeExtensions.some(ext => item.path.endsWith(ext)) &&
        !item.path.includes("node_modules") &&
        !item.path.includes(".min.") &&
        item.size < 100000 // Skip files > 100KB
      )
      .slice(0, 20); // Limit to 20 files

    // Fetch file contents
    const files: Array<{ name: string; content: string }> = [];
    
    for (const file of codeFiles.slice(0, 10)) { // Fetch max 10 files
      try {
        const contentResponse = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${file.path}`,
          { headers }
        );
        
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          if (contentData.content) {
            const decoded = Buffer.from(contentData.content, "base64").toString("utf-8");
            files.push({ name: file.path, content: decoded.slice(0, 5000) }); // Limit content size
          }
        }
      } catch (e) {
        console.error(`Failed to fetch ${file.path}`);
      }
    }

    return { files };
  } catch (error) {
    console.error("GitHub fetch error:", error);
    return { files: [], error: "Failed to fetch repository" };
  }
}

// Call OpenRouter for analysis
async function analyzeWithAI(
  query: string,
  files: Array<{ name: string; content: string }>,
  repoUrl: string,
  checkMalicious: boolean = false
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  // Build context from files
  const codeContext = files
    .map((f, i) => `[${f.name}]:\n\`\`\`\n${f.content.slice(0, 2000)}\n\`\`\``)
    .join("\n\n");

  let systemPrompt: string;
  let userPrompt: string;

  if (checkMalicious) {
    systemPrompt = `You are a security expert analyzing code for malicious patterns that could harm END USERS (not developers).

Look for these RED FLAGS:
🚨 CRITICAL (Definitely Malicious):
- Cryptocurrency miners running in browser
- Keyloggers or input capture sending data externally
- Credential/password stealing code
- Backdoors or remote code execution
- Data exfiltration to unknown servers
- Malicious redirects or phishing attempts
- Hidden iframes loading external malicious content
- Obfuscated code that decodes to malicious payloads

⚠️ SUSPICIOUS (Needs Review):
- Excessive permissions requests
- Tracking/fingerprinting beyond normal analytics
- Unclear data collection practices
- Connections to suspicious domains
- Eval() with user input
- Dynamic script injection

✅ SAFE patterns to IGNORE:
- Normal API calls to known services
- Standard authentication flows
- Regular analytics (Google Analytics, etc.)
- Normal form submissions
- Standard npm packages

FORMAT YOUR RESPONSE:
## Security Scan Results

### Risk Level: [SAFE / LOW / MEDIUM / HIGH / CRITICAL]

### Findings:
[List each finding with file name and line if possible]

### Recommendation:
[What the user should do]`;

    userPrompt = `Scan this repository for malicious code that could harm end users:

Repository: ${repoUrl}

Code to analyze:
${codeContext}

Focus ONLY on code that could harm the END USER (browser exploits, data theft, etc). Ignore normal development patterns.`;
  } else {
    systemPrompt = `You are a friendly coding teacher who explains code to beginners. Your job is to break down code so a 12-year-old could understand it.

RULES:
- Use SIMPLE words. No jargon.
- Explain what each part DOES, not what it IS
- Use analogies (like "this is like a recipe" or "think of it as a to-do list")
- Break things into small bullet points
- Be direct and helpful
- Show code snippets with explanations

FORMAT:
## What This Code Does
[1-2 sentence summary]

## How It Works
- Step 1: ...
- Step 2: ...

## Key Files
[Brief explanation of important files]`;

    userPrompt = `Repository: ${repoUrl}

Code from this project:
${codeContext || "No code files found."}

Question: ${query}

Explain in simple terms.`;
  }

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
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Analysis failed.";
}

export async function POST(request: Request) {
  try {
    // Rate limiting (production only)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const { allowed, remaining } = checkRateLimit(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute before trying again." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT.toString(),
            "X-RateLimit-Remaining": "0",
          }
        }
      );
    }

    const body: ReponomIconRequest = await request.json();
    const { url, query, messages = [], checkMalicious = false } = body;

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid repository URL" },
        { status: 400 }
      );
    }

    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+/;
    if (!githubUrlPattern.test(url)) {
      return NextResponse.json(
        { error: "Please enter a valid GitHub repository URL" },
        { status: 400 }
      );
    }

    const userQuestion = query || messages[messages.length - 1]?.content || "Analyze this repository";

    // Fetch repo contents from GitHub
    console.log("📦 Fetching repository:", url);
    const { files, error } = await fetchRepoContents(url);
    
    if (error) {
      return NextResponse.json({
        id: crypto.randomUUID(),
        role: "reponomicon",
        content: `⚠️ ${error}`,
        citations: [],
      });
    }

    if (files.length === 0) {
      return NextResponse.json({
        id: crypto.randomUUID(),
        role: "reponomicon",
        content: "No code files found in this repository.",
        citations: [],
      });
    }

    console.log("📚 Found", files.length, "code files");

    // Analyze with AI
    const aiResponse = await analyzeWithAI(userQuestion, files, url, checkMalicious);

    return NextResponse.json({
      id: crypto.randomUUID(),
      role: "reponomicon",
      content: aiResponse,
      citations: files.map(f => f.name).slice(0, 6),
      filesAnalyzed: files.length,
    });
  } catch (error: any) {
    console.error("Reponomicon API error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
