(function (root) {
  'use strict';
  const edge = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
  const isSymbol = c => Number.isInteger(c) && c >= 0;
  function neighbors(l, i) {
    const n = l.size, x = i % n, y = Math.floor(i / n);
    return [x ? i - 1 : -1, x < n - 1 ? i + 1 : -1,
      y ? i - n : -1, y < n - 1 ? i + n : -1].filter(j => j >= 0);
  }
  function prepare(l) {
    const walls = new Set((l.walls || []).map(([a, b]) => edge(a, b)));
    const adj = l.cells.map((_, i) => neighbors(l, i).filter(j => !walls.has(edge(i, j))));
    const totals = Array(5).fill(0);
    l.cells.forEach(c => { if (isSymbol(c)) totals[c]++; });
    return { adj, totals };
  }
  function current(l, path) {
    for (let k = path.length - 1; k >= 0; k--) if (isSymbol(l.cells[path[k]])) return l.cells[path[k]];
    return -1;
  }
  function reason(l, path, i) {
    if (!Number.isInteger(i) || i < 0 || i >= l.cells.length) return 'bounds';
    if (!path.length) return i === l.start ? '' : 'start';
    if (path.includes(i)) return 'visited';
    const head = path.at(-1);
    if (!neighbors(l, head).includes(i)) return 'adjacent';
    if ((l.walls || []).some(([a, b]) => edge(a, b) === edge(head, i))) return 'wall';
    const c = current(l, path), next = l.cells[i];
    if (c >= 0 && isSymbol(next) && next !== c &&
      path.filter(j => l.cells[j] === c).length !== l.cells.filter(v => v === c).length) return 'category';
    return '';
  }
  const legal = (l, p, i) => reason(l, p, i) === '';
  function solve(l, prefix = [], { maxNodes = 60000, maxSolutions = 1, shortcut = true } = {}) {
    const check = [];
    for (const i of prefix) { if (!legal(l, check, i)) return { solution: null, solutions: [], nodes: 0, exhausted: false }; check.push(i); }
    if (shortcut && maxSolutions === 1 && l.solution && prefix.every((v, i) => l.solution[i] === v)) {
      return { solution: l.solution.slice(), solutions: [l.solution.slice()], nodes: 0, exhausted: false };
    }
    const { adj, totals } = prepare(l), used = new Set(prefix), route = prefix.slice();
    const counts = Array(5).fill(0), solutions = [];
    prefix.forEach(i => { if (isSymbol(l.cells[i])) counts[l.cells[i]]++; });
    let nodes = 0, exhausted = false, decisions = 0;
    function connected(head) {
      const reached = new Set([head]), todo = [head];
      while (todo.length) for (const j of adj[todo.pop()]) if (!used.has(j) && !reached.has(j)) { reached.add(j); todo.push(j); }
      if (reached.size !== l.cells.length - used.size + 1) return false;
      // An unfinished spanning path has only one endpoint besides its current head.
      let leaves = 0;
      for (const j of reached) if (j !== head && adj[j].filter(k => k === head || !used.has(k)).length === 1 && ++leaves > 1) return false;
      return true;
    }
    function visit(active) {
      if (nodes >= maxNodes) { exhausted = true; return; }
      nodes++;
      if (route.length === l.cells.length) { solutions.push(route.slice()); return; }
      const head = route.at(-1);
      if (head !== undefined && !connected(head)) return;
      const candidates = (head === undefined ? [l.start] : adj[head]).filter(i => {
        const c = l.cells[i];
        return !used.has(i) && (!isSymbol(c) || active < 0 || c === active || counts[active] === totals[active]);
      });
      if (candidates.length > 1) decisions++;
      candidates.sort((a, b) => adj[a].filter(j => !used.has(j)).length - adj[b].filter(j => !used.has(j)).length);
      for (const i of candidates) {
        const c = l.cells[i]; used.add(i); route.push(i); if (isSymbol(c)) counts[c]++;
        visit(isSymbol(c) ? c : active);
        if (isSymbol(c)) counts[c]--; route.pop(); used.delete(i);
        if (exhausted || solutions.length >= maxSolutions) break;
      }
    }
    visit(current(l, prefix));
    return { solution: solutions[0] || null, solutions, nodes, exhausted, decisions };
  }
  const api = { edge, isSymbol, neighbors, current, legal, reason, solve, prepare };
  if (typeof module !== 'undefined') module.exports = api;
  else root.DOTIRO_RULES = api;
})(typeof window !== 'undefined' ? window : globalThis);
