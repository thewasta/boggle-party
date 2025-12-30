import { TrieNode } from "./dictionary";

export interface SolveResult {
  words: string[];
  maxLen: number;
}

export function solveBoard(board: string[][], root: TrieNode): SolveResult {
  const rows = board.length;
  const cols = board[0].length;
  const foundWords = new Set<string>();
  let maxLen = 0;

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  function dfs(r: number, c: number, node: TrieNode, currentWord: string) {
    // 1. Límites y visitados
    if (r < 0 || r >= rows || c < 0 || c >= cols || visited[r][c]) return;

    const char = board[r][c]; // Ej: "A" o "QU"
    let nextNode = node;

    // 2. Avanzar en el Trie (Manejo de "QU")
    for (const letter of char) {
      if (!nextNode.children[letter]) return; // No existe este prefijo, abortar rama
      nextNode = nextNode.children[letter];
    }

    // 3. Palabra encontrada
    const newWord = currentWord + char;
    if (nextNode.isWord && newWord.length >= 3) {
      foundWords.add(newWord);
      maxLen = Math.max(maxLen, newWord.length);
    }

    // 4. Continuar buscando
    visited[r][c] = true;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        dfs(r + dr, c + dc, nextNode, newWord);
      }
    }
    visited[r][c] = false;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs(r, c, root, "");
    }
  }

  return { words: Array.from(foundWords), maxLen };
}
