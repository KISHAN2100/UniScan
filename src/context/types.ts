// types.ts

export interface ScanItem {
    id: string;
    title: string;
    date: string;
    type: 'document' | 'camera' | 'image';
    status: 'completed' | 'failed';
    uri: string; // URI of the scanned file (photo or PDF)
  }
  