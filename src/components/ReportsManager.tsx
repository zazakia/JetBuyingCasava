import React, { useState, useMemo } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, MapPin } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { Farmer, Land, Crop, Transaction } from '../types';

interface ReportsManagerProps {
  farmers: Farmer[];
  lands: Land[];
  crops: Crop[];
  transactions: Transaction[];
}

export function ReportsManager({ farmers, lands, crops, transactions }: ReportsManagerProps) {
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reportData = useMemo(() => {
    const safeTransactions = transactions || [];
    const safeCrops = crops || [];
    const safeFarmers = farmers || [];
    
    const filteredTransactions = safeTransactions.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return transactionDate >= start && transactionDate <= end;
    });

    const filteredCrops = safeCrops.filter(c => {
      if (!c.actualHarvestDate) return false;
      const harvestDate = new Date(c.actualHarvestDate);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return harvestDate >= start && harvestDate <= end;
    });

    const totalRevenue = filteredTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalHarvest = filteredCrops.reduce((sum, c) => sum + (c.actualYield || 0), 0);

    const cropYields = filteredCrops.reduce((acc, crop) => {
      acc[crop.cropType] = (acc[crop.cropType] || 0) + (crop.actualYield || 0);
      return acc;
    }, {} as Record<string, number>);

    const barangayStats = safeFarmers.reduce((acc, farmer) => {
      const farmerCrops = filteredCrops.filter(c => c.farmerId === farmer.id);
      const farmerRevenue = filteredTransactions
        .filter(t => t.farmerId === farmer.id && t.type === 'sale')
        .reduce((sum, t) => sum + t.totalAmount, 0);
      
      if (!acc[farmer.barangay]) {
        acc[farmer.barangay] = { farmers: 0, harvest: 0, revenue: 0 };
      }
      
      acc[farmer.barangay].farmers += 1;
      acc[farmer.barangay].harvest += farmerCrops.reduce((sum, c) => sum + (c.actualYield || 0), 0);
      acc[farmer.barangay].revenue += farmerRevenue;
      
      return acc;
    }, {} as Record<string, { farmers: number; harvest: number; revenue: number }>);

    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      totalHarvest,
      cropYields,
      barangayStats,
      filteredTransactions,
      filteredCrops
    };
  }, [farmers, lands, crops, transactions, dateRange]);

  const generatePDF = () => {
    // In a real app, this would generate a PDF report
    alert('PDF generation would be implemented here');
  };

  const exportCSV = () => {
    // In a real app, this would export data to CSV
    alert('CSV export would be implemented here');
  };

  const renderSummaryReport = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-xl lg:text-2xl font-bold text-emerald-600">₱{reportData.totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600">₱{reportData.totalExpenses.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-500 transform rotate-180" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Net Income</p>
              <p className={`text-xl lg:text-2xl font-bold ${reportData.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₱{reportData.netIncome.toLocaleString()}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${reportData.netIncome >= 0 ? 'text-emerald-500' : 'text-red-500 transform rotate-180'}`} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Harvest</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-600">{reportData.totalHarvest.toLocaleString()} kg</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Yields by Type</h3>
          <Bar
            data={{
              labels: Object.keys(reportData.cropYields),
              datasets: [{
                label: 'Yield (kg)',
                data: Object.values(reportData.cropYields),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } }
            }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Barangay</h3>
          <Doughnut
            data={{
              labels: Object.keys(reportData.barangayStats),
              datasets: [{
                data: Object.values(reportData.barangayStats).map(s => s.revenue),
                backgroundColor: [
                  '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'
                ]
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } }
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderBarangayReport = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Barangay Performance Report</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barangay
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Farmers
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Harvest (kg)
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue (₱)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(reportData.barangayStats).map(([barangay, stats]) => (
              <tr key={barangay}>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {barangay}
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stats.farmers}
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stats.harvest.toLocaleString()}
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₱{stats.revenue.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactionReport = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Report</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Farmer
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produce
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.filteredTransactions.slice(0, 20).map((transaction) => {
              const farmer = (farmers || []).find(f => f.id === transaction.farmerId);
              return (
                <tr key={transaction.id}>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {farmer?.firstName} {farmer?.lastName}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'sale' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.produce}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₱{transaction.totalAmount.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 text-sm lg:text-base">Generate and view detailed reports</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={generatePDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              <Download className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportCSV}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
            >
              <Download className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
              >
                <option value="summary">Summary Report</option>
                <option value="barangay">Barangay Report</option>
                <option value="transactions">Transaction Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm lg:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'summary' && renderSummaryReport()}
      {selectedReport === 'barangay' && renderBarangayReport()}
      {selectedReport === 'transactions' && renderTransactionReport()}
    </div>
  );
}