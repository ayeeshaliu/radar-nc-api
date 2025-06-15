/**
 * Type for all responses returned by JSON controller actions. Controller
 * actions that return types other than JSON data, such as plain HTML
 * or raw buffers should not use this type.
 */
export type JsonResponse<T = never> = {
  status: 'successful' | 'error';
  message: string;
  data?: T;
};

export * from './util';
