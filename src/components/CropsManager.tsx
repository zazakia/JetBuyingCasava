import React, { useState } from 'react';
import { Plus, Search, Edit2, Calendar, MapPin, TrendingUp, Sprout } from 'lucide-react';
import type { Crop, Farmer, Land } from '../types';

interface CropsManagerProps {
  crops: Crop[];
  farmers: Farmer[];
  lands: Land[];
  onAddCrop: (crop: Crop) => void;
  onUpdateCrop: (crop: Crop) => void;
}

export function CropsManager({ crops, farmers, lands, onAddCrop, onUpdateCrop }: CropsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [formData, setFormData] = useState({
    farmerId: '',
    landId: '',
    cropType: '',
    variety: '',
    plantingDate: '',
    expectedHarvestDate: '',
    actualHarvestDate: '',
    areaPlanted: 0,
    expectedYield: 0,
    actualYield: 0,
    status: 'planted' as const,
    notes: ''
  });

  const barangays = [...new Set(farmers.map(f => f.barangay))].sort();
  const cropTypes = [...new Set(crops.map(c => c.cropType))].sort();

  const filteredCrops = crops.filter(crop => {
    const farmer = farmers.find(f => f.id === crop.farmerId);
    const land = lands.find(l => l.id === crop.landId);
    
    const matchesSearch = 
      crop.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crop.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || crop.status === filterStatus;
    const matchesBarangay = !filterBarangay || farmer?.barangay === filterBarangay;
    
    return matchesSearch && matchesStatus && matchesBarangay;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const crop: Crop = {
      id: editingCrop?.id || Date.now().toString(),
      ...formData,
      actualHarvestDate: formData.actualHarvestDate || undefined,
      actualYield: formData.actualYield || undefined,
      notes: formData.notes || undefined
    };

    if (editingCrop) {
      onUpdateCrop(crop);
    } else {
      onAddCrop(crop);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      farmerId: '',
      landId: '',
      cropType: '',
      variety: '',
      plantingDate: '',
      expectedHarvestDate: '',
      actualHarvestDate: '',
      areaPlanted: 0,
      expectedYield: 0,
      actualYield: 0,
      status: 'planted',
      notes: ''
    });
    setEditingCrop(null);
    setShowForm(false);
  };

  const handleEdit = (crop: Crop) => {
    setFormData({
      farmerId: crop.farmerId,
      landId: crop.landId,
      cropType: crop.cropType,
      variety: crop.variety,
      plantingDate: crop.plantingDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      actualHarvestDate: crop.actualHarvestDate || '',
      areaPlanted: crop.areaPlanted,
      expectedYield: crop.expectedYield,
      actualYield: crop.actualYield || 0,
      status: crop.status,
      notes: crop.notes || ''
    });
    setEditingCrop(crop);
    setShowForm(true);
  };

  const getFarmerLands = (farmerId: string) => {
    return lands.filter(land => land.farmerId === farmerId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planted': return 'bg-blue-100 text-blue-800';
      case 'growing': return 'bg-green-100 text-green-800';
      case 'ready': return 'bg-amber-100 text-amber-800';
      case 'harvested': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Crops Management</h1>
            <p className="text-gray-600 text-sm lg:text-base">Track planting, growth, and harvest data</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Add Crop</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Search crops by type, variety, or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
          >
            <option value="">All Status</option>
            <option value="planted">Planted</option>
            <option value="growing">Growing</option>
            <option value="ready">Ready</option>
            <option value="harvested">Harvested</option>
          </select>
          <select
            value={filterBarangay}
            onChange={(e) => setFilterBarangay(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
          >
            <option value="">All Barangays</option>
            {barangays.map(barangay => (
              <option key={barangay} value={barangay}>{barangay}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Crops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredCrops.map(crop => {
          const farmer = farmers.find(f => f.id === crop.farmerId);
          const land = lands.find(l => l.id === crop.landId);
          
          return (
            <div key={crop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <Sprout className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{crop.cropType}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{crop.variety}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(crop.status)}`}>
                    {crop.status.charAt(0).toUpperCase() + crop.status.slice(1)}
                  </div>
                  <button
                    onClick={() => handleEdit(crop)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm truncate">
                    {farmer?.firstName} {farmer?.lastName} - {land?.name}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">Planted: {new Date(crop.plantingDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">
                    {crop.areaPlanted} ha • Expected: {crop.expectedYield.toLocaleString()} kg
                  </span>
                </div>
                {crop.actualYield && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 lg:p-3">
                    <div className="text-xs lg:text-sm font-medium text-emerald-800">
                      Actual Yield: {crop.actualYield.toLocaleString()} kg
                    </div>
                    <div className="text-xs text-emerald-600">
                      {((crop.actualYield / crop.expectedYield) * 100).toFixed(1)}% of expected
                    </div>
                  </div>
                )}
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
                {editingCrop ? 'Edit Crop' : 'Add New Crop'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farmer</label>
                    <select
                      required
                      value={formData.farmerId}
                      onChange={(e) => setFormData({...formData, farmerId: e.target.value, landId: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    >
                      <option value="">Select Farmer</option>
                      {farmers.map(farmer => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.firstName} {farmer.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                    <select
                      required
                      value={formData.landId}
                      onChange={(e) => setFormData({...formData, landId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                      disabled={!formData.farmerId}
                    >
                      <option value="">Select Land</option>
                      {getFarmerLands(formData.farmerId).map(land => (
                        <option key={land.id} value={land.id}>
                          {land.name} ({land.area} ha)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                    <input
                      type="text"
                      required
                      value={formData.cropType}
                      onChange={(e) => setFormData({...formData, cropType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                      placeholder="e.g., Cassava, Sweet Potato"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                    <input
                      type="text"
                      required
                      value={formData.variety}
                      onChange={(e) => setFormData({...formData, variety: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                      placeholder="e.g., Golden Yellow, Purple"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
                    <input
                      type="date"
                      required
                      value={formData.plantingDate}
                      onChange={(e) => setFormData({...formData, plantingDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Harvest Date</label>
                    <input
                      type="date"
                      required
                      value={formData.expectedHarvestDate}
                      onChange={(e) => setFormData({...formData, expectedHarvestDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area Planted (hectares)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={formData.areaPlanted}
                      onChange={(e) => setFormData({...formData, areaPlanted: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Yield (kg)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.expectedYield}
                      onChange={(e) => setFormData({...formData, expectedYield: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    >
                      <option value="planted">Planted</option>
                      <option value="growing">Growing</option>
                      <option value="ready">Ready</option>
                      <option value="harvested">Harvested</option>
                    </select>
                  </div>
                  {formData.status === 'harvested' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Yield (kg)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.actualYield}
                        onChange={(e) => setFormData({...formData, actualYield: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                      />
                    </div>
                  )}
                </div>

                {formData.status === 'harvested' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Harvest Date</label>
                    <input
                      type="date"
                      value={formData.actualHarvestDate}
                      onChange={(e) => setFormData({...formData, actualHarvestDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    rows={3}
                    placeholder="Additional notes about this crop..."
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
                    {editingCrop ? 'Update' : 'Add'} Crop
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