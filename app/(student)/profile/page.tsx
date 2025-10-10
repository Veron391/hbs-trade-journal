"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../../components/ui/FormInput';
import Button from '../../components/ui/Button';
import { COMMON_PAIRS } from '../../services/tradeApiService';

// Add these constants at the top of the file, after imports
const POPULAR_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 
  'DOGEUSDT', 'MATICUSDT', 'SOLUSDT', 'AVAXUSDT', 'DOTUSDT',
  'LINKUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'ETCUSDT'
];

const DeFi_PAIRS = ['UNIUSDT', 'AAVEUSDT', 'COMPUSDT', 'MKRUSDT', 'SUSHIUSDT'];
const MEME_PAIRS = ['DOGEUSDT', 'SHIBUSDT', 'FLOKIUSDT', 'PEPEUSDT'];
const LAYER1_PAIRS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'AVAXUSDT'];


export default function ProfilePage() {
  const { user, logout, updateUser, changePassword } = useAuth();
  const router = useRouter();
  
  // All hooks must be called before any conditional returns
  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // API Keys state
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [savedSecretKey, setSavedSecretKey] = useState('');
  const [showingApiMessage, setShowingApiMessage] = useState(false);
  
  // Trading pairs state
  const [tradingPairs, setTradingPairs] = useState<string[]>([]);
  const [newPair, setNewPair] = useState('');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Initialize state when user loads
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name);
      setEmail(user.email);
      setUsername(user.username || '');
      setPhoneNumber(user.phone_number || '');
    }
  }, [user]);

  // Initialize API keys from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem('apiKey') || '');
      setSavedSecretKey(localStorage.getItem('secretKey') ? '••••••••••••••••••••••' : '');
    }
  }, []);
  
  // Load trading pairs from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPairs = localStorage.getItem('tradingPairs');
      if (storedPairs) {
        try {
          const parsedPairs = JSON.parse(storedPairs);
          if (Array.isArray(parsedPairs)) {
            setTradingPairs(parsedPairs);
          }
        } catch (err) {
          console.error('Error parsing trading pairs:', err);
        }
      } else {
        // Set default common pairs if nothing is saved
        setTradingPairs(COMMON_PAIRS);
      }
    }
  }, []);

  // Show loading or nothing while redirecting
  if (!user) {
    return null;
  }
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!fullName.trim()) {
      setError('Full name is required');
      setMessage('');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      setMessage('');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setMessage('');
      return;
    }
    
    try {
      // Update the user using the AuthContext method
      await updateUser({ full_name: fullName.trim(), email: email.trim(), username: username.trim(), phone_number: phoneNumber.trim() });
      setMessage('Profile updated successfully');
      setError('');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setMessage('');
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentPassword) {
      setError('Current password is required');
      setMessage('');
      return;
    }
    
    if (!newPassword) {
      setError('New password is required');
      setMessage('');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setMessage('');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setMessage('');
      return;
    }
    
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      setMessage('');
      return;
    }
    
    try {
      // Change password using the AuthContext method
      await changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setMessage('');
    }
  };
  
  const handleApiKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save API keys to localStorage
      localStorage.setItem('apiKey', apiKey);
      
      // Only update the secret key if one is provided
      if (secretKey) {
        localStorage.setItem('secretKey', secretKey);
        setSavedSecretKey('••••••••••••••••••••••');
      }
      
      // Save trading pairs
      localStorage.setItem('tradingPairs', JSON.stringify(tradingPairs));
      
      setSecretKey(''); // Clear the input field
      setShowingApiMessage(true);
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowingApiMessage(false);
      }, 3000);
      
    } catch (err) {
      setError('Failed to save API keys');
    }
  };
  
  const handleAddTradingPair = () => {
    if (!newPair) return;
    
    // Format the pair: convert to uppercase and ensure it ends with USDT if needed
    let formattedPair = newPair.toUpperCase();
    if (!formattedPair.includes('/') && !formattedPair.endsWith('USDT')) {
      formattedPair = `${formattedPair}USDT`;
    }
    
    // Check if the pair already exists
    if (!tradingPairs.includes(formattedPair)) {
      setTradingPairs([...tradingPairs, formattedPair]);
      setNewPair('');
    }
  };
  
  const handleRemoveTradingPair = (pair: string) => {
    setTradingPairs(tradingPairs.filter(p => p !== pair));
  };
  
  const handleUseDefaultPairs = () => {
    setTradingPairs(COMMON_PAIRS);
  };
  
  const handleDeleteAccount = () => {
    // Show a confirmation dialog
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // This is a mock implementation - in a real app you'd call an API
      try {
        // Remove the user from localStorage to simulate account deletion
        localStorage.removeItem('user');
        logout();
        router.push('/');
      } catch (err) {
        setError('Failed to delete account');
        setMessage('');
      }
    }
  };
  
  const handleAddPairs = (pairs: string[]) => {
    // Add new pairs without duplicates
    const updatedPairs = [...tradingPairs];
    
    pairs.forEach(pair => {
      if (!updatedPairs.includes(pair)) {
        updatedPairs.push(pair);
      }
    });
    
    setTradingPairs(updatedPairs);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Your Profile</h1>
      
      {message && (
        <div className="bg-green-900/50 border border-green-500 text-white px-4 py-3 rounded-md mb-6">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-[#1C1719] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate}>
            <FormInput
              id="fullName"
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <FormInput
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <FormInput
              id="phoneNumber"
              label="Phone Number"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            
            <FormInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <div className="mt-6">
              <Button type="submit">
                Update Profile
              </Button>
            </div>
          </form>
        </div>
        
        {/* Change Password */}
        <div className="bg-[#1C1719] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange}>
            <FormInput
              id="currentPassword"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            
            <FormInput
              id="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            
            <FormInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            <div className="mt-6">
              <Button type="submit">
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* API Keys Section */}
      <div className="mt-8 bg-[#1C1719] rounded-lg p-6 border border-blue-500">
        <h2 className="text-xl font-semibold text-white mb-4">Binance API Keys</h2>
        
        <p className="text-gray-400 mb-4">
          Add your Binance API keys to enable automatic trade importing.
          <a 
            href="https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 ml-1 hover:underline"
          >
            How to create API keys
          </a>
        </p>
        
        {showingApiMessage && (
          <div className="bg-green-900/50 border border-green-500 text-white px-4 py-3 rounded-md mb-4">
            API settings saved successfully
          </div>
        )}
        
        <form onSubmit={handleApiKeySave}>
          <FormInput
            id="apiKey"
            label="API Key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          
          {savedSecretKey ? (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label htmlFor="secretKey" className="block text-sm font-medium text-gray-300 mb-1">
                  Secret Key <span className="text-blue-500">*</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  disabled
                  type="text"
                  value={savedSecretKey}
                  className="flex-grow px-3 py-2 bg-[#342F31] text-gray-400 border border-[#534E50] rounded-l-md focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSavedSecretKey('');
                    localStorage.removeItem('secretKey');
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-500"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <FormInput
              id="secretKey"
              label="Secret Key"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter your secret key"
            />
          )}
          
          <div className="mt-6 mb-4">
            <h3 className="text-md font-medium text-white mb-2">Trading Pairs</h3>
            <p className="text-sm text-gray-400 mb-3">
              Specify which trading pairs to fetch from Binance. The system will retrieve 3 months of historical data.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {tradingPairs.map(pair => (
                <div key={pair} className="flex items-center bg-[#342F31] px-3 py-1 rounded-full">
                  <span className="text-gray-200 mr-2">{pair}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveTradingPair(pair)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex mb-2">
              <input
                type="text"
                value={newPair}
                onChange={(e) => setNewPair(e.target.value)}
                placeholder="Add trading pair (e.g., BTCUSDT)"
                className="flex-grow px-3 py-2 bg-[#342F31] text-white border border-[#534E50] rounded-l-md focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTradingPair}
                className="px-3 py-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600"
              >
                Add
              </button>
            </div>
            
            <div className="mt-4 mb-2">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Add Categories:</h4>
              <div className="flex flex-wrap gap-2">
                <button 
                  type="button"
                  onClick={() => handleAddPairs(LAYER1_PAIRS)}
                  className="px-2 py-1 text-xs bg-blue-800 text-white rounded hover:bg-blue-700"
                >
                  Layer 1
                </button>
                <button 
                  type="button"
                  onClick={() => handleAddPairs(DeFi_PAIRS)}
                  className="px-2 py-1 text-xs bg-purple-800 text-white rounded hover:bg-purple-700"
                >
                  DeFi
                </button>
                <button 
                  type="button"
                  onClick={() => handleAddPairs(MEME_PAIRS)}
                  className="px-2 py-1 text-xs bg-pink-800 text-white rounded hover:bg-pink-700"
                >
                  Meme Coins
                </button>
                <button 
                  type="button"
                  onClick={() => handleAddPairs(POPULAR_PAIRS)}
                  className="px-2 py-1 text-xs bg-green-800 text-white rounded hover:bg-green-700"
                >
                  Popular (15)
                </button>
              </div>
            </div>
            
            <div className="flex justify-between mt-3">
              <button 
                type="button"
                onClick={handleUseDefaultPairs}
                className="text-sm text-blue-400 hover:underline"
              >
                Reset to default pairs
              </button>
              
              <button 
                type="button"
                onClick={() => setTradingPairs([])}
                className="text-sm text-red-400 hover:underline"
              >
                Clear all pairs
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              type="submit" 
              variant="secondary"
            >
              Save API Settings
            </Button>
          </div>
        </form>
      </div>
      
      
      {/* Danger Zone */}
      <div className="mt-8 bg-[#1C1719] rounded-lg p-6 border border-red-500">
        <h2 className="text-xl font-semibold text-white mb-4">Danger Zone</h2>
        
        <p className="text-gray-400 mb-4">
          Deleting your account will remove all your data and cannot be undone.
        </p>
        
        <Button
          variant="danger"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
} 