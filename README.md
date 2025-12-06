# 🧙‍♂️ Reponomicon

> *"That is not dead which can eternal lie, and with strange aeons even code may die."*

A GitHub repository analyzer that uses AI to provide intelligent code explanations. Built with a spooky eldritch theme for **Kiroween 2025 Hackathon**.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Kiro Powered](https://img.shields.io/badge/Built%20with-Kiro-purple)](https://kiro.ai)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/reponomicon)

## 🎃 Overview

Reponomicon ingests GitHub repositories, analyzes code structure, and provides LLM-powered Q&A with beginner-friendly explanations. Features include malicious code detection, repository comparison, and a hauntingly beautiful UI.

### ✨ Key Features

- 🔮 **GitHub Repository Analysis** - Fetches and analyzes code directly from GitHub API
- 🧠 **LLM-Powered Q&A** - Natural language queries with beginner-friendly explanations via OpenRouter
- 🛡️ **Malicious Code Detection** - Scans for security threats and suspicious patterns
- 💡 **Code Improvement Suggestions** - Get actionable tips to improve code quality
- 🔄 **Compare Mode** - Side-by-side comparison of two repositories
- 💾 **Chat History** - Sessions saved to localStorage for later reference
- 📤 **Export & Share** - Download conversations or share via link
- 👻 **Animated Ghost** - Spooky ghost with cursor-tracking eyes that watches you type
- 🎨 **Eldritch UI** - Dark theme with purple glow effects and fog animations

## 🏆 Hackathon Categories

- **Frankenstein** (Primary) - Combines GitHub API + OpenRouter LLM + Next.js into a unified code analysis platform
- **Costume Contest** (Bonus) - Spooky eldritch theme with animated ghost, fog effects, and mystical UI


## 🛠️ How I Used Kiro

This project was built entirely using Kiro's AI-powered development features. Here's how each feature contributed:

### 💬 Vibe Coding & Chat Iterations

Kiro's chat interface was instrumental throughout development:

- **Architecture Decisions**: Started by discussing the best approach for a GitHub analyzer - Kiro suggested using the GitHub API directly instead of cloning repos, which simplified deployment
- **Component Design**: Iteratively refined the ghost animation - from static SVG to cursor-tracking eyes that look at the search bar when typing
- **Bug Fixing**: When hitting GitHub API rate limits (403 errors), Kiro immediately identified the issue and suggested adding a GitHub token
- **UI Polish**: Refined the button layout through conversation - moved action buttons from top-right (overlapping content) to bottom-right vertical stack

**Key Prompts Used:**
- "Make the ghost look at the search bar when the user is typing"
- "The buttons are overlapping the text, move them to bottom right"
- "Add a security scan button that checks for malicious code"
- "Check why I'm getting GitHub API error 403"

### 🪝 Agent Hooks Automation

Six agent hooks automate quality checks throughout development:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `on-file-save.json` | Save .ts/.tsx files | Checks TypeScript errors, naming conventions, removes console.logs |
| `on-commit.json` | Save code files | Pre-commit validation for linting and type errors |
| `on-error.json` | Log file updates | Analyzes runtime errors and suggests fixes |
| `on-test-run.json` | Save test files | Automatically runs pytest when tests change |
| `security-scan.json` | Save code files | Scans for SQL injection, XSS, hardcoded secrets |
| `spell-check.json` | Save .md files | Reviews documentation for spelling and clarity |

### 📋 Spec-Driven Development

Two comprehensive specs guided the implementation:

**`/.kiro/specs/reponomicon/`**
- `requirements.md` - User stories with EARS-syntax acceptance criteria
- `design.md` - Architecture diagrams and component breakdown
- `tasks.md` - Sequenced implementation tasks

**Key Requirements Documented:**
1. Repository Analysis - Clone, parse, embed, and query
2. Compare Repositories - Side-by-side analysis
3. Chat History - localStorage persistence
4. Export & Share - Download and link sharing

### 🎯 Steering Strategies

Three steering documents enforce consistency:

**`architecture-rules.md`**
- Service boundaries (Frontend vs Python service)
- Communication patterns (JSON over HTTP)
- Error handling standards

**`coding-standards.md`**
- TypeScript strict mode enforcement
- Naming conventions (kebab-case files, PascalCase components)
- Python PEP 8 compliance

**`testing-requirements.md`**
- Property-based testing with Hypothesis (100+ iterations)
- Unit test coverage targets (70%)
- Test tagging conventions for traceability

### 🔌 MCP Integration

The project uses MCP for enhanced capabilities:
- **OpenRouter API** - LLM access for code analysis and explanations
- **GitHub API** - Repository content fetching with rate limit handling


## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 Application                    │
│              TypeScript + Tailwind + Framer Motion          │
│              Spooky eldritch theme UI                       │
├─────────────────────────────────────────────────────────────┤
│  /app/page.tsx          - Main chat interface               │
│  /app/api/reponomicon/  - API routes for repo analysis      │
│  /src/components/       - Eldritch UI components            │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
         OpenRouter API (DeepSeek LLM)
         GitHub API (Repository fetching)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))
- GitHub token (optional, for higher rate limits)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/reponomicon.git
cd reponomicon

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/reponomicon)

Set these environment variables in Vercel:
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `GITHUB_TOKEN` - Your GitHub personal access token (optional)

## 📖 Usage

### 1. Analyze a Repository
Enter a GitHub URL like `https://github.com/facebook/react` and click **SUMMON**

### 2. Ask Questions
After analysis, use the chat to ask questions about the code

### 3. Security Scan
Click **🛡️ Security** to scan for malicious code patterns

### 4. Get Improvements
Click **💡 Improve** for code quality suggestions

### 5. Compare Repos
Enable **⚔️ Compare** mode to analyze two repositories side-by-side

## 🎨 UI Components

| Component | Description |
|-----------|-------------|
| `FogLayout` | Animated fog background with purple glow |
| `RuneInput` | Mystical input with ghost that tracks your cursor |
| `ChatGrimoire` | Message display with markdown rendering |
| `GhostLoader` | Full-screen loading animation |

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | API key for OpenRouter LLM |
| `GITHUB_TOKEN` | No | GitHub token (increases rate limit from 60 to 5000/hr) |


## 📁 Project Structure

```
reponomicon/
├── app/
│   ├── api/
│   │   └── reponomicon/
│   │       ├── route.ts           # Main analysis API
│   │       └── compare/route.ts   # Comparison API
│   ├── globals.css                # Styles + Ghostbum font
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page
├── src/
│   ├── components/eldritch/       # Spooky UI components
│   │   ├── FogLayout.tsx
│   │   ├── RuneInput.tsx
│   │   ├── ChatGrimoire.tsx
│   │   └── GhostLoader.tsx
│   └── lib/utils.ts
├── public/
│   ├── ghost-loading.webm        # Ghost animation
│   ├── Ghostbum (DEMO).ttf       # Custom font
│   └── *.svg                     # Icons
├── .kiro/
│   ├── specs/                    # Feature specifications
│   │   └── reponomicon/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   ├── steering/                 # AI behavior rules
│   │   ├── architecture-rules.md
│   │   ├── coding-standards.md
│   │   └── testing-requirements.md
│   └── hooks/                    # Agent automation
│       ├── on-file-save.json
│       ├── on-commit.json
│       ├── on-error.json
│       ├── on-test-run.json
│       ├── security-scan.json
│       └── spell-check.json
└── package.json
```

## 👥 Team

- **Ra** - Backend & API Architecture
- **Nihas** - Frontend & UI/UX Design  
- **Shazeen** - Documentation & Demo

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Kiro IDE](https://kiro.ai) using spec-driven development
- [OpenRouter](https://openrouter.ai) for LLM access
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Tailwind CSS](https://tailwindcss.com) for styling
- Custom Ghostbum font for spooky typography

---

*Built for Kiroween 2025 Hackathon 🎃*
**Live App:** [Coming Soon]
