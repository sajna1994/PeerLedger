import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, DollarSign, FileText, Building2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import CreateExternalPartyModal from '../components/CreateExternalPartyModal';

const CreateTransaction = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [externalParties, setExternalParties] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'lend',
    otherPartyId: '',
    otherPartyType: 'external', // Always 'external' now
    dueDate: '',
    notes: '',
    category: 'personal',
    tags: []
  });
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchExternalParties = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/external-parties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExternalParties(response.data.map(party => ({
        value: party._id,
        label: String(party.name || 'Unknown'),
        type: 'external',
        subtitle: String(party.companyName || party.email || party.phone || party.type || ''),
        partyType: party.type
      })));
    } catch (error) {
      console.error('Failed to fetch external parties:', error);
      toast.error('Failed to load external parties');
    }
  }, [token]);

  useEffect(() => {
    fetchExternalParties();
  }, [fetchExternalParties]);

  const searchExternalParties = async (inputValue) => {
    console.log('Searching for external party:', inputValue);
    
    if (!inputValue || typeof inputValue !== 'string') {
      setSearchResults([]);
      return;
    }
    
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/external-parties/search?query=${encodeURIComponent(trimmedValue)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const parties = (response.data || []).map(party => ({
        value: party._id,
        label: String(party.name || 'Unknown'),
        type: 'external',
        subtitle: String(party.companyName || party.email || party.phone || party.type || ''),
        partyType: party.type
      }));

      console.log('Search results:', parties);
      setSearchResults(parties);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePartySelect = (selected) => {
    if (selected) {
      setFormData({
        ...formData,
        otherPartyId: selected.value,
        otherPartyType: 'external'
      });
    } else {
      setFormData({
        ...formData,
        otherPartyId: '',
        otherPartyType: 'external'
      });
    }
  };

  const handlePartyCreated = (newParty) => {
    const partyOption = {
      value: newParty._id,
      label: String(newParty.name || 'Unknown'),
      type: 'external',
      subtitle: String(newParty.companyName || newParty.email || newParty.phone || newParty.type || ''),
      partyType: newParty.type
    };
    
    setExternalParties([...externalParties, partyOption]);
    handlePartySelect(partyOption);
    toast.success('External party created successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.otherPartyId) {
      toast.error('Please select a party');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(
        `${API_URL}/transactions`,
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Transaction created successfully!');
      navigate('/transactions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Combine external parties with search results
  const allOptions = [
    ...externalParties,
    ...searchResults.filter(result => 
      !externalParties.some(party => party.value === result.value)
    )
  ].filter(option => option && option.value && option.label);

  const formatOptionLabel = ({ label, subtitle, partyType }) => {
    const safeLabel = String(label || 'Unknown');
    const safeSubtitle = subtitle ? String(subtitle) : '';
    
    return (
      <div className="flex items-center py-1">
        <div className="mr-2">
          <Building2 
            size={16} 
            className={
              partyType === 'corporate' ? 'text-purple-500' : 
              partyType === 'organization' ? 'text-blue-500' : 
              'text-green-500'
            } 
          />
        </div>
        <div>
          <div className="font-medium">{safeLabel}</div>
          {safeSubtitle && <div className="text-xs text-gray-500">{safeSubtitle}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="px-2 sm:px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
      >
        <ArrowLeft size={18} className="mr-1 sm:mr-2" />
        <span className="text-sm sm:text-base">Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create New Transaction</h1>
          
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1">
                <input
                  type="radio"
                  name="type"
                  value="lend"
                  checked={formData.type === 'lend'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`text-center p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.type === 'lend'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <span className="block font-medium text-sm sm:text-base">I'm Lending</span>
                  <span className="text-xs sm:text-sm">Someone owes me</span>
                </div>
              </label>
              
              <label className="flex-1">
                <input
                  type="radio"
                  name="type"
                  value="borrow"
                  checked={formData.type === 'borrow'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`text-center p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.type === 'borrow'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <span className="block font-medium text-sm sm:text-base">I'm Borrowing</span>
                  <span className="text-xs sm:text-sm">I owe someone</span>
                </div>
              </label>
            </div>
          </div>

          {/* Party Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select External Party <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-1 transition-colors"
              >
                <Plus size={16} />
                Add New
              </button>
            </div>
            
            <Select
              options={allOptions}
              onInputChange={(value) => {
                if (typeof value === 'string') {
                  searchExternalParties(value);
                }
              }}
              isLoading={searchLoading}
              onChange={handlePartySelect}
              onMenuClose={() => setSearchResults([])}
              placeholder="Search by name, email, company, or phone..."
              className="text-sm"
              classNamePrefix="react-select"
              isClearable
              formatOptionLabel={formatOptionLabel}
              getOptionValue={(option) => option?.value || ''}
              getOptionLabel={(option) => option?.label || ''}
              filterOption={null}
              noOptionsMessage={({ inputValue }) => 
                inputValue ? 'No external parties found' : 'Start typing to search'
              }
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  fontSize: '14px',
                  borderColor: '#e5e7eb',
                  '&:hover': {
                    borderColor: '#3b82f6'
                  }
                }),
                menu: (base) => ({
                  ...base,
                  fontSize: '14px',
                  zIndex: 50
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
                  color: '#111827',
                  '&:active': {
                    backgroundColor: '#e5e7eb'
                  }
                })
              }}
            />
            <p className="mt-2 text-xs text-gray-500">
              Search for existing external parties or click "Add New" to create one
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field text-sm"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field pl-9 text-sm"
                placeholder="e.g., Lunch, Invoice #123, Project payment"
                required
              />
            </div>
          </div>

          {/* Amount */}
         <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Amount (₹) <span className="text-red-500">*</span>
  </label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-lg">₹</span>
    <input
      type="number"
      name="amount"
      value={formData.amount}
      onChange={handleChange}
      className="input-field pl-9 text-sm"
      placeholder="0.00"
      step="0.01"
      min="0.01"
      required
    />
  </div>
</div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="input-field pl-9 text-sm"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="input-field text-sm"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="w-full sm:flex-1 btn-secondary text-sm sm:text-base py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-sm sm:text-base py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
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

export default CreateTransaction;