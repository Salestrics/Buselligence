const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

export function logo(): void {
  console.log(`
${CYAN}${BOLD}  Buselligence CLI${RESET}
${DIM}  The open-source runtime for AI-powered applications${RESET}
`);
}

export function success(msg: string): void {
  console.log(`${GREEN}✓${RESET} ${msg}`);
}

export function info(msg: string): void {
  console.log(`${DIM}→${RESET} ${msg}`);
}

export function heading(msg: string): void {
  console.log(`\n${BOLD}${msg}${RESET}`);
}

export function nextSteps(steps: string[]): void {
  heading("Next steps");
  steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
}
