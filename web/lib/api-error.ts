export class ApiRequestError extends Error {
  fieldErrors?: Record<string, string[]>;
  status: number;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
