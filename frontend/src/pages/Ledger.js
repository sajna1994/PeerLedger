import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { 
  BookOpen, TrendingUp, TrendingDown, CheckCircle, 
  Clock, Search, Filter, Download, 
  ArrowUpRight, ArrowDownLeft, XCircle,
  Eye, EyeOff, ChevronDown, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Ledger = () => {
  const { token } = useAuth();
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('ledger');
  const [showSummary, setShowSummary] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    settledCount: 0,
    settledValue: 0,
    pendingCount: 0,
    pendingValue: 0,
    failedCount: 0,
    netBalance: 0
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data.transactions || [];
      setTransactions(data);
      calculateSummary(data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const calculateSummary = (data) => {
    const s = data.reduce((acc, t) => {
      if (t.type === 'lend') acc.totalDebit += t.amount;
      else acc.totalCredit += t.amount;

      if (t.status === 'settled') {
        acc.settledCount++;
        acc.settledValue += t.amount;
      } else if (t.status === 'pending') {
        acc.pendingCount++;
        acc.pendingValue += t.amount;
      } else if (t.status === 'overdue') {
        acc.failedCount++;
      }
      return acc;
    }, { totalDebit: 0, totalCredit: 0, settledCount: 0, settledValue: 0, pendingCount: 0, pendingValue: 0, failedCount: 0 });
    
    s.netBalance = s.totalDebit - s.totalCredit;
    setSummary(s);
  };

  const filterByDate = (transaction) => {
    if (dateRange === 'all') return true;
    const date = new Date(transaction.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    switch(dateRange) {
      case 'week': return daysDiff <= 7;
      case 'month': return daysDiff <= 30;
      default: return true;
    }
  };

  const filteredData = transactions.filter(t => {
    const searchMatch = searchTerm === '' || 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.type === 'lend' ? t.borrower?.name : t.lender?.name)?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch && filterByDate(t);
  });

  const getPartyName = (t) => {
    return t.type === 'lend' ? t.borrower?.name : t.lender?.name;
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 bg-slate-50 min-h-screen">
      
      {/* Header with Logo - Mobile Responsive */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="p-2 sm:p-3 bg-gradient-to-br  rounded-lg sm:rounded-xl shadow-lg">
<BookOpen className="text-blue-600 w-5 h-5 sm:w-7 sm:h-7" />        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight"><span className='bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text'>Peer</span><span className='text-gray-800'></span>Ledger</h1>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Track your Debits & Credits</p>
        </div>
      </div>

      {/* View Toggle Buttons - Mobile Responsive */}
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          <button 
            onClick={() => setViewMode('ledger')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
              viewMode === 'ledger' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Ledger
          </button>
          <button 
            onClick={() => setViewMode('summary')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
              viewMode === 'summary' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Summary
          </button>
          <button 
            onClick={() => setViewMode('transactions')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
              viewMode === 'transactions' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Transactions
          </button>
        </div>
        
        {/* Mobile Summary Toggle */}
        <button 
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="lg:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          title={showMobileSummary ? "Hide Summary" : "Show Summary"}
        >
          {showMobileSummary ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        
        {/* Desktop Summary Toggle */}
        <button 
          onClick={() => setShowSummary(!showSummary)}
          className="hidden lg:block ml-auto p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          title={showSummary ? "Hide Summary" : "Show Summary"}
        >
          {showSummary ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Search and Filter Bar - Mobile Responsive */}
      <div className="space-y-3 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
        >
          <span className="text-sm font-medium text-slate-600">Filters & Options</span>
          <ChevronDown size={18} className={`transform transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Filter Options - Responsive */}
        <div className={`${showMobileFilters ? 'block' : 'hidden lg:flex'} flex-col lg:flex-row items-center gap-3`}>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full lg:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          <div className="flex w-full lg:w-auto gap-2">
            <button className="flex-1 lg:flex-none p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <Filter size={18} className="mx-auto" />
            </button>
            <button className="flex-1 lg:flex-none p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              <Download size={18} className="mx-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className={`grid gap-6 ${
        (showSummary || showMobileSummary) ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'
      }`}>
        
        {/* LEDGER TABLE SECTION */}
        <div className={`${(showSummary || showMobileSummary) ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              {filteredData.length > 0 ? (
                filteredData.map((t) => (
                  <div key={t._id} className="p-4 border-b border-slate-100 hover:bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs text-slate-500 font-mono">
                          {format(new Date(t.createdAt), 'MM/dd/yyyy')}
                        </span>
                        <h3 className="font-medium text-slate-800 mt-1">{t.description}</h3>
                        <p className="text-xs text-slate-500">With: {getPartyName(t)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === 'settled' ? 'bg-green-100 text-green-700' :
                        t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t.status === 'settled' && <CheckCircle size={10} />}
                        {t.status === 'pending' && <Clock size={10} />}
                        {t.status === 'overdue' && <XCircle size={10} />}
                        {t.status === 'settled' ? 'Settled' :
                         t.status === 'pending' ? 'Pending' : 'Failed'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-red-50 p-2 rounded-lg">
                        <span className="text-[10px] text-red-600 font-medium uppercase">Debit</span>
                        {t.type === 'lend' ? (
                          <p className="text-sm font-bold text-red-600 flex items-center gap-1">
                            <ArrowDownLeft size={12} />
                            ₹{t.amount.toLocaleString('en-IN')}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400">—</p>
                        )}
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-lg">
                        <span className="text-[10px] text-emerald-600 font-medium uppercase">Credit</span>
                        {t.type === 'borrow' ? (
                          <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                            <ArrowUpRight size={12} />
                            ₹{t.amount.toLocaleString('en-IN')}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400">—</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        t.type === 'lend' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {t.type === 'lend' ? 'Debit' : 'Credit'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">No transactions found</div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                    <th className="p-4 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                    <th className="p-4 text-right text-xs font-semibold text-slate-600 uppercase">Debit</th>
                    <th className="p-4 text-right text-xs font-semibold text-slate-600 uppercase">Credit</th>
                    <th className="p-4 text-center text-xs font-semibold text-slate-600 uppercase">Type</th>
                    <th className="p-4 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length > 0 ? (
                    filteredData.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-600 font-mono text-xs">
                          {format(new Date(t.createdAt), 'MM/dd/yyyy')}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{t.description}</div>
                          <div className="text-xs text-slate-500 mt-0.5">With: {getPartyName(t)}</div>
                        </td>
                        <td className="p-4 text-right">
                          {t.type === 'lend' ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-red-600">
                              <ArrowDownLeft size={14} />
                              ₹{t.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="p-4 text-right">
                          {t.type === 'borrow' ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                              <ArrowUpRight size={14} />
                              ₹{t.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            t.type === 'lend' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {t.type === 'lend' ? 'Debit' : 'Credit'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            t.status === 'settled' ? 'bg-green-100 text-green-700' :
                            t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {t.status === 'settled' && <CheckCircle size={12} />}
                            {t.status === 'pending' && <Clock size={12} />}
                            {t.status === 'overdue' && <XCircle size={12} />}
                            {t.status === 'settled' ? 'Settled' :
                             t.status === 'pending' ? 'Pending' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="p-12 text-center text-slate-500">No transactions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ACCOUNT LEDGER SUMMARY - Responsive */}
        {(showSummary || showMobileSummary) && (
          <div className="lg:col-span-1 space-y-4">
            {/* Mobile Summary Header */}
            <div className="lg:hidden flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Account Summary</h3>
              <button 
                onClick={() => setShowMobileSummary(false)}
                className="p-1.5 bg-slate-100 rounded-lg"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Main Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                Account Ledger Summary
              </h3>
              
              {/* Total Debit */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Debit</span>
                  <span className="text-base sm:text-lg font-black text-red-600">
                    ₹{summary.totalDebit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" 
                    style={{ width: `${Math.min((summary.totalDebit / (summary.totalDebit + summary.totalCredit || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Total Credit */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Credit</span>
                  <span className="text-base sm:text-lg font-black text-emerald-600">
                    ₹{summary.totalCredit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" 
                    style={{ width: `${Math.min((summary.totalCredit / (summary.totalDebit + summary.totalCredit || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Current Balance */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase mb-1">Current Balance</p>
                <p className={`text-xl sm:text-2xl font-black ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ₹{Math.abs(summary.netBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                </p>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  {summary.netBalance >= 0 ? 'You are owed money' : 'You owe money'}
                </p>
              </div>
            </div>

            {/* Stats Cards - Responsive Grid on Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {/* Settled Details Card */}
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-xl shadow-lg overflow-hidden">
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-emerald-600/30">
                  <h4 className="text-[10px] sm:text-xs font-bold text-emerald-100 uppercase">Settled</h4>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-center text-white text-sm sm:text-base">
                    <span>Count</span>
                    <span className="font-black">{summary.settledCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-white text-sm sm:text-base mt-2">
                    <span>Value</span>
                    <span className="font-black">₹{summary.settledValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Pending Details Card */}
              <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-lg overflow-hidden">
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-amber-500/30">
                  <h4 className="text-[10px] sm:text-xs font-bold text-amber-100 uppercase">Pending</h4>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-center text-white text-sm sm:text-base">
                    <span>Count</span>
                    <span className="font-black">{summary.pendingCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-white text-sm sm:text-base mt-2">
                    <span>Value</span>
                    <span className="font-black">₹{summary.pendingValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Card (if any) */}
            {summary.failedCount > 0 && (
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 bg-red-500/30">
                  <h4 className="text-xs font-bold text-red-100 uppercase">Failed</h4>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center text-white">
                    <span className="text-sm font-medium">Count</span>
                    <span className="text-lg font-black">{summary.failedCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend - Responsive */}
      <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs bg-white p-3 rounded-lg border border-slate-200">
        <span className="font-medium text-slate-700">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-100 rounded-full border border-green-300"></div>
          <span className="text-slate-600">Settled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-100 rounded-full border border-yellow-300"></div>
          <span className="text-slate-600">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-100 rounded-full border border-red-300"></div>
          <span className="text-slate-600">Failed</span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
        <div className="flex items-center gap-1.5">
          <ArrowDownLeft size={10} className="sm:w-3 sm:h-3 text-red-600" />
          <span className="text-slate-600">Debit (You Lend)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpRight size={10} className="sm:w-3 sm:h-3 text-emerald-600" />
          <span className="text-slate-600">Credit (You Borrow)</span>
        </div>
      </div>
    </div>
  );
};

export default Ledger;