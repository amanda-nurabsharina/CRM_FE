export interface ApiResponse<T = any> {
  code: number;
  status: 'success' | 'error';
  message: string;
  data?: T;
}
