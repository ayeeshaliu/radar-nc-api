/**
 * Error thrown when we fail to authenticate an internal HTTP request
 */
export default class HttpInternalAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HttpInternalAuthError';
  }
}
