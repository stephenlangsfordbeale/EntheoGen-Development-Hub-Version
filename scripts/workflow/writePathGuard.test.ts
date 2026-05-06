import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsRoot = path.resolve(__dirname, '..');

const allowedWorkflowObjectLiteralWriters = new Set<string>([
  path.resolve(scriptsRoot, 'parseInteractionReports.ts'),
  path.resolve(scriptsRoot, 'workflow/interactionUpdateWorkflow.ts')
]);

interface Violation {
  filePath: string;
  line: number;
  column: number;
  message: string;
}

function isTsSourceFile(filePath: string): boolean {
  return filePath.endsWith('.ts') && !filePath.endsWith('.d.ts') && !filePath.endsWith('.test.ts');
}

async function listFilesRecursive(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) return listFilesRecursive(fullPath);
      return [fullPath];
    })
  );
  return nested.flat();
}

function getPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function isWorkflowStatePropertyAccess(node: ts.Expression): boolean {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== 'state') return false;
  const workflowNode = node.expression;
  return ts.isPropertyAccessExpression(workflowNode) && workflowNode.name.text === 'workflow';
}

function includesWorkflowStateObjectLiteral(node: ts.ObjectLiteralExpression): boolean {
  const workflowProperty = node.properties.find((property) => {
    if (!ts.isPropertyAssignment(property)) return false;
    const name = getPropertyName(property.name);
    return name === 'workflow' && ts.isObjectLiteralExpression(property.initializer);
  });

  if (!workflowProperty || !ts.isPropertyAssignment(workflowProperty) || !ts.isObjectLiteralExpression(workflowProperty.initializer)) {
    return false;
  }

  return workflowProperty.initializer.properties.some((property) => {
    if (!ts.isPropertyAssignment(property)) return false;
    const name = getPropertyName(property.name);
    return name === 'state';
  });
}

function toViolation(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  filePath: string,
  message: string
): Violation {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    filePath,
    line: line + 1,
    column: character + 1,
    message
  };
}

function findViolations(filePath: string, sourceText: string): Violation[] {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const violations: Violation[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      if (isWorkflowStatePropertyAccess(node.left)) {
        violations.push(
          toViolation(
            sourceFile,
            node,
            filePath,
            'Direct workflow.state assignment is not allowed; use scripts/workflow/transitionInteractionUpdateState.ts.'
          )
        );
      }
    }

    if (ts.isObjectLiteralExpression(node) && includesWorkflowStateObjectLiteral(node)) {
      if (!allowedWorkflowObjectLiteralWriters.has(filePath)) {
        violations.push(
          toViolation(
            sourceFile,
            node,
            filePath,
            'Workflow object literals containing state are only allowed in parseInteractionReports.ts or interactionUpdateWorkflow.ts.'
          )
        );
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
}

async function main(): Promise<void> {
  const files = (await listFilesRecursive(scriptsRoot)).filter(isTsSourceFile).sort();

  const violations = (
    await Promise.all(
      files.map(async (filePath) => {
        const sourceText = await readFile(filePath, 'utf8');
        return findViolations(path.resolve(filePath), sourceText);
      })
    )
  ).flat();

  if (violations.length === 0) {
    console.log('Workflow write-path guard passed.');
    return;
  }

  console.error('Workflow write-path guard failed: direct workflow state writes were found.');
  for (const violation of violations) {
    const relativePath = path.relative(path.resolve(scriptsRoot, '..'), violation.filePath);
    console.error(`- ${relativePath}:${violation.line}:${violation.column} ${violation.message}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
