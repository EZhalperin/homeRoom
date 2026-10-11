/** Server errors are always { message }. */
export function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === "ERR_NETWORK") return "אין חיבור לשרת";
  return "אירעה שגיאה. נסה שוב.";
}
