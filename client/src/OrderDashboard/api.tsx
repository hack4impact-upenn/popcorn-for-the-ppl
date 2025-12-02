import { getData, postData, deleteData } from '../util/api.tsx';

/**
 * API functions for order management
 */

/**
 * Delete all orders from the database
 */
export async function deleteAllOrders() {
  const response = await deleteData('orders/all', {});
  return response;
}

/**
 * Sync orders from Typeform and save to MongoDB
 * @param formId - The Typeform form ID to sync from
 */
export async function syncTypeformOrders(formId: string) {
  const response = await postData(`orders/ingest/${formId}`, {});
  return response;
}

/**
 * Fetch all orders from database
 */
export async function fetchOrders() {
  const response = await getData('orders/all');
  return response;
}

/**
 * Fetch order history
 */
export async function fetchOrderHistory() {
  // TODO: Connect to backend endpoint
  // const response = await getData('orders/history');
  // return response;

  // Placeholder: return mock data for now
  return {
    data: [],
    error: null,
  };
}

/**
 * Fetch order statistics for graphs
 */
export async function fetchOrderStatistics(_orderType: string) {
  // TODO: Connect to backend endpoint
  // const response = await getData(`orders/statistics?type=${orderType}`);
  // return response;

  // Placeholder: return mock data for now
  return {
    data: [],
    error: null,
  };
}
