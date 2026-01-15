import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storeService } from '../services/storeService';
import { ratingService } from '../services/ratingService';
import StarRating from '../components/common/StarRating';
import ChangePasswordModal from '../components/common/ChangePasswordModal';
import api from '../services/api';

const StoreOwnerDashboard = () => {
  const { user, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeRatings, setStoreRatings] = useState([]);
  const [storeStats, setStoreStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchOwnerStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchStoreDetails(selectedStore.id);
    }
  }, [selectedStore]);

  const fetchOwnerStores = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/stores/owner/${user.id}`);
      setStores(response.data);
      if (response.data.length > 0) {
        setSelectedStore(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreDetails = async (storeId) => {
    try {
      const [ratingsRes, statsRes] = await Promise.all([
        ratingService.getStoreRatings(storeId),
        storeService.getStoreStats(storeId),
      ]);
      setStoreRatings(ratingsRes);
      setStoreStats(statsRes);
    } catch (error) {
      console.error('Failed to fetch store details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Stores Found</h2>
          <p className="text-gray-600 mb-6">
            You don't have any stores assigned to your account yet.
          </p>
          <button onClick={logout} className="btn-primary">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Owner Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Selector */}
        {stores.length > 1 && (
          <div className="card mb-6">
            <label className="form-label">Select Store</label>
            <select
              className="input-field"
              value={selectedStore?.id || ''}
              onChange={(e) => {
                const store = stores.find((s) => s.id === e.target.value);
                setSelectedStore(store);
              }}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedStore && (
          <>
            {/* Store Info */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">{selectedStore.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{selectedStore.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Address</p>
                  <p className="font-medium">{selectedStore.address}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Average Rating</h3>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-primary-600">
                    {storeStats?.averageRating.toFixed(1) || '0.0'}
                  </p>
                  <StarRating rating={storeStats?.averageRating || 0} readonly size="sm" />
                </div>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Ratings</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {storeStats?.totalRatings || 0}
                </p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">5-Star Ratings</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {storeStats?.ratingDistribution?.[5] || 0}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            {storeStats && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = storeStats.ratingDistribution[star] || 0;
                    const percentage =
                      storeStats.totalRatings > 0
                        ? (count / storeStats.totalRatings) * 100
                        : 0;
                    return (
                      <div key={star} className="flex items-center gap-4">
                        <span className="text-sm font-medium w-12">{star} Star</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-yellow-400 h-4 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Ratings */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Ratings</h3>
              {storeRatings.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No ratings yet</p>
              ) : (
                <div className="space-y-4">
                  {storeRatings.map((rating) => (
                    <div
                      key={rating.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{rating.user?.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-600">{rating.user?.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={rating.rating} readonly size="sm" />
                        <span className="font-semibold text-gray-900">{rating.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StoreOwnerDashboard;