/**
 * Invoices Service
 * 
 * Handles all invoice-related API calls including creating invoices with payment line items
 * 
 * @module api/services/invoices.service
 */

import apiClient from '../client/apiClient';

/**
 * Creates an invoice with multiple payment line items (RENT, ELECTRICITY, WATER)
 * 
 * @async
 * @function createInvoice
 * @param {object} invoiceData - Invoice creation data
 * @param {number} invoiceData.leaseId - ID of the associated lease
 * @param {string} invoiceData.invoiceDate - Invoice date (YYYY-MM-DD format)
 * @param {string} invoiceData.dueDate - Due date (YYYY-MM-DD format)
 * @param {number} invoiceData.rentAmount - Rent amount (optional)
 * @param {number} invoiceData.electricityAmount - Electricity amount (optional)
 * @param {number} invoiceData.waterAmount - Water amount (optional)
 * @param {string} [invoiceData.notes] - Optional invoice notes
 * @returns {Promise<{id: number, invoiceNumber: string, lease: object, invoiceDate: string, dueDate: string, totalAmount: number, status: string, payments: Array}>} Created invoice with invoice number and payment line items
 * @throws {Error} When invoice creation fails
 * 
 * @example
 * const invoice = await createInvoice({
 *   leaseId: 1,
 *   invoiceDate: '2025-11-13',
 *   dueDate: '2025-11-28',
 *   rentAmount: 5000,
 *   electricityAmount: 800,
 *   waterAmount: 200,
 *   notes: 'ค่าเช่าประจำเดือน พฤศจิกายน 2025'
 * });
 * console.log(`Invoice created: ${invoice.invoiceNumber}`); // INV-20251113-1
 */
export const createInvoice = async (invoiceData) => {
  return await apiClient.post('/invoices/create', invoiceData);
};

/**
 * Retrieves an invoice by ID
 * 
 * @async
 * @function getInvoiceById
 * @param {number} id - Invoice ID
 * @returns {Promise<{id: number, invoiceNumber: string, lease: object, invoiceDate: string, dueDate: string, totalAmount: number, status: string, payments: Array}>} Invoice details with payment line items
 * @throws {Error} When invoice not found or request fails
 * 
 * @example
 * const invoice = await getInvoiceById(1);
 * console.log(`Invoice: ${invoice.invoiceNumber}`);
 */
export const getInvoiceById = async (id) => {
  return await apiClient.get(`/invoices/${id}`);
};

/**
 * Retrieves an invoice by invoice number
 * 
 * @async
 * @function getInvoiceByNumber
 * @param {string} invoiceNumber - Invoice number (e.g., INV-20251113-1)
 * @returns {Promise<{id: number, invoiceNumber: string, lease: object, invoiceDate: string, dueDate: string, totalAmount: number, status: string, payments: Array}>} Invoice details with payment line items
 * @throws {Error} When invoice not found or request fails
 * 
 * @example
 * const invoice = await getInvoiceByNumber('INV-20251113-1');
 */
export const getInvoiceByNumber = async (invoiceNumber) => {
  return await apiClient.get(`/invoices/number/${invoiceNumber}`);
};

/**
 * Retrieves all invoices for a specific lease
 * 
 * @async
 * @function getInvoicesByLeaseId
 * @param {number} leaseId - Lease ID
 * @returns {Promise<Array<{id: number, invoiceNumber: string, invoiceDate: string, dueDate: string, totalAmount: number, status: string}>>} Array of invoices for the lease
 * @throws {Error} When fetching fails
 * 
 * @example
 * const invoices = await getInvoicesByLeaseId(1);
 * console.log(`${invoices.length} invoices for this lease`);
 */
export const getInvoicesByLeaseId = async (leaseId) => {
  return await apiClient.get(`/invoices/lease/${leaseId}`);
};

/**
 * Retrieves all invoices for a specific tenant by email
 * 
 * @async
 * @function getInvoicesByTenant
 * @param {string} tenantEmail - Tenant email address
 * @returns {Promise<Array<Invoice>>} Array of invoices with payment line items
 * @throws {Error} When fetching invoices fails
 * 
 * @example
 * const invoices = await getInvoicesByTenant('john@example.com');
 * console.log(`Total invoices: ${invoices.length}`);
 */
export const getInvoicesByTenant = async (tenantEmail) => {
  return await apiClient.get(`/invoices/tenant/${tenantEmail}`);
};

/**
 * Downloads Invoice PDF
 * 
 * @async
 * @function downloadInvoicePdf
 * @param {number} invoiceId - Invoice ID
 * @param {string} invoiceNumber - Invoice number for filename
 * @returns {Promise<void>} Triggers browser download
 * @throws {Error} When download fails
 * 
 * @example
 * await downloadInvoicePdf(1, 'INV-20251113-1');
 */
export const downloadInvoicePdf = async (invoiceId, invoiceNumber) => {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
};

/**
 * Views invoice PDF in new tab
 * 
 * @async
 * @function viewInvoicePdf
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<void>} Opens PDF in new tab
 * @throws {Error} When PDF generation fails
 * 
 * @example
 * await viewInvoicePdf(1);
 */
export const viewInvoicePdf = async (invoiceId) => {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to view invoice PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Try to open in new tab
    const newWindow = window.open(url, '_blank');
    
    // If popup blocked, fallback to download
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    // Clean up after a delay
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error viewing invoice PDF:', error);
    throw error;
  }
};

/**
 * Upload payment slip for an invoice
 * 
 * @async
 * @function uploadPaymentSlip
 * @param {number} invoiceId - Invoice ID
 * @param {File} slipFile - Payment slip image file
 * @returns {Promise<{id: number, status: string, slipUrl: string}>} Updated invoice
 * @throws {Error} When upload fails
 * 
 * @example
 * const updatedInvoice = await uploadPaymentSlip(1, slipFile);
 * console.log(`Status: ${updatedInvoice.status}`);
 */
export const uploadPaymentSlip = async (invoiceId, slipFile) => {
  const formData = new FormData();
  formData.append('slip', slipFile);
  
  // Don't set Content-Type - browser will set it automatically with boundary
  return await apiClient.post(`/invoices/${invoiceId}/upload-slip`, formData);
};

/**
 * Get invoices waiting for admin verification
 * 
 * @async
 * @function getWaitingVerificationInvoices
 * @returns {Promise<Array>} List of invoices with WAITING_VERIFICATION status
 * @throws {Error} When fetch fails
 * 
 * @example
 * const pendingInvoices = await getWaitingVerificationInvoices();
 */
export const getWaitingVerificationInvoices = async () => {
  return await apiClient.get('/invoices/waiting-verification');
};

/**
 * Verify payment slip and approve/reject payment (Admin only)
 * 
 * @async
 * @function verifyPayment
 * @param {number} invoiceId - Invoice ID
 * @param {boolean} approved - Whether to approve or reject
 * @param {string} [notes] - Optional admin notes
 * @returns {Promise<{id: number, status: string}>} Updated invoice
 * @throws {Error} When verification fails
 * 
 * @example
 * const invoice = await verifyPayment(1, true, 'Payment verified');
 */
export const verifyPayment = async (invoiceId, approved, notes = '') => {
  return await apiClient.post(`/invoices/${invoiceId}/verify`, {
    approved,
    notes
  });
};

/**
 * Get all paid invoices (Admin only)
 * 
 * @async
 * @function getPaidInvoices
 * @returns {Promise<Array<{id: number, invoiceNumber: string, lease: object, totalAmount: number, paidDate: string}>>} List of paid invoices
 * @throws {Error} When request fails
 * 
 * @example
 * const paidInvoices = await getPaidInvoices();
 */
export const getPaidInvoices = async () => {
  return await apiClient.get('/invoices/paid');
};

/**
 * Delete an invoice (Admin only)
 * 
 * @async
 * @function deleteInvoice
 * @param {number} invoiceId - Invoice ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails
 * 
 * @example
 * await deleteInvoice(123);
 */
export const deleteInvoice = async (invoiceId) => {
  return await apiClient.delete(`/invoices/${invoiceId}`);
};

/**
 * Create installment plan for an invoice
 * 
 * @async
 * @function createInstallmentPlan
 * @param {number} invoiceId - Invoice ID
 * @param {number} installments - Number of installments (2, 4, or 6)
 * @returns {Promise<Array>} Array of created installment invoices
 * @throws {Error} When creation fails
 * 
 * @example
 * const installmentInvoices = await createInstallmentPlan(1, 4);
 */
export const createInstallmentPlan = async (invoiceId, installments) => {
  return await apiClient.post(`/invoices/${invoiceId}/installment`, { installments });
};

/**
 * Get installment invoices for a parent invoice
 * 
 * @async
 * @function getInstallmentInvoices
 * @param {number} parentInvoiceId - Parent invoice ID
 * @returns {Promise<Array>} Array of installment invoices
 * @throws {Error} When fetch fails
 * 
 * @example
 * const installments = await getInstallmentInvoices(1);
 */
export const getInstallmentInvoices = async (parentInvoiceId) => {
  return await apiClient.get(`/invoices/${parentInvoiceId}/installments`);
};

/**
 * Downloads Receipt PDF (for paid invoices)
 * 
 * @async
 * @function downloadReceiptPdf
 * @param {number} invoiceId - Invoice ID
 * @param {string} invoiceNumber - Invoice number for filename
 * @returns {Promise<void>} Triggers browser download
 * @throws {Error} When download fails
 * 
 * @example
 * await downloadReceiptPdf(1, 'INV-20251113-1');
 */
export const downloadReceiptPdf = async (invoiceId, invoiceNumber) => {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/receipt`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download receipt PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RECEIPT-${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading receipt PDF:', error);
    throw error;
  }
};

/**
 * Views Receipt PDF in new tab (for paid invoices)
 * 
 * @async
 * @function viewReceiptPdf
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<void>} Opens PDF in new tab
 * @throws {Error} When view fails
 * 
 * @example
 * await viewReceiptPdf(1);
 */
export const viewReceiptPdf = async (invoiceId) => {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/receipt`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to view receipt PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error viewing receipt PDF:', error);
    throw error;
  }
};
