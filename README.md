# GitHub Desktop VS Code Extension

Quickly open the right repository in GitHub Desktop directly from VS Code. This extension allows you to open the currently active file's repository in GitHub Desktop with a single command.

## Features

This extension provides a simple command to open your current file in GitHub Desktop:

- **Open in GitHub Desktop**: Opens the repository containing the currently active file in GitHub Desktop
- **Quick Access**: Available through the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- **Error Handling**: Provides clear feedback if no file is open or if GitHub Desktop is not available

<!-- TODO: Add animation showing the extension in action -->

> Tip: The extension will be demonstrated with an animation here showing how to use the command and see GitHub Desktop open to the correct repository.

## Requirements

This extension requires:

- **GitHub Desktop**: Must be installed and accessible via the `github` command line tool
- **VS Code**: Version 1.102.0 or higher

To verify GitHub Desktop CLI is available, run `github --help` in your terminal. If the command is not found, you may need to install GitHub Desktop and ensure its CLI tools are properly configured.

## Usage

1. Open any file in a Git repository in VS Code
2. Open the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
3. Type "Open in GitHub Desktop" and select the command
4. GitHub Desktop will open to the repository containing your current file

## Extension Settings

This extension does not contribute any VS Code settings at this time.

## Known Issues

- The extension requires the `github` command line tool to be available in your system PATH
- If GitHub Desktop is not installed or the CLI is not configured, the command will show an error message

## Release Notes

### 0.0.1

Initial release of the GitHub Desktop VS Code extension.

- Added "Open in GitHub Desktop" command
- Basic error handling for missing files or GitHub Desktop CLI

---

## Development

To work on this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Open the project in VS Code
4. Press `F5` to launch a new Extension Development Host window
5. Test the extension in the new window

## Building and Installing

To package and install the extension locally:

```bash
npm run install-extension
```

This will package the extension and install it in Cursor.

---

**Enjoy using GitHub Desktop with VS Code!**
