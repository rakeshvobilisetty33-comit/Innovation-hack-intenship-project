// Heuristic task generator (no AI SDK dependency).
// Always available; used as the default and as the fallback when the AI
// provider is unavailable or AI_ENABLED is not "true".

import type { Priority } from "@/lib/types";

export interface GeneratedTask {
  title: string;
  description: string;
  priority: Priority;
}

export interface GenerateTasksInput {
  prompt: string;
  count?: number;
  projectName?: string;
}

export function heuristicTasks(input: GenerateTasksInput): GeneratedTask[] {
  const p = input.prompt.toLowerCase();
  const isWeb = /web|website|app|saas|dashboard|platform|portal/.test(p);
  const isMobile = /mobile|ios|android|react native|flutter/.test(p);
  const isApi = /api|backend|service|microservice|server/.test(p);
  const isEcom = /ecommerce|e-commerce|shop|store|cart|checkout/.test(p);
  const isAi = /ai|machine learning|ml|llm|chatbot/.test(p);

  const base: { title: string; description: string; priority: Priority }[] = [];

  if (isEcom || isWeb) {
    base.push(
      { title: "Design homepage", description: "Create the landing page layout with hero, features and call-to-action.", priority: "high" },
      { title: "Build navigation", description: "Top nav with links, mobile menu and active states.", priority: "medium" },
      { title: "Create product listing", description: "Grid of products with images, price and quick add.", priority: "high" },
      { title: "Create product details page", description: "Gallery, description, variants and add-to-cart.", priority: "high" },
      { title: "Implement shopping cart", description: "Add/remove items, quantity, totals and persistence.", priority: "high" },
      { title: "Implement checkout", description: "Address, payment and order confirmation flow.", priority: "urgent" },
      { title: "Add authentication", description: "Register, login, protected routes and profile.", priority: "high" },
      { title: "Set up analytics", description: "Track page views and key conversion events.", priority: "low" },
      { title: "Write tests", description: "Unit and integration tests for critical flows.", priority: "medium" },
      { title: "Deploy application", description: "CI/CD pipeline and production deployment.", priority: "medium" },
    );
  } else if (isMobile) {
    base.push(
      { title: "Define app architecture", description: "Choose navigation, state management and folder structure.", priority: "high" },
      { title: "Build onboarding flow", description: "Welcome screens and permission requests.", priority: "medium" },
      { title: "Implement core screens", description: "Home, detail and profile screens with navigation.", priority: "high" },
      { title: "Add offline support", description: "Cache data and queue mutations offline.", priority: "medium" },
      { title: "Implement push notifications", description: "Register device and handle incoming notifications.", priority: "medium" },
      { title: "Add authentication", description: "Biometric + PIN login and token refresh.", priority: "high" },
      { title: "Write integration tests", description: "End-to-end tests for the main flows.", priority: "low" },
      { title: "Configure CI/CD", description: "Build pipeline and store submission.", priority: "medium" },
    );
  } else if (isApi) {
    base.push(
      { title: "Design data models", description: "Define entities, relationships and indexes.", priority: "high" },
      { title: "Set up project scaffolding", description: "Express/Fastify app, config, logging, error handling.", priority: "medium" },
      { title: "Implement authentication", description: "JWT issue/verify, password hashing, middleware.", priority: "high" },
      { title: "Build CRUD endpoints", description: "REST endpoints with validation and pagination.", priority: "high" },
      { title: "Add rate limiting", description: "Per-IP and per-user limits to protect the API.", priority: "medium" },
      { title: "Write integration tests", description: "Test all endpoints including auth and validation.", priority: "medium" },
      { title: "Set up CI/CD", description: "Automated tests and deploy pipeline.", priority: "low" },
      { title: "Document API", description: "OpenAPI/Swagger spec and usage examples.", priority: "medium" },
    );
  } else if (isAi) {
    base.push(
      { title: "Define problem & dataset", description: "Clarify the task, gather and label data.", priority: "high" },
      { title: "Build data pipeline", description: "Ingestion, cleaning, feature extraction.", priority: "high" },
      { title: "Train baseline model", description: "Simple model as a benchmark.", priority: "high" },
      { title: "Evaluate metrics", description: "Precision, recall, latency benchmarks.", priority: "medium" },
      { title: "Deploy inference endpoint", description: "Serve the model behind an API.", priority: "medium" },
      { title: "Add monitoring", description: "Drift, latency and quality dashboards.", priority: "low" },
      { title: "Write tests", description: "Unit tests for pipeline and model contract tests.", priority: "medium" },
      { title: "Document usage", description: "API and integration docs.", priority: "low" },
    );
  } else {
    base.push(
      { title: "Define scope & goals", description: "Clarify objectives, success metrics and constraints.", priority: "high" },
      { title: "Research & plan", description: "Investigate options and produce a high-level plan.", priority: "medium" },
      { title: "Design architecture", description: "Components, data flow and key technology choices.", priority: "high" },
      { title: "Build core functionality", description: "Implement the primary feature end-to-end.", priority: "high" },
      { title: "Add authentication", description: "Register, login and protected routes.", priority: "medium" },
      { title: "Polish UI/UX", description: "Responsive design, accessibility and animations.", priority: "medium" },
      { title: "Write tests", description: "Unit and integration tests for key flows.", priority: "medium" },
      { title: "Deploy application", description: "CI/CD and production deployment.", priority: "low" },
    );
  }

  const count = input.count && input.count > 0 ? Math.min(input.count, 12) : 8;
  return base.slice(0, count);
}
