export type BlockType = 'heading' | 'text' | 'image' | 'callout' | 'step';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'danger';

export type SystemVersion = 'classico' | 'v10';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level?: 2 | 3;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  caption?: string;
  altText?: string;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  calloutType: CalloutVariant;
  content: string;
  title?: string;
}

export interface StepBlock extends BaseBlock {
  type: 'step';
  stepNumber?: number;
  content: string;
  completed?: boolean;
}

export type ProcedureBlock = HeadingBlock | TextBlock | ImageBlock | CalloutBlock | StepBlock;

export interface SubmenuItem {
  id: string;
  label: string;
  icon?: string;
}

export interface SystemMenu {
  id: string;
  label: string;
  icon: string;
  version?: SystemVersion | 'ambos';
  submenus: SubmenuItem[];
}

export interface Procedure {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  systemVersion?: SystemVersion | 'ambos';
  menuId?: string;
  submenuId?: string;
  systemPath?: string;
  author: string;
  tags: string[];
  blocks: ProcedureBlock[];
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucketName: string;
}
