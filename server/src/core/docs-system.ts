import { generateDocs } from "../studio/docs-generator.js";
import { getProject } from "../studio/manager.js";
import { buildCodebaseModel } from "./codebase.js";

export interface DocsSystemResult {
  readme: string;
  apiDocs: string;
  architecture: string;
  changelog: string;
  userDocs: string;
  stale: boolean;
  lastUpdated: string;
}

export function maintainDocumentation(
  userId: string,
  projectId: string
): DocsSystemResult {
  const project = getProject(userId, projectId);
  if (!project) throw new Error("Project not found");

  const docs = generateDocs(project, userId);
  const model = buildCodebaseModel(userId, projectId);

  const architecture = [
    docs.architecture,
    "",
    "## Live Architecture Model",
    `Files tracked: ${model.architecture.length}`,
    `Dependencies: ${model.dependencies.length}`,
    "",
    "### Components",
    ...model.architecture.map((a) => `- \`${a.path}\` (${a.type}) — ${a.description}`),
  ].join("\n");

  const changelog = [
    `# Changelog — ${project.name}`,
    "",
    `## ${new Date().toISOString().split("T")[0]} (auto-maintained)`,
    "",
    `- ${model.architecture.length} files in codebase`,
    `- Architecture model updated`,
    `- API docs synchronized`,
    `- README auto-refreshed`,
  ].join("\n");

  const userDocs = [
    `# ${project.name} — User Guide`,
    "",
    "## Getting Started",
    "1. Sign in to Buselligence",
    "2. Open your workspace",
    "3. Navigate to the application",
    "",
    "## Features",
    ...model.architecture
      .filter((a) => a.type === "component")
      .map((a) => `- ${a.description}`),
  ].join("\n");

  return {
    readme: docs.readme,
    apiDocs: docs.apiDocs,
    architecture,
    changelog,
    userDocs,
    stale: false,
    lastUpdated: new Date().toISOString(),
  };
}
