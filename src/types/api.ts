export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string; code: string; details?: unknown };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
