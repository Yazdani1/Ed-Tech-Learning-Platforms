/** 'full': bold, italic, underline, headings, lists, alignment; 'basic': bold, italic, underline, lists. */
export type RichTextFeatures = 'full' | 'basic';

export interface RichTextEditorProps {
  /** HTML ('' when empty) */
  value: string;
  /** Called with the new HTML, or '' when the editor holds no text */
  onChange: (html: string) => void;
  /** Accessible name of the editing area */
  label: string;
  placeholder?: string;
  minHeight?: number;
  /** Red border (the field is invalid) */
  error?: boolean;
  features?: RichTextFeatures;
}
