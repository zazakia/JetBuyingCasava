import React, { useState } from 'react';
import { Plus, Search, Edit2, DollarSign, Calendar, Package, TrendingUp, Loader } from 'lucide-react';
import type { Transaction, Farmer, Crop, LoadingState } from '../types';

interface TransactionsManagerProps {
  transactions: Transaction[];
  farmers: Farmer[];
  crops: Crop[];
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  loading?: LoadingState;
}

export function TransactionsManager({ 
  transactions, 
  farmers, 
  crops, 
  onAddTransaction, 
  onUpdateTransaction,
  loading 
}: TransactionsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    farmerId: '',
    cropId: '',
    type: 'sale' as const,
    buyerSeller: '',
    produce: '',
    quantity: 0,
    pricePerKg: 0,
    totalAmount: 0,
    transactionDate: '',
    paymentStatus: 'pending' as const,
    deliveryStatus: 'pending' as const,
    notes: ''
  });

  const filteredTransactions = (transactions || []).filter(transaction => {
    const farmer = (farmers || []).find(f => f.id === transaction.farmerId);
    
    const matchesSearch = 
      transaction.buyerSeller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.produce.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || transaction.type === filterType;
    const matchesStatus = !filterStatus || transaction.paymentStatus === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transaction: Transaction = {
      id: editingTransaction?.id || Date.now().toString(),
      ...formData,
      cropId: formData.cropId || undefined,
      totalAmount: formData.quantity * formData.pricePerKg,
      notes: formData.notes || undefined
    };

    if (editingTransaction) {
      onUpdateTransaction(transaction);
    } else {
      onAddTransaction(transaction);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      farmerId: '',
      cropId: '',
      type: 'sale',
      buyerSeller: '',
      produce: '',
      quantity: 0,
      pricePerKg: 0,
      totalAmount: 0,
      transactionDate: '',
      paymentStatus: 'pending',
      deliveryStatus: 'pending',
      notes: ''
    });
    setEditingTransaction(null);
    setShowForm(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      farmerId: transaction.farmerId,
      cropId: transaction.cropId || '',
      type: transaction.type,
      buyerSeller: transaction.buyerSeller,
      produce: transaction.produce,
      quantity: transaction.quantity,
      pricePerKg: transaction.pricePerKg,
      totalAmount: transaction.totalAmount,
      transactionDate: transaction.transactionDate,
      paymentStatus: transaction.paymentStatus,
      deliveryStatus: transaction.deliveryStatus,
      notes: transaction.notes || ''
    });
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'sale' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 text-sm lg:text-base">Manage sales and purchases</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Search by buyer/seller, produce, or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
          >
            <option value="">All Types</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchases</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredTransactions.map(transaction => {
          const farmer = (farmers || []).find(f => f.id === transaction.farmerId);
          
          return (
            <div key={transaction.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{transaction.produce}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{transaction.buyerSeller}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </div>
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center text-gray-600">
                  <Package className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">
                    {farmer?.firstName} {farmer?.lastName}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">
                    {transaction.quantity.toLocaleString()} kg @ ₱{transaction.pricePerKg}/kg
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 lg:p-3">
                  <div className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    ₱{transaction.totalAmount.toLocaleString()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.paymentStatus)}`}>
                      Payment: {transaction.paymentStatus}
                    </div>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.deliveryStatus)}`}>
                      Delivery: {transaction.deliveryStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farmer</label>
                    <select
                      required
                      value={formData.farmerId}
                      onChange={(e) => setFormData({...formData, farmerId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    >
                      <option value="">Select Farmer</option>
                      {(farmers || []).map(farmer => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.firstName} {farmer.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    >
                      <option value="sale">Sale</option>
                      <option value="purchase">Purchase</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.type === 'sale' ? 'Buyer' : 'Seller'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.buyerSeller}
                      onChange={(e) => setFormData({...formData, buyerSeller: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                      placeholder={formData.type === 'sale' ? 'Processing Plant Name' : 'Supplier Name'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produce</label>
                    <input
                      type="text"
                      required
                      value={formData.produce}
                      onChange={(e) => setFormData({...formData, produce: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                      placeholder="e.g., Cassava, Sweet Potato"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value);
                        setFormData({
                          ...formData, 
                          quantity,
                          totalAmount: quantity * formData.pricePerKg
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.pricePerKg}
                      onChange={(e) => {
                        const pricePerKg = parseFloat(e.target.value);
                        setFormData({
                          ...formData, 
                          pricePerKg,
                          totalAmount: formData.quantity * pricePerKg
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₱)</label>
                    <input
                      type="number"
                      value={formData.quantity * formData.pricePerKg}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
                    <input
                      type="date"
                      required
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({...formData, transactionDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({...formData, paymentStatus: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                    <select
                      value={formData.deliveryStatus}
                      onChange={(e) => setFormData({...formData, deliveryStatus: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    >
                      <option value="pending">Pending</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    rows={3}
                    placeholder="Additional notes about this transaction..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm lg:text-base"
                  >
                    {editingTransaction ? 'Update' : 'Add'} Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}