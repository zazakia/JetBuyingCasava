import React, { useState } from 'react';
import { Plus, Search, Edit2, Phone, MapPin, Calendar, User, Loader } from 'lucide-react';
import type { Farmer, LoadingState } from '../types';

interface FarmersManagerProps {
  farmers: Farmer[];
  onAddFarmer: (farmer: Farmer) => void;
  onUpdateFarmer: (farmer: Farmer) => void;
  loading?: LoadingState;
}

export function FarmersManager({ farmers, onAddFarmer, onUpdateFarmer, loading }: FarmersManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    barangay: '',
    municipality: '',
    province: '',
    totalHectares: 0,
    datePlanted: '',
    dateHarvested: ''
  });

  const barangays = [...new Set(farmers.map(f => f.barangay))].sort();

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = 
      farmer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm);
    
    const matchesBarangay = !filterBarangay || farmer.barangay === filterBarangay;
    
    return matchesSearch && matchesBarangay;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const farmer: Farmer = {
      id: editingFarmer?.id || Date.now().toString(),
      ...formData,
      dateRegistered: editingFarmer?.dateRegistered || new Date().toISOString().split('T')[0],
      isActive: editingFarmer?.isActive ?? true
    };

    if (editingFarmer) {
      onUpdateFarmer(farmer);
    } else {
      onAddFarmer(farmer);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      barangay: '',
      municipality: '',
      province: '',
      totalHectares: 0,
      datePlanted: '',
      dateHarvested: ''
    });
    setEditingFarmer(null);
    setShowForm(false);
  };

  const handleEdit = (farmer: Farmer) => {
    setFormData({
      firstName: farmer.firstName,
      lastName: farmer.lastName,
      phone: farmer.phone,
      address: farmer.address,
      barangay: farmer.barangay,
      municipality: farmer.municipality,
      province: farmer.province,
      totalHectares: farmer.totalHectares,
      datePlanted: farmer.datePlanted || '',
      dateHarvested: farmer.dateHarvested || ''
    });
    setEditingFarmer(farmer);
    setShowForm(true);
  };

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-glass">Farmers Management</h1>
            <p className="text-glass-muted text-sm lg:text-base">Manage farmer profiles and information</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="glass-button px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Add Farmer</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-light w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Search farmers by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2 glass-input rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400/50 text-sm lg:text-base"
            />
          </div>
          <select
            value={filterBarangay}
            onChange={(e) => setFilterBarangay(e.target.value)}
            className="px-3 lg:px-4 py-2 glass-input rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400/50 text-sm lg:text-base"
          >
            <option value="">All Barangays</option>
            {barangays.map(barangay => (
              <option key={barangay} value={barangay}>{barangay}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading?.isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-glass-muted mr-2" />
          <span className="text-glass-muted">Loading farmers...</span>
        </div>
      )}

      {/* Error State */}
      {loading?.error && (
        <div className="glass-card rounded-xl p-4 border border-red-400/30 bg-red-500/10 mb-6">
          <p className="text-red-300 text-sm">{loading.error}</p>
        </div>
      )}

      {/* Farmers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredFarmers.map(farmer => (
          <div key={farmer.id} className="glass-card rounded-xl p-4 lg:p-6 hover:bg-white/20 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-glow">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-semibold text-glass">
                    {farmer.firstName} {farmer.lastName}
                  </h3>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    farmer.isActive 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    {farmer.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleEdit(farmer)}
                className="p-2 text-glass-light hover:text-glass hover:bg-white/10 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center text-glass-muted">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-xs lg:text-sm truncate">{farmer.phone}</span>
              </div>
              <div className="flex items-center text-glass-muted">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-xs lg:text-sm truncate">{farmer.barangay}, {farmer.municipality}</span>
              </div>
              <div className="flex items-center text-glass-muted">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-xs lg:text-sm">Registered: {new Date(farmer.dateRegistered).toLocaleDateString()}</span>
              </div>
              {farmer.totalHectares > 0 && (
                <div className="flex items-center text-glass-muted">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">{farmer.totalHectares} hectares</span>
                </div>
              )}
              <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg p-2 lg:p-3 mt-2">
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-modal rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
                {editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Hectares</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.totalHectares}
                      onChange={(e) => setFormData({...formData, totalHectares: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                    <input
                      type="text"
                      required
                      value={formData.barangay}
                      onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                    <input
                      type="text"
                      required
                      value={formData.municipality}
                      onChange={(e) => setFormData({...formData, municipality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input
                      type="text"
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Planted (Optional)</label>
                    <input
                      type="date"
                      value={formData.datePlanted}
                      onChange={(e) => setFormData({...formData, datePlanted: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Harvested (Optional)</label>
                    <input
                      type="date"
                      value={formData.dateHarvested}
                      onChange={(e) => setFormData({...formData, dateHarvested: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-gray-900 text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-300 transition-colors text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm lg:text-base font-medium"
                  >
                    {editingFarmer ? 'Update' : 'Add'} Farmer
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