/**
 * Payments Service
 * 
 * Handles all payment-related API calls including fetching, creating,
 * updating, and managing rent payments.
 * 
 * @module api/services/payments.service
 */

import apiClient from '../client/apiClient';

/**
 * Retrieves all payment records
 * 
 * @async
 * @function getAllPayments
 * @returns {Promise<Array<{id: number, lease: object, amount: number, paymentDate: string, paymentMethod: string, status: string}>>} Array of all payments
 * @throws {Error} When fetching payments fails
 * 
 * @example
 * const payments = await getAllPayments();
 * console.log(`Total payments: ${payments.length}`);
 */
export const getAllPayments = async () => {
  return await apiClient.get('/payments');
};

/**
 * Retrieves a specific payment by ID
 * 
 * @async
 * @function getPaymentById
 * @param {number} id - Payment ID
 * @returns {Promise<{id: number, lease: object, amount: number, paymentDate: string, paymentMethod: string, status: string}>} Payment details
 * @throws {Error} When payment not found or request fails
 * 
 * @example
 * const payment = await getPaymentById(1);
 * console.log(`Payment amount: $${payment.amount}`);
 */
export const getPaymentById = async (id) => {
  return await apiClient.get(`/payments/${id}`);
};

/**
 * Creates a new payment record
 * 
 * @async
 * @function createPayment
 * @param {object} paymentData - Payment creation data
 * @param {number} paymentData.leaseId - ID of the associated lease
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.paymentDate - Payment date (ISO format)
 * @param {string} paymentData.paymentMethod - Payment method (CASH, CHECK, BANK_TRANSFER, CREDIT_CARD)
 * @param {string} [paymentData.status='COMPLETED'] - Payment status (COMPLETED, PENDING, FAILED)
 * @returns {Promise<{id: number, lease: object, amount: number, paymentDate: string, paymentMethod: string, status: string}>} Created payment
 * @throws {Error} When creation fails
 * 
 * @example
 * const newPayment = await createPayment({
 *   leaseId: 1,
 *   amount: 1500,
 *   paymentDate: '2024-01-01',
 *   paymentMethod: 'BANK_TRANSFER',
 *   status: 'COMPLETED'
 * });
 */
export const createPayment = async (paymentData) => {
  return await apiClient.post('/payments', paymentData);
};

/**
 * Updates an existing payment
 * 
 * @async
 * @function updatePayment
 * @param {number} id - Payment ID to update
 * @param {object} paymentData - Updated payment data
 * @param {number} [paymentData.amount] - Updated amount
 * @param {string} [paymentData.paymentDate] - Updated payment date
 * @param {string} [paymentData.paymentMethod] - Updated payment method
 * @param {string} [paymentData.status] - Updated status
 * @returns {Promise<{id: number, lease: object, amount: number, paymentDate: string, paymentMethod: string, status: string}>} Updated payment
 * @throws {Error} When update fails or payment not found
 * 
 * @example
 * const updated = await updatePayment(1, {
 *   status: 'COMPLETED',
 *   paymentMethod: 'CREDIT_CARD'
 * });
 */
export const updatePayment = async (id, paymentData) => {
  return await apiClient.put(`/payments/${id}`, paymentData);
};

/**
 * Deletes a payment record
 * 
 * @async
 * @function deletePayment
 * @param {number} id - Payment ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails
 * 
 * @example
 * await deletePayment(5);
 * console.log('Payment deleted successfully');
 */
export const deletePayment = async (id) => {
  return await apiClient.delete(`/payments/${id}`);
};

/**
 * Retrieves payments for a specific lease
 * 
 * @async
 * @function getPaymentsByLeaseId
 * @param {number} leaseId - Lease ID
 * @returns {Promise<Array<{id: number, amount: number, paymentDate: string, paymentMethod: string, status: string}>>} Array of payments for the lease
 * @throws {Error} When fetching fails
 * 
 * @example
 * const payments = await getPaymentsByLeaseId(1);
 * console.log(`${payments.length} payments for this lease`);
 */
export const getPaymentsByLeaseId = async (leaseId) => {
  const payments = await getAllPayments();
  return payments.filter(payment => payment.lease?.id === leaseId);
};

/**
 * Retrieves pending payments only
 * 
 * @async
 * @function getPendingPayments
 * @returns {Promise<Array<{id: number, lease: object, amount: number, paymentDate: string}>>} Array of pending payments
 * @throws {Error} When fetching fails
 * 
 * @example
 * const pending = await getPendingPayments();
 * console.log(`${pending.length} pending payments`);
 */
export const getPendingPayments = async () => {
  const payments = await getAllPayments();
  return payments.filter(payment => payment.status === 'PENDING');
};

/**
 * Retrieves payments for a specific unit
 * 
 * @async
 * @function getPaymentsByUnitId
 * @param {number} unitId - Unit ID
 * @returns {Promise<Array<{id: number, type: string, amount: number, dueDate: string, paidDate: string, status: string}>>} Array of payments for the unit
 * @throws {Error} When fetching fails
 * 
 * @example
 * const payments = await getPaymentsByUnitId(1);
 * console.log(`${payments.length} payments for this unit`);
 */
export const getPaymentsByUnitId = async (unitId) => {
  return await apiClient.get(`/payments/unit/${unitId}`);
};

/**
 * Creates a bill by admin (used in Send Bill page)
 * 
 * @async
 * @function createBillByAdmin
 * @param {object} billData - Bill creation data
 * @param {number} billData.leaseId - ID of the associated lease
 * @param {string} billData.paymentType - Payment type (RENT, ELECTRICITY, WATER, MAINTENANCE, SECURITY_DEPOSIT, OTHER)
 * @param {number} billData.amount - Bill amount
 * @param {string} billData.dueDate - Due date (YYYY-MM-DD format)
 * @param {string} [billData.description] - Optional bill description
 * @returns {Promise<{id: number, lease: object, paymentType: string, amount: number, dueDate: string, status: string, receiptNumber: string}>} Created bill/payment
 * @throws {Error} When bill creation fails
 * 
 * @example
 * const bill = await createBillByAdmin({
 *   leaseId: 1,
 *   paymentType: 'RENT',
 *   amount: 5000,
 *   dueDate: '2024-02-28',
 *   description: 'ค่าเช่าประจำเดือน กุมภาพันธ์ 2024'
 * });
 */
export const createBillByAdmin = async (billData) => {
  // Backend expects query params, not JSON body
  const params = new URLSearchParams();
  params.append('leaseId', billData.leaseId);
  params.append('paymentType', billData.paymentType);
  params.append('amount', billData.amount);
  params.append('dueDate', billData.dueDate);
  if (billData.description) {
    params.append('description', billData.description);
  }
  
  return await apiClient.post(`/payments/create-bill?${params.toString()}`);
};
