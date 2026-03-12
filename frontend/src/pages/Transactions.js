import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Filter, Search, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination'; // Add this import

const Transactions = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleStatusUpdate = async (transactionId, newStatus) => {
    setProcessingId(transactionId);
    try {
      const response = await axios.patch(
        `${API_URL}/transactions/${transactionId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message || `Transaction marked as ${newStatus}`);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
      setShowConfirmModal(false);
      setSelectedTransaction(null);
    }
  };

  const openConfirmModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedTransaction(null);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (filter !== 'all' && transaction.status !== filter) return false;
    if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const otherParty = transaction.type === 'lend' 
        ? transaction.borrower?.name 
        : transaction.lender?.name;
      
      return transaction.description.toLowerCase().includes(searchLower) ||
             otherParty?.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  // Pagination logic
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter, searchTerm]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      settled: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={10} className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Transactions</h1>
        <Link
          to="/transactions/new"
          className="w-full sm:w-auto btn-primary flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <span>Add Transaction</span>
        </Link>
      </div>

      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="lg:hidden w-full mb-4 btn-secondary flex items-center justify-center space-x-2"
      >
        <Filter size={18} />
        <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        <ChevronDown size={18} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {/* Filters - Responsive */}
      <div className={`bg-white rounded-lg shadow p-4 mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 text-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field pl-9 appearance-none text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field pl-9 appearance-none text-sm"
            >
              <option value="all">All Types</option>
              <option value="lend">Lent</option>
              <option value="borrow">Borrowed</option>
            </select>
            {typeFilter === 'lend' ? (
              <ArrowUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={18} />
            ) : typeFilter === 'borrow' ? (
              <ArrowDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600" size={18} />
            ) : (
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            )}
          </div>
          
          <div className="text-right text-sm text-gray-600 flex items-center justify-end">
            {totalItems} transaction{totalItems !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Transactions List - Responsive Card Layout */}
      <div className="space-y-3">
        {paginatedTransactions.length > 0 ? (
          paginatedTransactions.map((transaction) => (
            <div key={transaction._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base truncate">
                    {transaction.description}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {transaction.type === 'lend' ? 'Lent to' : 'Borrowed from'}{' '}
                    <span className="font-medium">
                      {transaction.type === 'lend' 
                        ? transaction.borrower?.name 
                        : transaction.lender?.name}
                    </span>
                  </p>
                </div>
                {getStatusBadge(transaction.status)}
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-500">
                  <div>{format(new Date(transaction.createdAt), 'MMM dd, yyyy')}</div>
                  {transaction.dueDate && (
                    <div className="text-xs">Due: {format(new Date(transaction.dueDate), 'MMM dd, yyyy')}</div>
                  )}
                </div>
                
                <div className="text-right">
                  <p className={`text-xl font-bold ${
                    transaction.type === 'lend' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'lend' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {transaction.notes && (
                <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {transaction.notes}
                </p>
              )}
              
              {transaction.status === 'pending' && (
                <button
                  onClick={() => openConfirmModal(transaction)}
                  disabled={processingId === transaction._id}
                  className="mt-3 w-full sm:w-auto text-sm bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingId === transaction._id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>
                        {transaction.type === 'lend' 
                          ? 'Mark as Received' 
                          : 'Mark as Paid'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4 text-sm sm:text-base">No transactions found</p>
            <Link
              to="/transactions/new"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
            >
              Create your first transaction
            </Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Settlement</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-600">
                  {selectedTransaction.type === 'lend' 
                    ? 'Have you received the money from the borrower?'
                    : 'Have you paid the money to the lender?'}
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Description</span>
                    <span className="text-sm font-medium">{selectedTransaction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Amount</span>
                    <span className={`text-sm font-bold ${
                      selectedTransaction.type === 'lend' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTransaction.type === 'lend' ? '+' : '-'}₹{selectedTransaction.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">With</span>
                    <span className="text-sm">
                      {selectedTransaction.type === 'lend' 
                        ? selectedTransaction.borrower?.name 
                        : selectedTransaction.lender?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Your Role</span>
                    <span className="text-sm font-medium capitalize">
                      {selectedTransaction.type === 'lend' ? 'Lender' : 'Borrower'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Date</span>
                    <span className="text-sm">
                      {format(new Date(selectedTransaction.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <span className="font-medium">Note:</span> By confirming, you acknowledge that this transaction has been settled. Both parties will see this transaction as completed.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={closeConfirmModal}
                  className="flex-1 btn-secondary text-sm py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedTransaction._id, 'settled')}
                  disabled={processingId === selectedTransaction._id}
                  className="flex-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === selectedTransaction._id ? 'Processing...' : 'Yes, Mark as Settled'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;