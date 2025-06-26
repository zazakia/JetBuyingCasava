import React, { useMemo } from 'react';
import { Users, MapPin, Sprout, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { Farmer, Land, Crop, Transaction } from '../types';

interface DashboardProps {
  farmers: Farmer[];
  lands: Land[];
  crops: Crop[];
  transactions: Transaction[];
}

export function Dashboard({ farmers, lands, crops, transactions }: DashboardProps) {
  const stats = useMemo(() => {
    const totalFarmers = farmers.length;
    const activeFarmers = farmers.filter(f => f.isActive).length;
    const totalLands = lands.length;
    const totalArea = lands.reduce((sum, land) => sum + land.area, 0);
    const totalCrops = crops.length;
    const harvestedCrops = crops.filter(c => c.status === 'harvested').length;
    const totalHarvest = crops.reduce((sum, crop) => sum + (crop.actualYield || 0), 0);
    const totalRevenue = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    return {
      totalFarmers,
      activeFarmers,
      totalLands,
      totalArea,
      totalCrops,
      harvestedCrops,
      totalHarvest,
      totalRevenue
    };
  }, [farmers, lands, crops, transactions]);

  const chartData = useMemo(() => {
    // Crop status distribution
    const cropStatusData = crops.reduce((acc, crop) => {
      acc[crop.status] = (acc[crop.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly harvest data (last 6 months)
    const monthlyHarvest = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const monthCrops = crops.filter(crop => {
        if (!crop.actualHarvestDate) return false;
        const harvestDate = new Date(crop.actualHarvestDate);
        return harvestDate.getMonth() === date.getMonth() && 
               harvestDate.getFullYear() === date.getFullYear();
      });
      
      return {
        month: monthName,
        harvest: monthCrops.reduce((sum, crop) => sum + (crop.actualYield || 0), 0)
      };
    }).reverse();

    // Barangay distribution
    const barangayData = farmers.reduce((acc, farmer) => {
      acc[farmer.barangay] = (acc[farmer.barangay] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      cropStatusData,
      monthlyHarvest,
      barangayData
    };
  }, [crops, farmers]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="glass-card rounded-xl p-4 lg:p-6 hover:bg-white/20 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-glass-muted mb-1">{title}</p>
          <p className="text-xl lg:text-2xl font-bold text-glass">{value}</p>
          {subtitle && <p className="text-xs lg:text-sm text-glass-light mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 ${color} rounded-lg flex items-center justify-center animate-glow`}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-glass mb-2">Dashboard</h1>
        <p className="text-glass-muted text-sm lg:text-base">Overview of your farming operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Total Farmers"
          value={stats.totalFarmers}
          subtitle={`${stats.activeFarmers} active`}
          icon={Users}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Total Lands"
          value={stats.totalLands}
          subtitle={`${stats.totalArea.toFixed(1)} hectares`}
          icon={MapPin}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          title="Active Crops"
          value={stats.totalCrops}
          subtitle={`${stats.harvestedCrops} harvested`}
          icon={Sprout}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          subtitle={`${stats.totalHarvest.toLocaleString()} kg harvested`}
          icon={DollarSign}
          color="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Crop Status Chart */}
        <div className="glass-card rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-glass mb-4">Crop Status Distribution</h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: Object.keys(chartData.cropStatusData).map(status => 
                  status.charAt(0).toUpperCase() + status.slice(1)
                ),
                datasets: [{
                  data: Object.values(chartData.cropStatusData),
                  backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                  ],
                  borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(59, 130, 246)',
                    'rgb(245, 158, 11)',
                    'rgb(139, 92, 246)'
                  ],
                  borderWidth: 2
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: 'white' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Monthly Harvest Trend */}
        <div className="glass-card rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-glass mb-4">Monthly Harvest Trend</h3>
          <div className="h-64">
            <Line
              data={{
                labels: chartData.monthlyHarvest.map(d => d.month),
                datasets: [{
                  label: 'Harvest (kg)',
                  data: chartData.monthlyHarvest.map(d => d.harvest),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4,
                  borderWidth: 3,
                  pointBackgroundColor: 'rgb(16, 185, 129)',
                  pointBorderColor: 'white',
                  pointBorderWidth: 2,
                  pointRadius: 6
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: 'white' }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-xl p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-glass mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => {
            const farmer = farmers.find(f => f.id === transaction.farmerId);
            return (
              <div key={transaction.id} className="flex items-center justify-between p-3 glass rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-glass">
                      {farmer?.firstName} {farmer?.lastName} - {transaction.produce}
                    </p>
                    <p className="text-xs text-glass-light">
                      {transaction.type === 'sale' ? 'Sold' : 'Purchased'} {transaction.quantity.toLocaleString()} kg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-300">
                    ₱{transaction.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-glass-light">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}