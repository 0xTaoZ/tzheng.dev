import { toMarkdown } from "../data/resume";

// Plain-text résumé for job portals and applicant tracking systems.
export function GET() {
  return new Response(toMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
