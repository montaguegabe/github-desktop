import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { CursorRule, RuleStorage } from "../types";

export class LocalRuleStorage implements RuleStorage {
  private storageDir: string;

  constructor(storageDirectory?: string) {
    this.storageDir = storageDirectory || path.join(os.homedir(), ".cursor-rules");
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async getRules(): Promise<CursorRule[]> {
    try {
      const files = await fs.promises.readdir(this.storageDir);
      const rules: CursorRule[] = [];

      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        const stat = await fs.promises.stat(filePath);
        
        if (stat.isFile()) {
          const metaPath = `${filePath}.meta`;
          let metadata: any = {};
          
          if (fs.existsSync(metaPath)) {
            try {
              const metaContent = await fs.promises.readFile(metaPath, "utf-8");
              metadata = JSON.parse(metaContent);
            } catch (error) {
              console.error(`Failed to parse metadata for ${file}:`, error);
            }
          }

          rules.push({
            name: file,
            description: metadata.description,
            path: filePath,
            tags: metadata.tags,
            lastModified: stat.mtime,
          });
        }
      }

      return rules;
    } catch (error) {
      console.error("Error reading rules:", error);
      return [];
    }
  }

  async getRule(name: string): Promise<CursorRule | null> {
    const filePath = path.join(this.storageDir, name);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stat = await fs.promises.stat(filePath);
    const metaPath = `${filePath}.meta`;
    let metadata: any = {};
    
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = await fs.promises.readFile(metaPath, "utf-8");
        metadata = JSON.parse(metaContent);
      } catch (error) {
        console.error(`Failed to parse metadata for ${name}:`, error);
      }
    }

    return {
      name,
      description: metadata.description,
      path: filePath,
      tags: metadata.tags,
      lastModified: stat.mtime,
    };
  }

  async saveRule(rule: CursorRule, content: string): Promise<void> {
    const filePath = path.join(this.storageDir, rule.name);
    const metaPath = `${filePath}.meta`;

    await fs.promises.writeFile(filePath, content, "utf-8");
    
    const metadata = {
      description: rule.description,
      tags: rule.tags,
    };
    
    await fs.promises.writeFile(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  }

  async deleteRule(name: string): Promise<void> {
    const filePath = path.join(this.storageDir, name);
    const metaPath = `${filePath}.meta`;

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    
    if (fs.existsSync(metaPath)) {
      await fs.promises.unlink(metaPath);
    }
  }

  async getRuleContent(name: string): Promise<string> {
    const filePath = path.join(this.storageDir, name);
    return await fs.promises.readFile(filePath, "utf-8");
  }
}