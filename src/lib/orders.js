import { db } from "../../firebase.js";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { ORDER, ORDER_STATUS } from "./config";

function ordersCollection() {
  return collection(db, ORDER.collection);
}

function orderDoc(reference) {
  return doc(db, ORDER.collection, reference);
}

/**
 * Create an order document. The reference doubles as the document id, so a
 * duplicate reference fails loudly instead of silently overwriting.
 */
export async function createOrder(order) {
  await setDoc(orderDoc(order.reference), {
    ...order,
    status: ORDER_STATUS.PENDING_PAYMENT,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return order.reference;
}

/** Subscribe to a single order, live. */
export function subscribeOrder(reference, onData, onError) {
  return onSnapshot(
    orderDoc(reference),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData({ reference: snapshot.id, ...snapshot.data() });
    },
    (error) => onError?.(error)
  );
}

/** Used by the order page when the customer says the transfer is sent. */
export async function markPaymentSent(reference) {
  await updateDoc(orderDoc(reference), {
    status: ORDER_STATUS.AWAITING_VERIFICATION,
    paymentMarkedSentAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Owner-side actions, exposed in the admin panel. */
export async function setOrderStatus(reference, status) {
  await updateDoc(orderDoc(reference), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/** Admin: newest first. */
export function subscribeOrders(onData, onError) {
  return onSnapshot(
    query(ordersCollection(), orderBy("createdAt", "desc")),
    (snapshot) => {
      onData(
        snapshot.docs.map((doc) => ({ reference: doc.id, ...doc.data() }))
      );
    },
    (error) => onError?.(error)
  );
}

export async function orderExists(reference) {
  const snapshot = await getDoc(orderDoc(reference));
  return snapshot.exists();
}
