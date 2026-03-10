import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Users,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const [data, setData] = useState({
    transactions: [],
    summary: {
      totalBorrowed: 0,
      totalLent: 0,
      pendingBorrowed: 0,
      pendingLent: 0,
      netBalance: 0
    }
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = [
    {
      title: 'Total Lent',
      value: `₹${data.summary.totalLent.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subValue: `Pending: ₹${data.summary.pendingLent.toFixed(2)}`
    },
    {
      title: 'Total Borrowed',
      value: `₹${data.summary.totalBorrowed.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subValue: `Pending: ₹${data.summary.pendingBorrowed.toFixed(2)}`
    },
    {
      title: 'Net Balance',
      value: `₹${Math.abs(data.summary.netBalance).toFixed(2)}`,
      icon: DollarSign,
      color: data.summary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: 'bg-blue-100',
      subValue: data.summary.netBalance >= 0 ? 'You are owed' : 'You owe'
    },
    {
      title: 'Pending Lent',
      value: `₹${data.summary.pendingLent.toFixed(2)}`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      subValue: `${data.transactions.filter(t => t.status === 'pending' && t.type === 'lend').length} transactions`
    },
    {
      title: 'Pending Borrowed',
      value: `₹${data.summary.pendingBorrowed.toFixed(2)}`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      subValue: `${data.transactions.filter(t => t.status === 'pending' && t.type === 'borrow').length} transactions`
    }
  ];

  // Prepare chart data
  const recentTransactions = data.transactions.slice(0, 5);
  
  const monthlyData = data.transactions.reduce((acc, transaction) => {
    const month = format(new Date(transaction.createdAt), 'MMM yyyy');
    if (!acc[month]) {
      acc[month] = { month, lent: 0, borrowed: 0 };
    }
    if (transaction.type === 'lend') {
      acc[month].lent += transaction.amount;
    } else {
      acc[month].borrowed += transaction.amount;
    }
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).slice(-6);

  const pieData = [
    { name: 'Lent', value: data.summary.pendingLent },
    { name: 'Borrowed', value: data.summary.pendingBorrowed }
  ];

  const COLORS = ['#10B981', '#EF4444'];

  // Calculate party type distribution
  const userTransactions = data.transactions.filter(t => 
    (t.lenderModel === 'User' || t.borrowerModel === 'User')
  ).length;
  
  const externalTransactions = data.transactions.filter(t => 
    t.lenderModel === 'ExternalParty' || t.borrowerModel === 'ExternalParty'
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 max-w-7xl mx-auto">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Welcome back! Here's your financial overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/transactions/new"
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <span>+ New Transaction</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-slate-400">Current</span>
              </div>
              <div className="mt-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${stat.color} mt-1`}>
                  {stat.value}
                </p>
                {stat.subValue && (
                  <p className="text-xs text-slate-500 mt-1">{stat.subValue}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
        {/* Monthly Overview Chart - 2/3 width on desktop */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">Monthly Overview</h2>
            <select className="text-xs sm:text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, '']}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="lent" fill="#10B981" name="Lent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="borrowed" fill="#EF4444" name="Borrowed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats - 1/3 width on desktop */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Quick Stats</h2>
          
          {/* Balance Distribution Pie Chart - Mobile Only */}
          <div className="block lg:hidden h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-slate-600">Total Lent</span>
              </div>
              <span className="text-sm sm:text-base font-semibold text-green-600">
                ₹{data.summary.totalLent.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs sm:text-sm text-slate-600">Total Borrowed</span>
              </div>
              <span className="text-sm sm:text-base font-semibold text-red-600">
                ₹{data.summary.totalBorrowed.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={14} className="text-green-500" />
                <span className="text-xs sm:text-sm text-slate-600">Pending Receivables</span>
              </div>
              <span className="text-sm sm:text-base font-semibold text-green-600">
                ₹{data.summary.pendingLent.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ArrowDownLeft size={14} className="text-red-500" />
                <span className="text-xs sm:text-sm text-slate-600">Pending Payables</span>
              </div>
              <span className="text-sm sm:text-base font-semibold text-red-600">
                ₹{data.summary.pendingBorrowed.toFixed(2)}
              </span>
            </div>

          
          </div>

          {/* Desktop Pie Chart */}
          <div className="hidden lg:block h-48 mt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Pending Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">Recent Transactions</h2>
              <p className="text-xs text-slate-500 mt-1">Your latest financial activities</p>
            </div>
            <Link 
              to="/transactions" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Party</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">
                      {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'lend' 
                          ? transaction.borrower?.name 
                          : transaction.lender?.name}
                        {transaction.lenderModel === 'ExternalParty' || transaction.borrowerModel === 'ExternalParty' ? (
                          <Building2 size={12} className="text-purple-500" />
                        ) : (
                          <Users size={12} className="text-blue-500" />
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      transaction.type === 'lend' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'lend' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'settled' 
                          ? 'bg-green-100 text-green-700'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div key={transaction._id} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-slate-500">
                      {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                    </span>
                    <h3 className="font-medium text-slate-800 mt-1">{transaction.description}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    transaction.status === 'settled' 
                      ? 'bg-green-100 text-green-700'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    {transaction.type === 'lend' ? 'Lent to' : 'Borrowed from'}:
                    <span className="font-medium text-slate-700 ml-1">
                      {transaction.type === 'lend' 
                        ? transaction.borrower?.name 
                        : transaction.lender?.name}
                    </span>
                  </div>
                  <p className={`font-bold ${
                    transaction.type === 'lend' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'lend' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Wallet size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm">No transactions yet</p>
              <Link 
                to="/transactions/new" 
                className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Create your first transaction
              </Link>
            </div>
          )}
        </div>

        {/* View All Link for Mobile */}
        {recentTransactions.length > 0 && (
          <div className="sm:hidden p-4 border-t border-slate-100 text-center">
            <Link 
              to="/transactions" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Transactions →
            </Link>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
        <div className="bg-white p-3 rounded-lg border border-slate-100">
          <span className="block font-medium text-slate-700">Total Transactions</span>
          <span className="text-lg font-bold text-slate-800">{data.transactions.length}</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-100">
          <span className="block font-medium text-slate-700">Settled</span>
          <span className="text-lg font-bold text-green-600">
            {data.transactions.filter(t => t.status === 'settled').length}
          </span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-100">
          <span className="block font-medium text-slate-700">Pending</span>
          <span className="text-lg font-bold text-yellow-600">
            {data.transactions.filter(t => t.status === 'pending').length}
          </span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-100">
          <span className="block font-medium text-slate-700">Parties</span>
          <span className="text-lg font-bold text-blue-600">
            {new Set([
              ...data.transactions.map(t => t.lender?._id),
              ...data.transactions.map(t => t.borrower?._id)
            ].filter(Boolean)).size}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;