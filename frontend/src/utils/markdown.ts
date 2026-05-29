import { ResearchSession } from "../store/useAppStore";

export const buildMarkdownExport = (session: ResearchSession) => {
  const lines = [
    `# ${session.title}`,
    "",
    `Query: ${session.query}`,
    `Source: ${session.source}`,
    `Created: ${session.createdAt}`,
    "",
    "## Synthesis",
    session.synthesis || "(No synthesis)",
    "",
    "## Critique",
    session.critique || "(No critique)",
  ];

  return lines.join("\n");
};
