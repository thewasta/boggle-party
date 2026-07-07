/**
 * Converts board markdown files (data/board_4x4.md, etc.) to TypeScript string[][][] constants.
 * Run: pnpm exec tsx scripts/convert-boards.ts
 */
import fs from "node:fs";
import path from "node:path";

interface ParsedBoard {
  grid: string[][];
  declaredWords: string[];
}

function parseBoardFile(filePath: string): ParsedBoard[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const boards: ParsedBoard[] = [];

  // Split on "## TABLERO #" markers
  const sections = content.split(/## TABLERO #\d+/).slice(1);

  for (const section of sections) {
    // Extract grid between triple backticks
    const gridMatch = section.match(/```\n([\s\S]*?)```/);
    if (!gridMatch) {
      console.warn(`No grid found in section: ${section.slice(0, 50)}...`);
      continue;
    }

    const gridLines = gridMatch[1]
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const grid = gridLines.map((line) => line.split(/\s+/));

    // Extract declared words
    const wordsMatch = section.match(/\*\*Palabras incluidas:\*\*\s*(.+)/);
    const declaredWords = wordsMatch
      ? wordsMatch[1].split(/,\s*/).map((w) => w.trim())
      : [];

    boards.push({ grid, declaredWords });
  }

  return boards;
}

function formatBoardTs(grid: string[][]): string {
  const rows = grid.map((row) => `[${row.map((c) => `"${c}"`).join(",")}]`);
  return `[${rows.join(",")}]`;
}

function generateOutput(
  boards4: ParsedBoard[],
  boards5: ParsedBoard[],
  boards6: ParsedBoard[],
): string {
  const lines: string[] = [];

  lines.push("// Auto-generated from data/board_*.md — do not edit directly");
  lines.push("// Run: pnpm exec tsx scripts/convert-boards.ts");
  lines.push("");

  // 4x4
  lines.push(`export const PREDEFINED_BOARDS_4X4: string[][][] = [`);
  for (let i = 0; i < boards4.length; i++) {
    const tail = i < boards4.length - 1 ? "," : "";
    lines.push(`  ${formatBoardTs(boards4[i].grid)}${tail}`);
  }
  lines.push("];");
  lines.push("");

  // 5x5
  lines.push(`export const PREDEFINED_BOARDS_5X5: string[][][] = [`);
  for (let i = 0; i < boards5.length; i++) {
    const tail = i < boards5.length - 1 ? "," : "";
    lines.push(`  ${formatBoardTs(boards5[i].grid)}${tail}`);
  }
  lines.push("];");
  lines.push("");

  // 6x6
  lines.push(`export const PREDEFINED_BOARDS_6X6: string[][][] = [`);
  for (let i = 0; i < boards6.length; i++) {
    const tail = i < boards6.length - 1 ? "," : "";
    lines.push(`  ${formatBoardTs(boards6[i].grid)}${tail}`);
  }
  lines.push("];");
  lines.push("");

  // Declared words as map for test verification
  lines.push("// Words declared in markdown files (for test verification)");
  lines.push("export const DECLARED_WORDS: Record<string, string[][]> = {");

  const formatWords = (boards: ParsedBoard[]): string =>
    `[${boards.map((b) => `[${b.declaredWords.map((w) => `"${w}"`).join(",")}]`).join(",")}]`;

  lines.push(`  "4": ${formatWords(boards4)},`);
  lines.push(`  "5": ${formatWords(boards5)},`);
  lines.push(`  "6": ${formatWords(boards6)},`);
  lines.push("};");

  return lines.join("\n") + "\n";
}

// Main
const dataDir = path.resolve("data");
const boards4 = parseBoardFile(path.join(dataDir, "board_4x4.md"));
const boards5 = parseBoardFile(path.join(dataDir, "board_5x5.md"));
const boards6 = parseBoardFile(path.join(dataDir, "board_6x6.md"));

console.log(
  `Parsed: 4x4=${boards4.length}, 5x5=${boards5.length}, 6x6=${boards6.length}`,
);

if (boards4.length !== 20 || boards5.length !== 20 || boards6.length !== 20) {
  console.error("ERROR: Expected 20 boards per file!");
  process.exit(1);
}

const output = generateOutput(boards4, boards5, boards6);

// Write board data only (not the full module with solver logic)
const outPath = path.resolve("src/server/predefined-boards-data.ts");
fs.writeFileSync(outPath, output, "utf-8");
console.log(`Written: ${outPath} (${output.length} bytes)`);

// Verify dimensions
for (const [label, boards, expected] of [
  ["4x4", boards4, 4],
  ["5x5", boards5, 5],
  ["6x6", boards6, 6],
] as const) {
  for (let i = 0; i < boards.length; i++) {
    const b = boards[i];
    if (b.grid.length !== expected) {
      console.error(
        `${label} board ${i + 1}: ${b.grid.length} rows, expected ${expected}`,
      );
      process.exit(1);
    }
    for (let r = 0; r < b.grid.length; r++) {
      if (b.grid[r].length !== expected) {
        console.error(
          `${label} board ${i + 1} row ${r}: ${b.grid[r].length} cols, expected ${expected}`,
        );
        process.exit(1);
      }
    }
  }
}

console.log("All boards validated ✓");
