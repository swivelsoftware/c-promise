export class CancelError extends Error {
  constructor() {
    super('CANCELED')
  }
}
