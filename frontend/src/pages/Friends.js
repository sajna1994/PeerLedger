import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Building2, 
  ChevronLeft, 
  AlertCircle,
  User,
  Mail,
  Phone,
  Tag,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Pagination from '../components/Pagination';
import CreateExternalPartyModal from '../components/CreateExternalPartyModal'; // Import the modal

const Friends = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [externalParties, setExternalParties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedExternalParty, setSelectedExternalParty] = useState(null);
  const [partyTransactions, setPartyTransactions] = useState([]);
  const [partyBalance, setPartyBalance] = useState(0);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false); // State for modal
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchExternalParties = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/external-parties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExternalParties(response.data);
      console.log('External parties fetched:', response.data);
    } catch (error) {
      console.error('Failed to fetch external parties:', error);
      toast.error('Failed to load external parties');
    }
  }, [token, API_URL]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchExternalParties();
      setLoading(false);
    };
    loadData();
  }, [fetchExternalParties]);

  const searchExternalParties = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    
    setSearching(true);
    setSearchError('');
    
    try {
      console.log('Searching for external parties:', searchQuery);
      
      const response = await axios.get(
        `${API_URL}/external-parties/search?query=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Search results:', response.data);
      
      const formattedResults = (response.data || []).map(party => ({
        ...party,
        resultType: 'external'
      }));
      
      setSearchResults(formattedResults);
      
      if (formattedResults.length === 0) {
        setSearchError('No external parties found matching your search');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Failed to search. Please try again.');
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery, token, API_URL]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        searchExternalParties();
      } else {
        setSearchResults([]);
        setSearchError('');
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchExternalParties]);

  // Reset to first page when search results change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults.length, externalParties.length]);

  const viewExternalPartyTransactions = async (party) => {
    setSelectedExternalParty(party);
    setShowMobileDetail(true);
    try {
      const response = await axios.get(
        `${API_URL}/external-parties/${party._id}/transactions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPartyTransactions(response.data.transactions);
      setPartyBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch party transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  const getPartyIcon = (type) => {
    switch(type) {
      case 'corporate':
        return <Building2 className="text-purple-500" size={16} />;
      case 'organization':
        return <Building2 className="text-blue-500" size={16} />;
      case 'individual':
        return <User className="text-green-500" size={16} />;
      default:
        return <Building2 className="text-gray-500" size={16} />;
    }
  };

  // Handle new party creation
  const handlePartyCreated = (newParty) => {
    setExternalParties(prevParties => [newParty, ...prevParties]);
    toast.success('External party created successfully!');
  };

  // Format date to DD/MM/YYYY
  const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Pagination for external parties list
  const totalItems = externalParties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedParties = externalParties.slice(startIndex, endIndex);

  // Pagination for transaction history
  const transactionTotalItems = partyTransactions.length;
  const transactionTotalPages = Math.ceil(transactionTotalItems / itemsPerPage);
  const [transactionPage, setTransactionPage] = useState(1);
  const transactionStartIndex = (transactionPage - 1) * itemsPerPage;
  const transactionEndIndex = transactionStartIndex + itemsPerPage;
  const paginatedTransactions = partyTransactions.slice(transactionStartIndex, transactionEndIndex);

  // Reset transaction page when selected party changes
  useEffect(() => {
    setTransactionPage(1);
  }, [selectedExternalParty]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">External Contacts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
        >
          <Plus size={18} />
          Add New Contact
        </button>
      </div>

      {/* Mobile Back Button */}
      {showMobileDetail && (
        <button
          onClick={handleBackToList}
          className="lg:hidden flex items-center text-blue-600 mb-4"
        >
          <ChevronLeft size={20} />
          <span>Back to Contacts List</span>
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Contacts List - Hidden on mobile when detail is shown */}
        <div className={`${showMobileDetail ? 'hidden' : 'block'} lg:block lg:col-span-1`}>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
            <div className="p-3 sm:p-4 border-b">
              <h2 className="text-base sm:text-lg font-semibold flex items-center">
                <Building2 size={18} className="mr-2" />
                External Contacts ({externalParties.length})
              </h2>
            </div>
            
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search external contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 text-sm"
                />
              </div>
              
              {/* Search Results */}
              {searching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Searching...</p>
                </div>
              )}
              
              {searchError && !searching && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-700">{searchError}</p>
                </div>
              )}
              
              {searchResults.length > 0 && !searching && (
                <div className="mb-4 border rounded-lg divide-y max-h-60 overflow-y-auto">
                  <div className="p-2 bg-gray-50 sticky top-0">
                    <p className="text-xs font-medium text-gray-600">Search Results</p>
                  </div>
                  {searchResults.map((result) => (
                    <div 
                      key={`search-${result._id}`} 
                      className="p-2 sm:p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => viewExternalPartyTransactions(result)}
                    >
                      <div className="flex items-center gap-2">
                        {getPartyIcon(result.type)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{result.name}</p>
                          {result.companyName && (
                            <p className="text-xs text-gray-500 truncate">{result.companyName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* External Parties List with Pagination */}
              <div className="flex-1 flex flex-col">
                <div className="space-y-2 flex-1 overflow-y-auto min-h-[300px]">
                  {paginatedParties.length > 0 ? (
                    paginatedParties.map((party) => (
                      <button
                        key={party._id}
                        onClick={() => viewExternalPartyTransactions(party)}
                        className={`w-full p-2 sm:p-3 text-left rounded-lg transition-colors ${
                          selectedExternalParty?._id === party._id && !showMobileDetail
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-1">
                            {getPartyIcon(party.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{party.name}</p>
                            {party.companyName && (
                              <p className="text-xs text-gray-500 truncate">{party.companyName}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {party.email && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Mail size={10} /> {party.email}
                                </span>
                              )}
                              {party.phone && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone size={10} /> {party.phone}
                                </span>
                              )}
                            </div>
                            {party.tags && party.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {party.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <Building2 size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        No external contacts yet. Click the "Add New Contact" button to create one.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination for External Parties */}
                {externalParties.length > 0 && (
                  <div className="mt-4 pt-2 border-t">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className={`${!showMobileDetail ? 'hidden' : 'block'} lg:block lg:col-span-2`}>
          {selectedExternalParty ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPartyIcon(selectedExternalParty.type)}
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                        {selectedExternalParty.name}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-600 capitalize ml-7">{selectedExternalParty.type}</p>
                    
                    <div className="mt-4 space-y-2 ml-7">
                      {selectedExternalParty.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          <a href={`mailto:${selectedExternalParty.email}`} className="text-blue-600 hover:underline text-xs">
                            {selectedExternalParty.email}
                          </a>
                        </div>
                      )}
                      {selectedExternalParty.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          <a href={`tel:${selectedExternalParty.phone}`} className="text-blue-600 hover:underline text-xs">
                            {selectedExternalParty.phone}
                          </a>
                        </div>
                      )}
                      {selectedExternalParty.companyName && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-600">{selectedExternalParty.companyName}</span>
                        </div>
                      )}
                    </div>

                    {selectedExternalParty.tags && selectedExternalParty.tags.length > 0 && (
                      <div className="mt-4 ml-7">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag size={14} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedExternalParty.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedExternalParty.notes && (
                      <div className="mt-4 ml-7">
                        <p className="text-xs font-medium text-gray-700 mb-1">Notes</p>
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {selectedExternalParty.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xs sm:text-sm text-gray-600">Balance</p>
                    <p className={`text-xl sm:text-2xl font-bold ${
                      partyBalance > 0 ? 'text-green-600' : 
                      partyBalance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      ₹{Math.abs(partyBalance).toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {partyBalance > 0 
                        ? 'They owe you' 
                        : partyBalance < 0 
                        ? 'You owe them' 
                        : 'Settled up'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y">
                <h3 className="p-4 font-medium text-gray-700 bg-gray-50">Transaction History</h3>
                
                {/* Transaction List with Pagination */}
                <div className="max-h-96 overflow-y-auto">
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((transaction) => (
                      <div key={transaction._id} className="p-3 sm:p-4 hover:bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{transaction.description}</h4>
                            <p className="text-xs text-gray-600">
                              {formatDate(transaction.createdAt)}
                            </p>
                            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                              transaction.status === 'settled' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className={`font-bold text-sm sm:text-base ${
                              transaction.lender === selectedExternalParty._id
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {transaction.lender === selectedExternalParty._id ? '+' : '-'}
                              ₹{transaction.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.lender === selectedExternalParty._id
                                ? 'They lent'
                                : 'They borrowed'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 sm:p-8 text-center text-gray-500">
                      <p className="text-sm sm:text-base">No transactions with this contact yet.</p>
                    </div>
                  )}
                </div>

                {/* Pagination for Transactions */}
                {partyTransactions.length > 0 && (
                  <div className="p-4 border-t">
                    <Pagination
                      currentPage={transactionPage}
                      totalPages={transactionTotalPages}
                      totalItems={transactionTotalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setTransactionPage}
                      onItemsPerPageChange={setItemsPerPage}
                      showItemsPerPage={false}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center items-center justify-center h-64">
              <div>
                <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">
                  Select an External Contact
                </h3>
                <p className="text-sm text-gray-500">
                  Choose an external contact from the list to view their details and transaction history
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create External Party Modal */}
      <CreateExternalPartyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPartyCreated={handlePartyCreated}
      />
    </div>
  );
};

export default Friends;