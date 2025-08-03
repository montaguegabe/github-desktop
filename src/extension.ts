import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Create output channel for debugging
const outputChannel = vscode.window.createOutputChannel("Cursor Rules Management");

export function activate(context: vscode.ExtensionContext) {
  outputChannel.show(true); // Show the output channel immediately
  outputChannel.appendLine("Extension activated");
  outputChannel.appendLine(`Activation time: ${new Date().toISOString()}`);
  
  // Set up file watcher for .mdc files in .cursor/rules directories
  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    "**/.cursor/rules/*.mdc",
    false, // Don't ignore create events
    false, // Don't ignore change events
    true   // Ignore delete events
  );

  outputChannel.appendLine("File watcher created for **/.cursor/rules/*.mdc");

  fileWatcher.onDidCreate(async (uri) => {
    outputChannel.appendLine(`File created: ${uri.fsPath}`);
    await syncRuleToShared(uri);
  });

  fileWatcher.onDidChange(async (uri) => {
    outputChannel.appendLine(`File changed: ${uri.fsPath}`);
    await syncRuleToShared(uri);
  });

  context.subscriptions.push(fileWatcher);
  context.subscriptions.push(outputChannel);

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

  // Add command to show debug output
  const showOutputCommand = vscode.commands.registerCommand(
    "cursor-rules.showOutput",
    () => {
      outputChannel.show();
    }
  );
  
  context.subscriptions.push(showOutputCommand);
}

function getSharedRulesDirectory(): string {
  const config = vscode.workspace.getConfiguration("cursorRules");
  const configuredPath = config.get<string>("sharedRulesDirectory") || "~/.cursor-rules";
  const resolvedPath = configuredPath.replace("~", os.homedir());
  outputChannel.appendLine(`Configured path: ${configuredPath}, Resolved path: ${resolvedPath}`);
  return resolvedPath;
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
    outputChannel.appendLine(`Starting sync for: ${uri.fsPath}`);
    
    const fileName = path.basename(uri.fsPath);
    outputChannel.appendLine(`File name: ${fileName}`);
    
    const sharedRulesDir = getSharedRulesDirectory();
    outputChannel.appendLine(`Shared rules directory: ${sharedRulesDir}`);
    
    const targetPath = path.join(sharedRulesDir, fileName);
    outputChannel.appendLine(`Target path: ${targetPath}`);

    // Ensure shared directory exists
    if (!fs.existsSync(sharedRulesDir)) {
      outputChannel.appendLine(`Creating shared directory: ${sharedRulesDir}`);
      await fs.promises.mkdir(sharedRulesDir, { recursive: true });
    } else {
      outputChannel.appendLine(`Shared directory already exists`);
    }

    // Check if source file exists
    if (!fs.existsSync(uri.fsPath)) {
      outputChannel.appendLine(`ERROR: Source file does not exist: ${uri.fsPath}`);
      throw new Error(`Source file does not exist: ${uri.fsPath}`);
    }

    outputChannel.appendLine(`Copying file from ${uri.fsPath} to ${targetPath}`);
    
    // Copy the file to shared directory
    await fs.promises.copyFile(uri.fsPath, targetPath);
    
    outputChannel.appendLine(`File copied successfully`);
    
    vscode.window.showInformationMessage(
      `Rule "${fileName}" synced to shared rules directory`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`ERROR: ${errorMessage}`);
    outputChannel.appendLine(`Stack trace: ${error instanceof Error ? error.stack : 'N/A'}`);
    
    vscode.window.showErrorMessage(
      `Failed to sync rule: ${errorMessage}`
    );
  }
}

export function deactivate() {}