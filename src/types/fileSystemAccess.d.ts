// File System Access API の型宣言（ブラウザ標準 API / TypeScript lib に未収録の分）

interface ShowDirectoryPickerOptions {
  mode?: 'read' | 'readwrite';
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  id?: string;
}

interface Window {
  showDirectoryPicker(options?: ShowDirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
}
