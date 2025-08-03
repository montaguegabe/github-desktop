import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export function activate(context: vscode.ExtensionContext) {
  // Set up file watcher for .mdc files in .cursor/rules directories
  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    "**/.cursor/rules/*.mdc",
    false, // Don't ignore create events
    false, // Don't ignore change events
    true   // Ignore delete events
  );

  fileWatcher.onDidCreate(async (uri) => {
    await syncRuleToShared(uri);
  });

  fileWatcher.onDidChange(async (uri) => {
    await syncRuleToShared(uri);
  });

  context.subscriptions.push(fileWatcher);

  const importRuleCommand = vscode.commands.registerCommand(
    "cursor-rules.importRule",
    async () => {
      try {
        const sharedRulesDir = getSharedRulesDirectory();
        const rules = await getAvailableRules(sharedRulesDir);

        if (rules.length === 0) {
          vscode.window.showInformationMessage(
            `No rules found in ${sharedRulesDir}`
          );
          return;
        }

        const selectedRule = await vscode.window.showQuickPick(rules, {
          placeHolder: "Select a rule to import",
        });

        if (!selectedRule) {
          return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
          vscode.window.showErrorMessage("No active editor found");
          return;
        }

        const currentFilePath = activeEditor.document.uri.fsPath;
        const targetDir = findNearestCursorRulesDirectory(currentFilePath);

        if (!targetDir) {
          vscode.window.showErrorMessage(
            "No .cursor/rules directory found in parent directories"
          );
          return;
        }

        const sourcePath = path.join(sharedRulesDir, selectedRule);
        const targetPath = path.join(targetDir, selectedRule);

        await copyFile(sourcePath, targetPath);
        vscode.window.showInformationMessage(
          `Rule "${selectedRule}" imported to ${targetDir}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to import rule: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  context.subscriptions.push(importRuleCommand);
}

function getSharedRulesDirectory(): string {
  const config = vscode.workspace.getConfiguration("cursorRules");
  const configuredPath = config.get<string>("sharedRulesDirectory") || "~/.cursor-rules";
  return configuredPath.replace("~", os.homedir());
}

async function getAvailableRules(directory: string): Promise<string[]> {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      return [];
    }

    const files = await fs.promises.readdir(directory);
    return files.filter((file) => {
      const filePath = path.join(directory, file);
      return fs.statSync(filePath).isFile();
    });
  } catch (error) {
    console.error("Error reading rules directory:", error);
    return [];
  }
}

function findNearestCursorRulesDirectory(startPath: string): string | null {
  let currentDir = path.dirname(startPath);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const cursorRulesPath = path.join(currentDir, ".cursor", "rules");
    if (fs.existsSync(cursorRulesPath) && fs.statSync(cursorRulesPath).isDirectory()) {
      return cursorRulesPath;
    }
    currentDir = path.dirname(currentDir);
  }

  const rootCursorRulesPath = path.join(root, ".cursor", "rules");
  if (fs.existsSync(rootCursorRulesPath) && fs.statSync(rootCursorRulesPath).isDirectory()) {
    return rootCursorRulesPath;
  }

  return null;
}

async function copyFile(source: string, destination: string): Promise<void> {
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) {
    await fs.promises.mkdir(destDir, { recursive: true });
  }
  await fs.promises.copyFile(source, destination);
}

async function syncRuleToShared(uri: vscode.Uri): Promise<void> {
  try {
    const fileName = path.basename(uri.fsPath);
    const sharedRulesDir = getSharedRulesDirectory();
    const targetPath = path.join(sharedRulesDir, fileName);

    // Ensure shared directory exists
    if (!fs.existsSync(sharedRulesDir)) {
      await fs.promises.mkdir(sharedRulesDir, { recursive: true });
    }

    // Copy the file to shared directory
    await fs.promises.copyFile(uri.fsPath, targetPath);
    
    vscode.window.showInformationMessage(
      `Rule "${fileName}" synced to shared rules directory`
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to sync rule: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function deactivate() {}