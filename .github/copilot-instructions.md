# 📘 Technical Documentation Outline – SEO SaaS for Digital Agencies

## 1. 🧭 Introduction

### 1.1 Project Overview & Goals

- Build a subscription-based, all-in-one SEO platform tailored for digital agencies using **Context7 MCP** for the project.
- Leverage **MCP servers** (Prisma MCP, Shadcn UI MCP, Context7 MCP) for optimized code generation, modularity, and enhanced knowledge base integration.
- Only use libraries compatible with **Next.js 14** and the **App Router**.
- Provide a user-friendly interface for SEO professionals to manage multiple clients and projects efficiently.
- Integrate with popular SEO tools (Google Search Console, Google Analytics) for seamless data access.
- Offer AI-driven insights and recommendations to enhance SEO strategies using **Gemini 1.5 flash**.
- Ensure a scalable architecture to accommodate future growth and feature expansion.
- Focus on performance, security, and user experience to maintain a competitive edge in the market.
- Provide a robust API for third-party integrations and custom solutions.
- Implement a subscription model with tiered pricing based on features and usage.
- Streamline SEO workflows with integrated tools.
- Utilize AI for SEO assistance (content, audits, insights).
- Support multi-project, team-based collaboration for agencies.
- Enhance reporting features with customizable dashboards.
- Ensure data privacy and compliance with regulations (GDPR, CCPA).
- Provide comprehensive documentation and support for users.
- Implement a feedback loop for continuous improvement based on user input.
- Focus on performance and scalability to handle large datasets and multiple users.
- Ensure a responsive design for accessibility across devices.
- Use a modular architecture to allow for easy addition of new features and integrations.
- Ensure the platform is built with a focus on user experience, making it intuitive and easy to navigate.

### 1.4 GitHub Copilot Usage Guidelines & Prompts

**Core Principles:**

- **Adhere Strictly to Instructions:** Follow all guidelines in this document precisely.
- **Prioritize MCP Servers:** Leverage Context7, Prisma, and Shadcn UI MCP servers for optimized, modular, and context-aware code generation.
- **Maintain Consistency:** Ensure generated code aligns with existing project structure, naming conventions, and coding style (use Prettier/ESLint if configured).
- **Focus on Readability & Maintainability:** Generate clear, well-commented code. Apply DRY principles.
- **Verify & Fix:** After generating code, always check the terminal and VS Code 'Problems' tab for errors. Read and fix them immediately. Ensure the application runs correctly.
- **Remove Duplication:** Actively identify and refactor duplicated code blocks or logic.
- **Context Management (CRITICAL):**
  - **Before starting work** in any new chat session or on a new task, **READ** the `d:\Projects\Personal\seo-saas\.github\copilot-status.md` file thoroughly to understand the last completed task, current progress, and next steps.
  - **After completing a significant task** or **before ending a chat session**, **UPDATE** the `d:\Projects\Personal\seo-saas\.github\copilot-status.md` file with the details of the completed work, the status of any ongoing work, and any relevant notes or blockers.

**Reference Documentation:**

- **Authentication Documentation**: Refer to the following files for authentication implementation details:
  - `.vscode/docs/nextjsDocs.md` - Next.js authentication best practices and examples
  - `.vscode/docs/nextauthDocs.md` - NextAuth.js integration with Next.js App Router

**Specific Prompts & Areas of Focus:**

1.  **Context Check & Update**:

    - "Read the `copilot-status.md` file and summarize the current project status and the next task."
    - "Update the `copilot-status.md` file: Last completed task was [Task Description]. Current task is [Task Description] with status [Status]. Next tasks are [List Tasks]."

2.  **MCP Server Usage**:

    - "Generate code optimized for the Context7 MCP server context."
    - "Use the Prisma MCP server to generate a query for [specific data retrieval/mutation]."
    - "Leverage the Shadcn UI MCP server to create a [Component Name] component using [Specific Shadcn Primitives like Card, Button, Input] for [Purpose]."

3.  **Next.js 14 & App Router**:

    - "Ensure generated code is fully compatible with Next.js 14 and the App Router paradigm."
    - "Generate a Next.js App Router route segment for `/app/dashboard/organizations/[orgId]/projects/[projectId]/...` including layout and page files."
    - "Create a server component for [Purpose] using async/await for data fetching."
    - "Create a client component for [Purpose] using 'use client' and appropriate React hooks."

4.  **State Management (Redux Toolkit)**:

    - "Generate a Redux Toolkit slice for [Feature Name] state, including initial state, reducers using `createSlice`, and necessary actions."
    - "Implement `useAppSelector` to access [Specific State Slice] in [Component Name]."
    - "Implement `useAppDispatch` to dispatch [Action Name] in [Component Name]."

5.  **API Routes & Backend**:

    - "Generate a Next.js API route handler in `/app/api/...` for [HTTP Method] requests to `/api/[resource]`."
    - "Implement NextAuth session checking middleware for the API route."
    - "Use Prisma Client via the Prisma MCP server for database interaction within the API route."
    - "Ensure proper JSON request parsing and JSON response formatting with appropriate status codes."
    - "Implement robust error handling using try-catch blocks and return standardized error responses."

6.  **Database (Prisma & PostgreSQL)**:

    - "Generate Prisma schema modifications for [New Feature/Model]." (Use Prisma MCP)
    - "Write a Prisma query to [Specific Action, e.g., fetch projects for an organization with user details]." (Use Prisma MCP)
    - "Ensure all database interactions are type-safe using Prisma Client."

7.  **AI Integration (Gemini 1.5 Flash / OpenAI)**:

    - "Generate a function to call the Gemini 1.5 Flash API for [Specific Task, e.g., generating SEO content suggestions based on keywords]."
    - "Integrate the AI function into [Specific Workflow/Component] to provide insights."

8.  **Crawling (Crawlee.js)**:

    - "Generate a Crawlee.js task/actor to crawl [Target Site Aspect, e.g., sitemap, specific pages] for [Purpose, e.g., on-page analysis]."
    - "Implement logic to save crawl results to the PostgreSQL database using Prisma."

9.  **Testing (Jest, Playwright, MSW)**:

    - "Generate Jest unit tests for the utility function in `/lib/[functionName].ts`."
    - "Generate Playwright integration tests for the [User Flow, e.g., project creation] workflow."
    - "Set up MSW handlers to mock the `/api/[resource]` endpoint for testing."

10. **Security & Compliance**:

    - "Ensure user input is validated and sanitized before processing or storing."
    - "Use environment variables for all sensitive keys and secrets (e.g., API keys, database URL)."
    - "Implement rate limiting for critical API endpoints."
    - "Verify code aligns with GDPR/CCPA principles where applicable (e.g., data access, deletion)."

11. **Documentation & Comments**:

    - "Generate JSDoc comments for all functions, components, and complex logic blocks."
    - "Add inline comments to explain non-obvious code sections."

12. **Project Architecture & Structure**:
    - "Place the generated [Component/Hook/Lib/API] file in the correct directory (`/components`, `/hooks`, `/lib`, `/app/api`) according to the defined architecture."
    - "Ensure the implementation aligns with the overall system architecture and data flow."

### 1.2 Target Audience

- Primary: Digital marketing agencies.
- Secondary: Freelance SEO consultants, in-house SEO teams.

### 1.3 Scope

#### ✅ Initial Features

- Site auditing
- Rank tracking
- Keyword research
- On-page optimization suggestions
- Basic competitor analysis
- Reporting
- Google Search Console & Analytics integration

#### 🔜 Future Roadmap

- SEMrush, Ahrefs, and social analytics integrations
- Chatbot-style SEO assistant
- Enhanced competitor analysis
- eCommerce SEO modules

## 2. ⚙️ Tech Stack

| Technology                  | Purpose                    | Reasoning                                                             |
| --------------------------- | -------------------------- | --------------------------------------------------------------------- |
| **Next.js 14 (App Router)** | Frontend/Backend framework | Modern full-stack support, server-side rendering, App Router benefits |
| **NextAuth.js**             | Authentication & OAuth     | Handles email + OAuth logins with ease                                |
| **Prisma**                  | ORM                        | Type-safe, PostgreSQL-compatible, great dev experience                |
| **PostgreSQL**              | Database                   | Reliable relational DB, works well with Prisma                        |
| **Crawlee.js**              | Web crawling (audits)      | High-performance, headless crawling                                   |
| **Shadcn/ui**               | UI components              | Accessible, customizable React components                             |
| **Redux Toolkit**           | State management           | Scalable and industry-standard for React applications                 |
| **OpenAI API**              | AI services                | SEO insights, content suggestions                                     |
| **MCP Servers**             | Optimization & Modularity  | Use Context7 MCP, Prisma MCP, and Shadcn UI MCP for better workflows  |

## 3. 🏗️ System Architecture

### 3.1 High-Level Overview Diagram

```
[User] → [Next.js Frontend] → [API Routes]
                               ↓
                        [Prisma ORM] → [PostgreSQL DB]
                               ↓
     [Crawlee Workers] → [Reports / AI Tasks]
                               ↓
                   [External APIs: GSC, GA, OpenAI]
```

### 3.2 Frontend Architecture

- Folder structure:
  - `/app` (Next.js App Router)
  - `/components` (Shadcn UI)
  - `/hooks` (custom hooks with Redux)
  - `/lib` (utility functions)
- State Management: Redux Toolkit (global and feature slices)
- Routing: App Router, nested routes per organization/project
- Auth Wrapping: Session-aware layouts via NextAuth
- **Mandatory**: Use **Shadcn UI MCP server** for UI components.

### 3.3 Backend Architecture

- API Routes: `/api/` handlers (REST-style endpoints)
- Auth Middleware: NextAuth session checks
- Background Queue Trigger: Crawling, reports, AI actions
- **Mandatory**: Use **Prisma MCP server** for database operations.

### 3.4 Data Flow

- Frontend ⟷ API Routes ⟷ DB
- Crawlee runs jobs, results saved to DB
- Reports & AI tasks run asynchronously

### 3.5 Background Job Processing

- Job Types: `crawl-site`, `generate-report`, `ai-insights`
- Workers consume and process

## 4. 🗃️ Database Design

### 4.1 Choice

- **PostgreSQL** – reliable, scalable, excellent Prisma support.

### 4.2 Schema Design Philosophy

- Snake_case naming (`users`, `site_audits`)
- Explicit foreign keys, normalized design
- Enum usage for statuses, types

### 4.3 Key Tables (Partial Example)

- See full description in original prompt (Users, Organizations, Projects, etc.)

## 5. 🔍 Core Feature Implementation

- Authentication with NextAuth
- Crawlee-powered site audits
- Rank tracking and keyword management
- Google integrations
- AI-based insights

## 6. 🔌 API Design

- RESTful routes
- Auth protected
- JSON input/output

## 7. 🎨 Frontend Development

- Shadcn/ui components
- Redux Toolkit for state
- Accessible UI

## 8. 🚀 Deployment

- Hosted on Custom Server SiteGround
- PostgreSQL on Supabase or Render
- CI/CD with GitHub Actions

## 9. ✅ Testing

- Jest, Playwright
- MSW for API mocks

## 10. 🔐 Security

- HTTPS, input validation, encrypted secrets, rate limiting

## 11. 🌱 Future Considerations

- Scalability, Slack/email alerts, AI chatbot, WordPress/Shopify widgets
