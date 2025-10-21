import { Layout } from '../layout/layout.types';

export interface Overlay {
  type: 'image';
  url: string;
  to: [number, number, number, number];
  startTime?: number; // in seconds, if not provided, overlay will be shown from the beginning
  endTime?: number; // in seconds, if not provided, overlay will be shown until the end
}

export interface Timeline {
  layouts: Layout[];
  overlays?: Overlay[];
}
