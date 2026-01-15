import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storeService } from '../services/storeService';
import { ratingService } from '../services/ratingService';
import StoreCard from '../components/user/StoreCard';
import ChangePasswordModal from '../components/common/ChangePasswordModal';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const [storesData, ratingsData] = await Promise.all([
        storeService.getAllStores({
          name: searchTerm,
          address: addressFilter,
          sortBy,
          sortOrder,
        }),
        ratingService.getUserRatings(user.id),
      ]);

      const ratingsMap = {};
      ratingsData.forEach((rating) => {
        ratingsMap[rating.storeId] = {
          rating: rating.rating,
          id: rating.id,
        };
      });

      const storesWithUserRatings = storesData.map((store) => ({
        ...store,
        userRating: ratingsMap[store.id]?.rating || 0,
        userRatingId: ratingsMap[store.id]?.id || null,
      }));

      setStores(storesWithUserRatings);
      setUserRatings(ratingsData);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [sortBy, sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStores();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Directory</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Search by Store Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter store name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Search by Address</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter address..."
                  value={addressFilter}
                  onChange={(e) => setAddressFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="form-label">Sort By</label>
                <select
                  className="input-field"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="createdAt">Date Added</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="form-label">Order</label>
                <select
                  className="input-field"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="ASC">Ascending</option>
                  <option value="DESC">Descending</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setAddressFilter('');
                  setSortBy('name');
                  setSortOrder('ASC');
                }}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Stores</h3>
            <p className="text-3xl font-bold text-primary-600">{stores.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Your Ratings</h3>
            <p className="text-3xl font-bold text-primary-600">{userRatings.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Not Rated</h3>
            <p className="text-3xl font-bold text-primary-600">
              {stores.length - userRatings.length}
            </p>
          </div>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : stores.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No stores found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} onRatingUpdate={fetchStores} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;