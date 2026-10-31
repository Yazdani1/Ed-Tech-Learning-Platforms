/** The editor's sections, in menu order (labels: catalog.tabs.<id>). */
export const EDITOR_TABS = [
  'basic',
  'media',
  'content',
  'curriculum',
  'liveClass',
  'quizBank',
] as const;
export type EditorTab = (typeof EDITOR_TABS)[number];

/** Tabs that need a saved course (they work on its id). */
export const SAVED_COURSE_TABS: readonly EditorTab[] = ['curriculum', 'liveClass', 'quizBank'];

export const tabId = (tab: EditorTab): string => `course-editor-tab-${tab}`;
export const panelId = (tab: EditorTab): string => `course-editor-panel-${tab}`;
