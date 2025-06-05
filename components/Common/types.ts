export type ChartType = 'pie' | 'bar' | 'line' | 'scatter' | 'text';

export interface CardData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ChartType;
  title: string;
  content: any; // Chart data or text content
}