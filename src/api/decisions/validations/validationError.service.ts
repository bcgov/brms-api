export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  getErrorCode(): string {
    return 'VALIDATION_ERROR';
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.getErrorCode(),
    };
  }
}
