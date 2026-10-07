// Static AST evaluation only: never execute inspected package source.
import ts from 'typescript';
export function parseData(code, filename = 'client.js') {
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true);
  const declarations = new Map();
  function walk(node, fn) { fn(node); ts.forEachChild(node, child => walk(child, fn)); }
  walk(source, node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const list = declarations.get(node.name.text) ?? [];
      list.push(node); declarations.set(node.name.text, list);
    }
  });
  function evaluate(node, seen = new Set()) {
    if (!node) throw new Error('Missing static value');
    if (seen.has(node)) throw new Error('Circular static value');
    const next = new Set(seen).add(node);
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return evaluate(node.expression, next);
    if (ts.isIdentifier(node)) {
      const candidates = declarations.get(node.text) ?? [];
      // Prefer a declaration in the closest containing lexical block.
      for (let scope = node.parent; scope; scope = scope.parent) {
        const local = candidates.filter(d => d.pos >= scope.pos && d.end <= scope.end);
        if (local.length) return evaluate(local.find(d => d.pos < node.pos) ?.initializer ?? local[0].initializer, next);
      }
      throw new Error(`Unresolved identifier ${node.text}`);
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result = Object.create(null);
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) Object.assign(result, evaluate(property.expression, next));
        else if (ts.isShorthandPropertyAssignment(property)) result[property.name.text] = evaluate(property.name, next);
        else if (ts.isPropertyAssignment(property)) {
          const key = ts.isComputedPropertyName(property.name) ? evaluate(property.name.expression, next) : property.name.text;
          result[key] = evaluate(property.initializer, next);
        } else throw new Error('Non-data object property');
      }
      return result;
    }
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(item => evaluate(item, next));
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'join') {
      const array = evaluate(node.expression.expression, next);
      if (!Array.isArray(array) || array.some(v => typeof v !== 'string')) throw new Error('Only static string arrays may use join');
      return array.join(node.arguments.length ? evaluate(node.arguments[0], next) : ',');
    }
    if (ts.isPropertyAccessExpression(node)) return evaluate(node.expression, next)[node.name.text];
    if (ts.isElementAccessExpression(node)) return evaluate(node.expression, next)[evaluate(node.argumentExpression, next)];
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) return evaluate(node.left, next) + evaluate(node.right, next);
    throw new Error(`Unsupported static expression ${ts.SyntaxKind[node.kind]}: ${node.getText(source).slice(0, 80)}`);
  }
  return { source, walk, evaluate, declarations, ts };
}
