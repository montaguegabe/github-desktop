export interface CursorRule {
  name: string;
  description?: string;
  path: string;
  tags?: string[];
  lastModified?: Date;
}

export interface RuleStorage {
  getRules(): Promise<CursorRule[]>;
  getRule(name: string): Promise<CursorRule | null>;
  saveRule(rule: CursorRule, content: string): Promise<void>;
  deleteRule(name: string): Promise<void>;
  getRuleContent(name: string): Promise<string>;
}

export interface RuleProvider {
  id: string;
  name: string;
  getRules(): Promise<CursorRule[]>;
  getRuleContent(ruleName: string): Promise<string>;
}