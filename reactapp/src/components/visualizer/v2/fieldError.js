/**
 * fieldError(key, msg): throw this from `parse` (or anywhere in input handling)
 * to show `msg` inline under the input field `key`. Never alert().
 */
export function fieldError(key, msg) {
  const err = new Error(msg);
  err.name = "FieldError";
  err.fieldKey = key;
  err.isFieldError = true;
  return err;
}

export const isFieldError = (e) => Boolean(e && e.isFieldError === true);
