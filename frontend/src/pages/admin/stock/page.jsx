import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdWarning } from 'react-icons/md';
import { FiPackage, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { 
  getAllStockItems, 
  createStockItem, 
  updateStockItem, 
  deleteStockItem,
  addStockQuantity,
  updateStockQuantity,
  getLowStockItems
} from '../../../api/services/stock.service';

function StockManagementPage() {
  const [stockItems, setStockItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionType, setTransactionType] = useState('add'); // 'add' or 'use'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'PLUMBING',
    quantity: 0,
    unit: 'pieces',
    unitPrice: 0,
    description: ''
  });
  const [transactionData, setTransactionData] = useState({
    quantity: 0
  });

  useEffect(() => {
    fetchStockItems();
    fetchLowStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const data = await getAllStockItems();
      setStockItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      alert('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const data = await getLowStockItems(10);
      setLowStockItems(data);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    }
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setFormData({
      itemName: '',
      category: 'PLUMBING',
      quantity: 0,
      unit: 'pieces',
      unitPrice: 0,
      description: ''
    });
    setShowItemModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      description: item.description || ''
    });
    setShowItemModal(true);
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteStockItem(id);
        alert('Item deleted successfully');
        fetchStockItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const handleSaveItem = async () => {
    try {
      if (selectedItem) {
        await updateStockItem(selectedItem.id, formData);
        alert('Item updated successfully');
      } else {
        await createStockItem(formData);
        alert('Item created successfully');
      }
      setShowItemModal(false);
      fetchStockItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleTransaction = (item, type) => {
    setSelectedItem(item);
    setTransactionType(type);
    setTransactionData({ quantity: 0, notes: '' });
    setShowTransactionModal(true);
  };

  const handleSaveTransaction = async () => {
    try {
      if (!transactionData.quantity || transactionData.quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
      }
      
      if (transactionType === 'add') {
        await addStockQuantity(selectedItem.id, transactionData.quantity);
        alert('Stock added successfully');
      } else {
        if (transactionData.quantity > selectedItem.quantity) {
          alert('Cannot use more than available quantity');
          return;
        }
        await updateStockQuantity(selectedItem.id, -transactionData.quantity);
        alert('Stock used successfully');
      }
      setShowTransactionModal(false);
      fetchStockItems();
      fetchLowStockItems();
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert('Failed to process transaction');
    }
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'red' };
    if (quantity <= 10) return { label: 'Low Stock', color: 'orange' };
    return { label: 'In Stock', color: 'green' };
  };

  if (loading) {
    return <div className='text-center py-12'>Loading...</div>;
  }

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='title mb-4'>Stock Management</h1>
        <p className='text-gray-600'>Manage inventory and track stock movements</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm'>Total Items</p>
              <p className='text-3xl font-bold'>{stockItems.length}</p>
            </div>
            <div className='bg-blue-100 p-4 rounded-full'>
              <FiPackage className='text-blue-600' size={24} />
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm'>Low Stock Items</p>
              <p className='text-3xl font-bold text-orange-600'>{getLowStockItems().length}</p>
            </div>
            <div className='bg-orange-100 p-4 rounded-full'>
              <MdWarning className='text-orange-600' size={24} />
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm'>Total Value</p>
              <p className='text-3xl font-bold'>
                ฿{stockItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()}
              </p>
            </div>
            <div className='bg-green-100 p-4 rounded-full'>
              <FiTrendingUp className='text-green-600' size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className='flex flex-col md:flex-row gap-4 mb-6'>
        <input
          type='text'
          placeholder='Search items...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className='px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          <option value='ALL'>All Categories</option>
          <option value='PLUMBING'>Plumbing</option>
          <option value='ELECTRICAL'>Electrical</option>
          <option value='HVAC'>HVAC</option>
          <option value='APPLIANCE'>Appliance</option>
          <option value='STRUCTURAL'>Structural</option>
          <option value='CLEANING'>Cleaning</option>
          <option value='OTHER'>Other</option>
        </select>
        <button
          onClick={handleCreateItem}
          className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap'
        >
          <MdAdd /> Add Item
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className='bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6'>
          <div className='flex items-start gap-3'>
            <MdWarning className='text-orange-600 mt-1' size={20} />
            <div>
              <h3 className='font-semibold text-orange-800'>Low Stock Alert</h3>
              <p className='text-sm text-orange-700'>
                {lowStockItems.length} item(s) are running low. Please restock soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Item Name</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Category</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Quantity</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Unit Price</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Total Value</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Status</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredItems.map((item) => {
                const status = getStockStatus(item.quantity);
                return (
                  <tr key={item.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4'>
                      <div className='font-medium text-gray-900'>{item.itemName}</div>
                      {item.description && (
                        <div className='text-xs text-gray-500'>{item.description}</div>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='px-2 py-1 bg-gray-100 rounded text-xs'>{item.category}</span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='font-medium'>{item.quantity} {item.unit}</div>
                    </td>
                    <td className='px-6 py-4'>฿{Number(item.unitPrice).toLocaleString()}</td>
                    <td className='px-6 py-4 font-medium'>
                      ฿{(item.quantity * Number(item.unitPrice)).toLocaleString()}
                    </td>
                    <td className='px-6 py-4'>
                      <span className={`px-2 py-1 bg-${status.color}-100 text-${status.color}-800 rounded text-xs font-medium`}>
                        {status.label}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => handleTransaction(item, 'add')}
                          className='text-green-600 hover:text-green-800 text-sm flex items-center gap-1'
                          title='Add Stock'
                        >
                          <FiTrendingUp /> Add
                        </button>
                        <button
                          onClick={() => handleTransaction(item, 'use')}
                          className='text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1'
                          title='Use Stock'
                        >
                          <FiTrendingDown /> Use
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className='text-blue-600 hover:text-blue-800 text-sm'
                          title='Edit'
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className='text-red-600 hover:text-red-800 text-sm'
                          title='Delete'
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Modal */}
      {showItemModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b px-6 py-4'>
              <h3 className='text-xl font-semibold'>
                {selectedItem ? 'Edit Item' : 'Add New Item'}
              </h3>
            </div>

            <div className='p-6 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='col-span-2'>
                  <label className='block text-sm font-medium mb-1'>Item Name *</label>
                  <input
                    type='text'
                    value={formData.itemName}
                    onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., PVC Pipe 1/2 inch'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='PLUMBING'>Plumbing</option>
                    <option value='ELECTRICAL'>Electrical</option>
                    <option value='HVAC'>HVAC</option>
                    <option value='APPLIANCE'>Appliance</option>
                    <option value='STRUCTURAL'>Structural</option>
                    <option value='CLEANING'>Cleaning</option>
                    <option value='OTHER'>Other</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>Unit</label>
                  <input
                    type='text'
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                    placeholder='pieces, boxes, meters'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>Quantity</label>
                  <input
                    type='number'
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                    min='0'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>Unit Price (฿)</label>
                  <input
                    type='number'
                    step='0.01'
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                    min='0'
                  />
                </div>

                <div className='col-span-2'>
                  <label className='block text-sm font-medium mb-1'>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                    rows='3'
                    placeholder='Additional details...'
                  />
                </div>
              </div>
            </div>

            <div className='sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end'>
              <button
                onClick={() => setShowItemModal(false)}
                className='px-6 py-2 border rounded-lg hover:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                {selectedItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedItem && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-md w-full'>
            <div className='border-b px-6 py-4'>
              <h3 className='text-xl font-semibold'>
                {transactionType === 'add' ? 'Add Stock' : 'Use Stock'}
              </h3>
              <p className='text-sm text-gray-500 mt-1'>{selectedItem.itemName}</p>
            </div>

            <div className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>Current Stock</label>
                <p className='text-2xl font-bold'>{selectedItem.quantity} {selectedItem.unit}</p>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Quantity *</label>
                <input
                  type='number'
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({...transactionData, quantity: parseInt(e.target.value) || 0})}
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  min='1'
                  max={transactionType === 'use' ? selectedItem.quantity : undefined}
                />
              </div>

              <div className='bg-gray-50 p-3 rounded-lg'>
                <p className='text-sm text-gray-600'>New Stock:</p>
                <p className='text-xl font-bold'>
                  {transactionType === 'add' 
                    ? selectedItem.quantity + (transactionData.quantity || 0)
                    : selectedItem.quantity - (transactionData.quantity || 0)
                  } {selectedItem.unit}
                </p>
              </div>
            </div>

            <div className='bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end'>
              <button
                onClick={() => setShowTransactionModal(false)}
                className='px-6 py-2 border rounded-lg hover:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTransaction}
                className={`px-6 py-2 text-white rounded-lg ${
                  transactionType === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {transactionType === 'add' ? 'Add Stock' : 'Use Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManagementPage;
