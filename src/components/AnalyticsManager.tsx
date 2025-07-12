import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, Calendar } from 'lucide-react';
import { Line, Scatter, Bar } from 'react-chartjs-2';
import type { Farmer, Land, Crop, Transaction } from '../types';

interface AnalyticsManagerProps {
  farmers: Farmer[];
  lands: Land[];
  crops: Crop[];
  transactions: Transaction[];
}

export function AnalyticsManager({ farmers, lands, crops, transactions }: AnalyticsManagerProps) {
  const analytics = useMemo(() => {
    const safeTransactions = transactions || [];
    const safeCrops = crops || [];
    const safeFarmers = farmers || [];
    const safeLands = lands || [];
    
    // Monthly trends
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i;
      const monthTransactions = safeTransactions.filter(t => {
        const date = new Date(t.transactionDate);
        return date.getMonth() === month && date.getFullYear() === new Date().getFullYear();
      });
      
      const monthCrops = safeCrops.filter(c => {
        if (!c.actualHarvestDate) return false;
        const date = new Date(c.actualHarvestDate);
        return date.getMonth() === month && date.getFullYear() === new Date().getFullYear();
      });

      return {
        month: new Date(2024, month).toLocaleString('default', { month: 'short' }),
        revenue: monthTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.totalAmount, 0),
        expenses: monthTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalAmount, 0),
        harvest: monthCrops.reduce((sum, c) => sum + (c.actualYield || 0), 0)
      };
    });

    // Yield efficiency analysis
    const yieldEfficiency = safeCrops
      .filter(c => c.actualYield && c.expectedYield)
      .map(c => ({
        efficiency: ((c.actualYield! / c.expectedYield) * 100),
        cropType: c.cropType,
        area: c.areaPlanted
      }));

    // Farmer performance
    const farmerPerformance = safeFarmers.map(farmer => {
      const farmerCrops = safeCrops.filter(c => c.farmerId === farmer.id);
      const farmerTransactions = safeTransactions.filter(t => t.farmerId === farmer.id && t.type === 'sale');
      const totalRevenue = farmerTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const totalHarvest = farmerCrops.reduce((sum, c) => sum + (c.actualYield || 0), 0);
      const totalArea = safeLands.filter(l => l.farmerId === farmer.id).reduce((sum, l) => sum + l.area, 0);

      return {
        name: `${farmer.firstName} ${farmer.lastName}`,
        revenue: totalRevenue,
        harvest: totalHarvest,
        area: totalArea,
        efficiency: totalArea > 0 ? totalHarvest / totalArea : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Crop type analysis
    const cropAnalysis = safeCrops.reduce((acc, crop) => {
      if (!acc[crop.cropType]) {
        acc[crop.cropType] = {
          totalPlanted: 0,
          totalHarvested: 0,
          totalRevenue: 0,
          avgYield: 0,
          count: 0
        };
      }
      
      acc[crop.cropType].totalPlanted += crop.areaPlanted;
      acc[crop.cropType].totalHarvested += crop.actualYield || 0;
      acc[crop.cropType].count += 1;
      
      const cropTransactions = safeTransactions.filter(t => t.produce === crop.cropType && t.type === 'sale');
      acc[crop.cropType].totalRevenue += cropTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.keys(cropAnalysis).forEach(cropType => {
      const data = cropAnalysis[cropType];
      data.avgYield = data.totalPlanted > 0 ? data.totalHarvested / data.totalPlanted : 0;
    });

    return {
      monthlyData,
      yieldEfficiency,
      farmerPerformance,
      cropAnalysis
    };
  }, [farmers, lands, crops, transactions]);

  const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
        <p className="text-gray-600 text-sm lg:text-base">Deep insights into farming operations and performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <MetricCard
          title="Avg Yield Efficiency"
          value={`${analytics.yieldEfficiency.length > 0 ? (analytics.yieldEfficiency.reduce((sum, y) => sum + y.efficiency, 0) / analytics.yieldEfficiency.length).toFixed(1) : '0.0'}%`}
          change={5.2}
          icon={Target}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <MetricCard
          title="Top Farmer Revenue"
          value={`₱${analytics.farmerPerformance.length > 0 ? analytics.farmerPerformance[0].revenue.toLocaleString() : '0'}`}
          change={12.3}
          icon={TrendingUp}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <MetricCard
          title="Best Crop ROI"
          value={Object.keys(analytics.cropAnalysis).length > 0 ? Object.keys(analytics.cropAnalysis)[0] : 'N/A'}
          icon={BarChart3}
          color="bg-gradient-to-br from-purple-500 to-pink-600"
        />
        <MetricCard
          title="Active Farmers"
          value={(farmers || []).filter(f => f.isActive).length}
          change={8.1}
          icon={Calendar}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue vs Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue vs Expenses</h3>
          <Line
            data={{
              labels: analytics.monthlyData.map(d => d.month),
              datasets: [
                {
                  label: 'Revenue',
                  data: analytics.monthlyData.map(d => d.revenue),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4
                },
                {
                  label: 'Expenses',
                  data: analytics.monthlyData.map(d => d.expenses),
                  borderColor: 'rgb(239, 68, 68)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  tension: 0.4
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true } }
            }}
          />
        </div>

        {/* Yield Efficiency Scatter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yield Efficiency by Area</h3>
          {analytics.yieldEfficiency.length > 0 ? (
            <Scatter
              data={{
                datasets: [{
                  label: 'Crops',
                  data: analytics.yieldEfficiency.map(y => ({ x: y.area, y: y.efficiency })),
                  backgroundColor: 'rgba(16, 185, 129, 0.6)',
                  borderColor: 'rgb(16, 185, 129)'
                }]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { title: { display: true, text: 'Area Planted (ha)' } },
                  y: { title: { display: true, text: 'Efficiency (%)' } }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No yield efficiency data available</p>
            </div>
          )}
        </div>

        {/* Crop Type Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Type Revenue</h3>
          {Object.keys(analytics.cropAnalysis).length > 0 ? (
            <Bar
              data={{
                labels: Object.keys(analytics.cropAnalysis),
                datasets: [{
                  label: 'Revenue (₱)',
                  data: Object.values(analytics.cropAnalysis).map((c: any) => c.totalRevenue),
                  backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                  ]
                }]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No crop revenue data available</p>
            </div>
          )}
        </div>

        {/* Top Farmers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Farmers</h3>
          {analytics.farmerPerformance.length > 0 ? (
            <div className="space-y-3">
              {analytics.farmerPerformance.slice(0, 5).map((farmer, index) => (
                <div key={farmer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base">{farmer.name}</p>
                      <p className="text-xs lg:text-sm text-gray-500">{farmer.harvest.toLocaleString()} kg harvested</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600 text-sm lg:text-base">₱{farmer.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{farmer.efficiency.toFixed(1)} kg/ha</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>No farmer performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Analysis Summary</h3>
        {Object.keys(analytics.cropAnalysis).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop Type
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Area (ha)
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Harvest (kg)
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Yield (kg/ha)
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue (₱)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analytics.cropAnalysis).map(([cropType, data]: [string, any]) => (
                  <tr key={cropType}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cropType}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.totalPlanted.toFixed(1)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.totalHarvested.toLocaleString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.avgYield.toFixed(1)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₱{data.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>No crop analysis data available</p>
          </div>
        )}
      </div>
    </div>
  );
}