import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../lib/config";

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customer);
    return raw ? JSON.parse(raw) : { name: "", phone: "", notes: "" };
  } catch {
    return { name: "", phone: "", notes: "" };
  }
}

/** Remember the customer's details locally so re-orders are one tap. */
export function useCustomerDetails() {
  const [details, setDetails] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customer, JSON.stringify(details));
    } catch {
      /* non-fatal */
    }
  }, [details]);

  const update = (field, value) =>
    setDetails((previous) => ({ ...previous, [field]: value }));

  return { details, update, setDetails };
}
