import { useMemo } from 'react';
import { Users, MapPin, Sprout, DollarSign } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import type { Farmer, Land, Crop, Transaction } from '../types';

interface DashboardProps {
  farmers?: Farmer[];
  lands?: Land[];
  crops?: Crop[];
  transactions?: Transaction[];
}

export function Dashboard({ farmers = [], lands = [], crops = [], transactions = [] }: DashboardProps) {
  // Ensure all props have default values to prevent undefined access
  const safeFarmers = farmers || [];
  const safeLands = lands || [];
  const safeCrops = crops || [];
  const safeTransactions = transactions || [];

  const stats = useMemo(() => {
    const totalFarmers = safeFarmers.length;
    const activeFarmers = safeFarmers.filter(f => f.isActive).length;
    const totalLands = safeLands.length;
    const totalArea = safeLands.reduce((sum, land) => sum + land.area, 0);
    const totalCrops = safeCrops.length;
    const harvestedCrops = safeCrops.filter(c => c.status === 'harvested').length;
    const totalHarvest = safeCrops.reduce((sum, crop) => sum + (crop.actualYield || 0), 0);
    const totalRevenue = safeTransactions
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
  }, [safeFarmers, safeLands, safeCrops, safeTransactions]);

  const chartData = useMemo(() => {
    // Crop status distribution
    const cropStatusData = safeCrops.reduce((acc, crop) => {
      acc[crop.status] = (acc[crop.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly harvest data (last 6 months)
    const monthlyHarvest = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const monthCrops = safeCrops.filter(crop => {
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
    const barangayData = safeFarmers.reduce((acc, farmer) => {
      acc[farmer.barangay] = (acc[farmer.barangay] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      cropStatusData,
      monthlyHarvest,
      barangayData
    };
  }, [safeCrops, safeFarmers]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color, emoji }: any) => (
    <div className="glass-card rounded-xl p-4 lg:p-6 hover:bg-amber-900/25 transition-all duration-300 animate-float">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-glass-muted mb-1">{title}</p>
          <p className="text-xl lg:text-2xl font-bold text-glass">{value}</p>
          {subtitle && <p className="text-xs lg:text-sm text-glass-light mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 ${color} rounded-lg flex items-center justify-center animate-glow relative`}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          <span className="absolute -top-1 -right-1 text-lg animate-sprout">{emoji}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-3xl lg:text-4xl animate-float">🌾</span>
          <h1 className="text-2xl lg:text-3xl font-bold text-glass">AgriTracker Dashboard</h1>
          <span className="text-2xl lg:text-3xl animate-sprout">🚜</span>
        </div>
        <p className="text-glass-muted text-sm lg:text-base flex items-center">
          <span className="mr-2">🌱</span>
          Complete overview of your farming operations and crop management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Total Farmers"
          value={stats.totalFarmers}
          subtitle={`${stats.activeFarmers} active`}
          icon={Users}
          color="bg-gradient-to-br from-amber-600 to-orange-700"
          emoji="👨‍🌾"
        />
        <StatCard
          title="Total Lands"
          value={stats.totalLands}
          subtitle={`${stats.totalArea.toFixed(1)} hectares`}
          icon={MapPin}
          color="bg-gradient-to-br from-green-600 to-emerald-700"
          emoji="🏞️"
        />
        <StatCard
          title="Active Crops"
          value={stats.totalCrops}
          subtitle={`${stats.harvestedCrops} harvested`}
          icon={Sprout}
          color="bg-gradient-to-br from-emerald-500 to-green-600"
          emoji="🌱"
        />
        <StatCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          subtitle={`${stats.totalHarvest.toLocaleString()} kg harvested`}
          icon={DollarSign}
          color="bg-gradient-to-br from-yellow-600 to-amber-700"
          emoji="💰"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Crop Growth Status Chart */}
        <div className="glass-card rounded-xl p-4 lg:p-6 plant-chart">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl animate-sprout">🌱</span>
            <h3 className="text-lg font-semibold text-glass">Crop Growth Distribution</h3>
          </div>
          <div className="h-64 animate-plant-grow">
            {Object.keys(chartData.cropStatusData).length > 0 ? (
              <Doughnut
                data={{
                  labels: Object.keys(chartData.cropStatusData).map(status => {
                    const statusMap = {
                      planted: '🌰 Planted',
                      growing: '🌿 Growing', 
                      ready: '🌾 Ready',
                      harvested: '🚜 Harvested'
                    };
                    return statusMap[status as keyof typeof statusMap] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');
                  }),
                  datasets: [{
                    data: Object.values(chartData.cropStatusData),
                  backgroundColor: [
                    'rgba(217, 119, 6, 0.8)',   // amber for planted
                    'rgba(34, 197, 94, 0.8)',   // green for growing
                    'rgba(251, 146, 60, 0.8)',  // orange for ready
                    'rgba(16, 185, 129, 0.8)'   // emerald for harvested
                  ],
                  borderColor: [
                    'rgb(217, 119, 6)',
                    'rgb(34, 197, 94)', 
                    'rgb(251, 146, 60)',
                    'rgb(16, 185, 129)'
                  ],
                  borderWidth: 3,
                  hoverOffset: 8
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { 
                      color: 'rgba(255, 248, 220, 0.9)',
                      font: { size: 12 },
                      padding: 15
                    }
                  }
                },
                animation: {
                  animateRotate: true,
                  animateScale: true,
                  duration: 2000
                }
              }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-glass-muted">
                <p>No crop data available</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium status-planted border">
              🌰 Seeded
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium status-growing border">
              🌿 Growing
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium status-ready border">
              🌾 Mature
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium status-harvested border">
              🚜 Harvested
            </span>
          </div>
        </div>

        {/* Plant Growth Trend */}
        <div className="glass-card rounded-xl p-4 lg:p-6 plant-chart">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl animate-float">📈</span>
            <h3 className="text-lg font-semibold text-glass">Harvest Growth Trend</h3>
            <span className="text-lg animate-sprout">🌾</span>
          </div>
          <div className="h-64 animate-plant-grow">
            <Line
              data={{
                labels: chartData.monthlyHarvest.map(d => d.month),
                datasets: [{
                  label: '🌾 Harvest Yield (kg)',
                  data: chartData.monthlyHarvest.map(d => d.harvest),
                  borderColor: 'rgb(34, 197, 94)',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  tension: 0.4,
                  borderWidth: 4,
                  pointBackgroundColor: 'rgb(34, 197, 94)',
                  pointBorderColor: 'rgba(255, 248, 220, 0.9)',
                  pointBorderWidth: 3,
                  pointRadius: 8,
                  pointHoverRadius: 12,
                  fill: true,
                  pointStyle: 'circle'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { 
                      color: 'rgba(255, 248, 220, 0.9)',
                      font: { size: 12 },
                      usePointStyle: true
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { 
                      color: 'rgba(255, 248, 220, 0.8)',
                      font: { size: 11 }
                    },
                    grid: { 
                      color: 'rgba(255, 248, 220, 0.1)',
                    }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { 
                      color: 'rgba(255, 248, 220, 0.8)',
                      font: { size: 11 },
                      callback: function(value) {
                        return value + ' kg';
                      }
                    },
                    grid: { 
                      color: 'rgba(255, 248, 220, 0.1)',
                    }
                  }
                },
                animation: {
                  duration: 2000,
                  easing: 'easeOutQuart'
                }
              }}
            />
          </div>
          <div className="mt-4 soil-moisture h-3 rounded-full"></div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-glass-muted flex items-center">
              <span className="mr-1">🌧️</span>
              Soil moisture & growth conditions
            </p>
            <p className="text-xs text-glass-muted flex items-center">
              <span className="mr-1">🌡️</span>
              Optimal growing temperature
            </p>
          </div>
        </div>
      </div>

      {/* Recent Harvest Activity */}
      <div className="glass-card rounded-xl p-4 lg:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xl animate-float">📊</span>
          <h3 className="text-lg font-semibold text-glass">Recent Harvest Activity</h3>
          <span className="text-lg animate-sprout">🌾</span>
        </div>
        <div className="space-y-3">
          {safeTransactions.slice(0, 5).map((transaction) => {
            const farmer = safeFarmers.find(f => f.id === transaction.farmerId);
            const produceEmoji = {
              'Rice': '🌾',
              'Corn': '🌽', 
              'Vegetables': '🥬',
              'Fruits': '🍎',
              'Cassava': '🍠'
            };
            return (
              <div key={transaction.id} className="flex items-center justify-between p-3 glass rounded-lg hover:bg-amber-900/20 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center relative animate-glow">
                    <DollarSign className="w-4 h-4 text-white" />
                    <span className="absolute -top-1 -right-1 text-sm">
                      {produceEmoji[transaction.produce as keyof typeof produceEmoji] || '🌱'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-glass flex items-center">
                      <span className="mr-1">👨‍🌾</span>
                      {farmer?.firstName} {farmer?.lastName} - {transaction.produce}
                    </p>
                    <p className="text-xs text-glass-light flex items-center">
                      <span className="mr-1">{transaction.type === 'sale' ? '📦' : '🛒'}</span>
                      {transaction.type === 'sale' ? 'Sold' : 'Purchased'} {transaction.quantity.toLocaleString()} kg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-300 flex items-center justify-end">
                    <span className="mr-1">💰</span>
                    ₱{transaction.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-glass-light flex items-center justify-end">
                    <span className="mr-1">📅</span>
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          }).filter(Boolean)}
        </div>
      </div>
    </div>
  );
}