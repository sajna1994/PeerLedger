import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Tag,
  Plus,
  Search,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import CreateExternalPartyModal from '../components/CreateExternalPartyModal';

const ExternalParties = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partyTransactions, setPartyTransactions] = useState([]);
  const [partyBalance, setPartyBalance] = useState(0);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchParties = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/external-parties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParties(response.data);
    } catch (error) {
      console.error('Failed to fetch parties:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const filteredParties = parties.filter(party => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      party.name.toLowerCase().includes(searchLower) ||
      party.email?.toLowerCase().includes(searchLower) ||
      party.companyName?.toLowerCase().includes(searchLower) ||
      party.phone?.includes(searchTerm) ||
      party.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const getPartyIcon = (type) => {
    switch(type) {
      case 'corporate':
        return <Building2 className="text-purple-500" size={20} />;
      case 'organization':
        return <Building2 className="text-blue-500" size={20} />;
      default:
        return <User className="text-green-500" size={20} />;
    }
  };

  const viewPartyDetails = async (party) => {
    setSelectedParty(party);
    setShowMobileDetail(true);
    try {
      const response = await axios.get(
        `${API_URL}/external-parties/${party._id}/transactions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPartyTransactions(response.data.transactions);
      setPartyBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    }
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">External Contacts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-9 text-sm"
        />
      </div>

      {/* Mobile Back Button */}
      {showMobileDetail && (
        <button
          onClick={() => setShowMobileDetail(false)}
          className="lg:hidden flex items-center text-blue-600 mb-4"
        >
          <ChevronRight size={20} className="transform rotate-180" />
          <span>Back to List</span>
        </button>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className={`${showMobileDetail ? 'hidden' : 'block'} lg:block lg:col-span-1`}>
          <div className="bg-white rounded-lg shadow divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredParties.length > 0 ? (
              filteredParties.map((party) => (
                <button
                  key={party._id}
                  onClick={() => viewPartyDetails(party)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedParty?._id === party._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getPartyIcon(party.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{party.name}</h3>
                      {party.companyName && (
                        <p className="text-xs text-gray-500 truncate">{party.companyName}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {party.email && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail size={12} /> {party.email}
                          </span>
                        )}
                        {party.phone && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone size={12} /> {party.phone}
                          </span>
                        )}
                      </div>
                      {party.tags && party.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {party.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
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
              <div className="p-8 text-center text-gray-500">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="mb-4">No contacts found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first contact
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className={`${!showMobileDetail ? 'hidden' : 'block'} lg:block lg:col-span-2`}>
          {selectedParty ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Party Info */}
              <div className="p-6 border-b">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    {getPartyIcon(selectedParty.type)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedParty.name}</h2>
                    <p className="text-gray-600 capitalize">{selectedParty.type}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {selectedParty.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={16} className="text-gray-400" />
                          <a href={`mailto:${selectedParty.email}`} className="text-blue-600 hover:underline">
                            {selectedParty.email}
                          </a>
                        </div>
                      )}
                      {selectedParty.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={16} className="text-gray-400" />
                          <a href={`tel:${selectedParty.phone}`} className="text-blue-600 hover:underline">
                            {selectedParty.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {selectedParty.address && (
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-700 mb-2">Address</h3>
                        <p className="text-sm text-gray-600">
                          {selectedParty.address.street && <>{selectedParty.address.street}<br /></>}
                          {selectedParty.address.city && selectedParty.address.state && (
                            <>{selectedParty.address.city}, {selectedParty.address.state}<br /></>
                          )}
                          {selectedParty.address.country && selectedParty.address.zipCode && (
                            <>{selectedParty.address.country} {selectedParty.address.zipCode}</>
                          )}
                        </p>
                      </div>
                    )}

                    {selectedParty.tags && selectedParty.tags.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-700 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedParty.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedParty.notes && (
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {selectedParty.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Current Balance</span>
                  <span className={`text-2xl font-bold ${
                    partyBalance > 0 ? 'text-green-600' : partyBalance < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    ${Math.abs(partyBalance).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {partyBalance > 0 
                    ? 'They owe you' 
                    : partyBalance < 0 
                    ? 'You owe them' 
                    : 'Settled up'}
                </p>
              </div>

              {/* Transactions */}
              <div className="divide-y max-h-96 overflow-y-auto">
                <h3 className="p-4 font-medium text-gray-700 bg-gray-50">Transaction History</h3>
                {partyTransactions.length > 0 ? (
                  partyTransactions.map((transaction) => (
                    <div key={transaction._id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{transaction.description}</h4>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
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
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.lender === selectedParty._id
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {transaction.lender === selectedParty._id ? '+' : '-'}
                            ${transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.lender === selectedParty._id
                              ? 'They lent'
                              : 'They borrowed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No transactions with this contact yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex bg-white rounded-lg shadow p-12 text-center items-center justify-center h-64">
              <div>
                <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Select a Contact
                </h3>
                <p className="text-sm text-gray-500">
                  Choose a contact from the list to view their details and transaction history
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateExternalPartyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPartyCreated={(newParty) => {
          setParties([...parties, newParty]);
          fetchParties(); // Refresh list
        }}
      />
    </div>
  );
};

export default ExternalParties;