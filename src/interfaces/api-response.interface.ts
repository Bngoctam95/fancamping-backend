export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  message_key?: string;
  data: T;
}
