/**
 * Throw when promise is canceled
 */
export class CancelError extends Error {
  constructor() {
    super('CANCELED')
  }
}
