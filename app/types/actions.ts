export type ActionType = 'file' | 'shell';

export interface BaseAction {
  content: string;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export type ImoogleAction = FileAction | ShellAction;

export type ImoogleActionData = ImoogleAction | BaseAction;

// Legacy aliases for backward compatibility
export type BoltAction = ImoogleAction;
export type BoltActionData = ImoogleActionData;
