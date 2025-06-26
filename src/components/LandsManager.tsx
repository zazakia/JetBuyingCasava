import React, { useState } from 'react';
import { Plus, Search, Edit2, MapPin, Calendar, Ruler } from 'lucide-react';
import type { Land, Farmer } from '../types';

interface LandsManagerProps {
  lands: Land[];
  farmers: Farmer[];
  onAddLand: (land: Land) => void;
}

export function LandsManager({ lands, farmers, onAddLand }: LandsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    farmerId: '',
    name: '',
    area: 0,
    location: '',
    barangay: '',
    municipality: '',
    province: '',
    soilType: '',
    dateAcquired: ''
  });

  const barangays = [...new Set(farmers.map(f => f.barangay))].sort();

  const filteredLands = lands.filter(land => {
    const farmer = farmers.find(f => f.id === land.farmerId);
    
    const matchesSearch = 
      land.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      land.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBarangay = !filterBarangay || land.barangay === filterBarangay;
    
    return matchesSearch && matchesBarangay;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const land: Land = {
      id: Date.now().toString(),
      ...formData
    };

    onAddLand(land);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      farmerId: '',
      name: '',
      area: 0,
      location: '',
      barangay: '',
      municipality: '',
      province: '',
      soilType: '',
      dateAcquired: ''
    });
    setShowForm(false);
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Lands Management</h1>
            <p className="text-gray-600 text-sm lg:text-base">Manage farm land parcels and details</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Add Land</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
            <input
              type="text"
              placeholder="Search lands by name, location, or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
            />
          </div>
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

      {/* Lands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredLands.map(land => {
          const farmer = farmers.find(f => f.id === land.farmerId);
          
          return (
            <div key={land.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{land.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{land.area} hectares</p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm truncate">
                    {farmer?.firstName} {farmer?.lastName}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Ruler className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">{land.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs lg:text-sm">Acquired: {new Date(land.dateAcquired).toLocaleDateString()}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 lg:p-3">
                  <div className="text-xs lg:text-sm font-medium text-emerald-800">
                    Soil Type: {land.soilType}
                  </div>
                  <div className="text-xs text-emerald-600">
                    {land.barangay}, {land.municipality}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
                Add New Land
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
                      {farmers.map(farmer => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.firstName} {farmer.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Land Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                      placeholder="e.g., East Field, Main Farm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (hectares)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                    <select
                      required
                      value={formData.soilType}
                      onChange={(e) => setFormData({...formData, soilType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    >
                      <option value="">Select Soil Type</option>
                      <option value="Clay">Clay</option>
                      <option value="Clay loam">Clay loam</option>
                      <option value="Sandy loam">Sandy loam</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Loam">Loam</option>
                      <option value="Silt">Silt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Description</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    placeholder="e.g., East side of barangay, Near river"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
                    <input
                      type="text"
                      required
                      value={formData.municipality}
                      onChange={(e) => setFormData({...formData, municipality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input
                      type="text"
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Acquired</label>
                  <input
                    type="date"
                    required
                    value={formData.dateAcquired}
                    onChange={(e) => setFormData({...formData, dateAcquired: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
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
                    Add Land
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