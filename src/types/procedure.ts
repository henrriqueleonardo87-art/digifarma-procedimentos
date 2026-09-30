export type BlockType = 'heading' | 'text' | 'image' | 'callout' | 'step';

export type CalloutVariant = 'info' | 'warning' | 'success' | 'danger';

export type SystemVersion = 'classico' | 'v10' | 'r78';

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
  text?: string;
}

export interface StepBlock extends BaseBlock {
  type: 'step';
  stepNumber?: number;
  content: string;
  title?: string;
  instruction?: string;
  expectedResult?: string;
  tips?: string;
  warnings?: string;
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

export interface ProcedureHistoryItem {
  id?: string;
  action: 'create' | 'update' | 'revision' | string;
  timestamp: string;
  user: string;
  description?: string;
  details?: string;
}

export type IndicatorType =
  | 'hand'
  | 'arrow'
  | 'spotlight'
  | 'badge'
  | 'rect'
  | 'circle'
  | 'text'
  | 'icon'
  | 'dropdown'
  | 'gif';

export type IndicatorGlow = 'none' | 'soft' | 'strong' | 'neon';
export type IndicatorSize = 'sm' | 'md' | 'lg' | 'xl';
export type IndicatorFillMode = 'outline' | 'filled';
export type IndicatorDirection = 'up' | 'down' | 'left' | 'right' | 'up-right' | 'down-right' | 'up-left' | 'down-left';
export type IndicatorIconName =
  | 'alert'
  | 'star'
  | 'target'
  | 'cursor'
  | 'check'
  | 'info'
  | 'bolt'
  | 'forbidden'
  | 'lock';

export interface DropdownOption {
  id: string;
  text: string;
  badge?: string;
}

export interface SlideIndicator {
  id: string;
  type: IndicatorType;
  x: number; // percent 0-100
  y: number; // percent 0-100
  label?: string; // for badge, text box or dropdown title
  content?: string; // for dropdown body or detailed note
  direction?: IndicatorDirection;
  color?: string; // primary accent / border color (hex)
  bgColor?: string; // background fill color
  borderColor?: string;
  textColor?: string; // custom font color
  fontFamily?: string; // Inter, Outfit, Roboto, Playfair Display, Fira Code, Bebas Neue, Nunito
  fontWeight?: string | number;
  dropdownOptions?: DropdownOption[];
  slideIndex?: number; // target slide index
  fillMode?: IndicatorFillMode;
  opacity?: number; // 0.1 to 1.0 (e.g. 1.0, 0.75, 0.5, 0.25)
  glow?: IndicatorGlow;
  size?: IndicatorSize;
  fontSize?: number;
  width?: number; // percent or px
  height?: number; // percent or px
  iconName?: IndicatorIconName;
  gifUrl?: string;
  hasShadow?: boolean;
}

export interface SlideShape {
  id: string;
  type: 'circle' | 'rect' | 'pill' | 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  text?: string;
  textColor?: string;
  hasShadow?: boolean;
}

export interface SlideConfig {
  id: string;
  slideType: 'cover' | 'step' | 'callout' | 'checklist' | 'signatures' | 'custom';
  title?: string;
  subtitle?: string;
  bgTheme?: 'deep' | 'dark' | 'light' | 'custom';
  customBgColor?: string;
  stepIndex?: number;
  slideIndex?: number;
  indicators?: SlideIndicator[];
  shapes?: SlideShape[];
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
  createdBy?: string;
  updatedBy?: string;
  history?: ProcedureHistoryItem[];
  tags: string[];
  blocks: ProcedureBlock[];
  slidesConfig?: SlideConfig[];
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucketName: string;
}
