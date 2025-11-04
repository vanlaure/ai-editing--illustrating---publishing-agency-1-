export {};

declare global {
  interface AIStudioWindow {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudioWindow;
  }
}
