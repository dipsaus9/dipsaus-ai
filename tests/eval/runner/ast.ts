import ts from "typescript";

/**
 * Mechanical cap measurement, mirroring the skill's Standards:
 * - LOC: lines from the component's declaration line to its closing brace,
 *   inclusive — the same span convention the fixtures were authored against.
 * - Hooks: every `useXxx(...)` call plus React 19's bare `use(...)` inside the
 *   component's subtree (callbacks included — hooks in callbacks are illegal
 *   anyway, so overcounting there only ever flags broken code).
 * - Props: elements of the first parameter's object binding pattern, falling
 *   back to the members of its type literal.
 * - Effects: `useEffect(...)` calls in the component subtree.
 * - JSX depth: deepest chain of nested JSX elements/fragments.
 * Components are capitalized function declarations; `useXxx` function
 * declarations are custom hooks and are not measured against component caps.
 */
export interface ComponentMetrics {
  name: string;
  loc: number;
  hooks: number;
  props: number;
  effects: number;
  jsxDepth: number;
}

export interface CapViolation {
  component: string;
  cap: "loc" | "hooks" | "props" | "effects" | "jsx-depth";
  value: number;
  limit: number;
}

export interface BannedPattern {
  component: string;
  pattern: "derived-state-in-effect" | "effect-fetch";
}

export const CAPS = { loc: 150, hooks: 5, props: 6, effects: 2, jsxDepth: 5 } as const;

function parse(fileName: string, source: string): ts.SourceFile {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
}

function isComponentDeclaration(node: ts.Node): node is ts.FunctionDeclaration {
  return (
    ts.isFunctionDeclaration(node) &&
    node.name !== undefined &&
    /^[A-Z]/.test(node.name.text) &&
    node.body !== undefined
  );
}

function isHookCall(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    (/^use[A-Z0-9_]/.test(node.expression.text) || node.expression.text === "use")
  );
}

function countProps(component: ts.FunctionDeclaration): number {
  const param = component.parameters[0];
  if (!param) {
    return 0;
  }
  if (ts.isObjectBindingPattern(param.name)) {
    return param.name.elements.length;
  }
  if (param.type && ts.isTypeLiteralNode(param.type)) {
    return param.type.members.length;
  }
  return 0;
}

function jsxDepth(node: ts.Node): number {
  const isJsx =
    ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
  let childMax = 0;
  node.forEachChild((child) => {
    childMax = Math.max(childMax, jsxDepth(child));
  });
  return isJsx ? childMax + 1 : childMax;
}

export function measureComponents(fileName: string, source: string): ComponentMetrics[] {
  const file = parse(fileName, source);
  const metrics: ComponentMetrics[] = [];
  file.forEachChild((node) => {
    if (!isComponentDeclaration(node)) {
      return;
    }
    const start = file.getLineAndCharacterOfPosition(node.getStart(file, false)).line;
    const end = file.getLineAndCharacterOfPosition(node.getEnd()).line;
    let hooks = 0;
    let effects = 0;
    const visit = (child: ts.Node): void => {
      if (isHookCall(child)) {
        hooks += 1;
        if (ts.isIdentifier(child.expression) && child.expression.text === "useEffect") {
          effects += 1;
        }
      }
      child.forEachChild(visit);
    };
    visit(node);
    metrics.push({
      name: node.name?.text ?? "?",
      loc: end - start + 1,
      hooks,
      props: countProps(node),
      effects,
      jsxDepth: jsxDepth(node),
    });
  });
  return metrics;
}

export function capViolations(metrics: ComponentMetrics[]): CapViolation[] {
  const violations: CapViolation[] = [];
  for (const m of metrics) {
    if (m.loc > CAPS.loc) violations.push({ component: m.name, cap: "loc", value: m.loc, limit: CAPS.loc });
    if (m.hooks > CAPS.hooks) violations.push({ component: m.name, cap: "hooks", value: m.hooks, limit: CAPS.hooks });
    if (m.props > CAPS.props) violations.push({ component: m.name, cap: "props", value: m.props, limit: CAPS.props });
    if (m.effects > CAPS.effects) violations.push({ component: m.name, cap: "effects", value: m.effects, limit: CAPS.effects });
    if (m.jsxDepth > CAPS.jsxDepth) violations.push({ component: m.name, cap: "jsx-depth", value: m.jsxDepth, limit: CAPS.jsxDepth });
  }
  return violations;
}

function collectStateSetters(scope: ts.Node): Set<string> {
  const setters = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isArrayBindingPattern(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === "useState"
    ) {
      const second = node.name.elements[1];
      if (second && ts.isBindingElement(second) && ts.isIdentifier(second.name)) {
        setters.add(second.name.text);
      }
    }
    node.forEachChild(visit);
  };
  visit(scope);
  return setters;
}

function isFunctionLike(node: ts.Node): boolean {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node)
  );
}

/** Direct setter calls in the effect body — nested callbacks (timers,
 * subscriptions, .then handlers, cleanup returns) excluded. */
function hasDirectSetterCall(body: ts.Node, setters: Set<string>): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found || isFunctionLike(node)) {
      return;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      setters.has(node.expression.text)
    ) {
      found = true;
      return;
    }
    node.forEachChild(visit);
  };
  body.forEachChild(visit);
  return found;
}

function subtreeHas(node: ts.Node, predicate: (n: ts.Node) => boolean): boolean {
  if (predicate(node)) {
    return true;
  }
  let found = false;
  node.forEachChild((child) => {
    if (!found && subtreeHas(child, predicate)) {
      found = true;
    }
  });
  return found;
}

export function bannedPatterns(fileName: string, source: string): BannedPattern[] {
  const file = parse(fileName, source);
  const results: BannedPattern[] = [];
  file.forEachChild((node) => {
    if (!isComponentDeclaration(node)) {
      return;
    }
    const setters = collectStateSetters(node);
    const component = node.name?.text ?? "?";
    const visitEffects = (child: ts.Node): void => {
      if (
        ts.isCallExpression(child) &&
        ts.isIdentifier(child.expression) &&
        child.expression.text === "useEffect"
      ) {
        const callback = child.arguments[0];
        if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && callback.body) {
          if (hasDirectSetterCall(callback.body, setters)) {
            results.push({ component, pattern: "derived-state-in-effect" });
          }
          const asyncFlow = subtreeHas(
            callback.body,
            (n) =>
              ts.isAwaitExpression(n) ||
              (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "fetch") ||
              (ts.isCallExpression(n) &&
                ts.isPropertyAccessExpression(n.expression) &&
                n.expression.name.text === "then"),
          );
          const settersUsed = subtreeHas(
            callback.body,
            (n) =>
              ts.isCallExpression(n) &&
              ts.isIdentifier(n.expression) &&
              setters.has(n.expression.text),
          );
          if (asyncFlow && settersUsed) {
            results.push({ component, pattern: "effect-fetch" });
          }
        }
      }
      child.forEachChild(visitEffects);
    };
    visitEffects(node);
  });
  return results;
}
