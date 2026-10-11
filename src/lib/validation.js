/** Minimum necessary customer information, validated client-side. */
export function validateDetails(details) {
  const errors = {};

  if (!details.name?.trim()) {
    errors.name = "Please enter your name.";
  }

  const digits = (details.phone || "").replace(/\D/g, "");
  if (!digits) {
    errors.phone = "Please enter your WhatsApp number.";
  } else if (digits.length < 8 || digits.length > 15) {
    errors.phone = "Enter a valid WhatsApp number (8–15 digits).";
  }

  return errors;
}

export function detailsAreValid(details) {
  return Object.keys(validateDetails(details)).length === 0;
}
