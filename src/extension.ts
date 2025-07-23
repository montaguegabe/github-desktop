// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec } from "child_process";
import * as path from "path";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "github-desktop" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "github-desktop.openInGitHubDesktop",
    () => {
      // Get the active editor
      const activeEditor = vscode.window.activeTextEditor;

      if (!activeEditor) {
        vscode.window.showErrorMessage("No active file open");
        return;
      }

      // Get the full path of the active file
      const activeFilePath = activeEditor.document.uri.fsPath;

      // Get the directory containing the current file
      const activeFileDirectory = path.dirname(activeFilePath);

      // Run the github command with the directory path
      const command = `github "${activeFileDirectory}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          vscode.window.showErrorMessage(
            `Failed to run GitHub Desktop: ${error.message}`
          );
          return;
        }

        if (stderr) {
          vscode.window.showWarningMessage(`GitHub Desktop warning: ${stderr}`);
        }

        // Show success message
        vscode.window.showInformationMessage("Opened in GitHub Desktop");
      });
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
