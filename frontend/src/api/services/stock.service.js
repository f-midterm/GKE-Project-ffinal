/**
 * Stock Management Service
 * 
 * Handles all stock-related API calls for inventory management
 * 
 * @module api/services/stock.service
 */

import apiClient from '../client/apiClient';

/**
 * Get all stock items
 * 
 * @async
 * @function getAllStockItems
 * @returns {Promise<Array>} Array of stock items
 * @throws {Error} When fetching fails
 */
export const getAllStockItems = async () => {
  return await apiClient.get('/maintenance/stocks');
};

/**
 * Get stock item by ID
 * 
 * @async
 * @function getStockItemById
 * @param {number} id - Stock item ID
 * @returns {Promise<Object>} Stock item details
 * @throws {Error} When stock item not found
 */
export const getStockItemById = async (id) => {
  return await apiClient.get(`/maintenance/stocks/${id}`);
};

/**
 * Create new stock item
 * 
 * @async
 * @function createStockItem
 * @param {Object} stockData - Stock item data
 * @param {string} stockData.itemName - Item name
 * @param {string} stockData.category - Category
 * @param {number} stockData.quantity - Quantity
 * @param {string} stockData.unit - Unit (pieces, boxes, etc.)
 * @param {number} stockData.unitPrice - Unit price
 * @param {string} stockData.description - Description
 * @returns {Promise<Object>} Created stock item
 * @throws {Error} When creation fails
 */
export const createStockItem = async (stockData) => {
  return await apiClient.post('/maintenance/stocks', stockData);
};

/**
 * Update stock item
 * 
 * @async
 * @function updateStockItem
 * @param {number} id - Stock item ID
 * @param {Object} stockData - Updated stock data
 * @returns {Promise<Object>} Updated stock item
 * @throws {Error} When update fails
 */
export const updateStockItem = async (id, stockData) => {
  return await apiClient.put(`/maintenance/stocks/${id}`, stockData);
};

/**
 * Delete stock item
 * 
 * @async
 * @function deleteStockItem
 * @param {number} id - Stock item ID
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails
 */
export const deleteStockItem = async (id) => {
  return await apiClient.delete(`/maintenance/stocks/${id}`);
};

/**
 * Add stock quantity (incoming stock)
 * 
 * @async
 * @function addStockQuantity
 * @param {number} id - Stock item ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Updated stock item
 * @throws {Error} When adding fails
 */
export const addStockQuantity = async (id, quantity) => {
  return await apiClient.post(`/maintenance/stocks/${id}/add`, { quantity });
};

/**
 * Update stock quantity
 * 
 * @async
 * @function updateStockQuantity
 * @param {number} id - Stock item ID
 * @param {number} quantityChange - Quantity change (positive or negative)
 * @returns {Promise<Object>} Updated stock item
 * @throws {Error} When update fails
 */
export const updateStockQuantity = async (id, quantityChange) => {
  return await apiClient.patch(`/maintenance/stocks/${id}/quantity`, { quantityChange });
};

/**
 * Get low stock items
 * 
 * @async
 * @function getLowStockItems
 * @param {number} threshold - Threshold for low stock (default: 10)
 * @returns {Promise<Array>} Array of items with low stock
 * @throws {Error} When fetching fails
 */
export const getLowStockItems = async (threshold = 10) => {
  return await apiClient.get(`/maintenance/stocks/low-stock?threshold=${threshold}`);
};
