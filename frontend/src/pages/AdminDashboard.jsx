import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateUserModal from '../components/admin/CreateUserModal';
import CreateStoreModal from '../components/admin/CreateStoreModal';
import api from '../services/api';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateStore, setShowCreateStore] = useState(false);
  
  // Filter states
  const [userFilters, setUserFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: '',
  });
  const [storeFilters, setStoreFilters] = useState({
    name: '',
    address: '',
  });
  
  // Sort states
  const [userSort, setUserSort] = useState({ field: 'name', order: 'ASC' });
  const [storeSort, setStoreSort] = useState({ field: 'name', order: 'ASC' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, storesRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/stores'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setStores(storesRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field, type) => {
    if (type === 'user') {
      const newOrder = userSort.field === field && userSort.order === 'ASC' ? 'DESC' : 'ASC';
      setUserSort({ field, order: newOrder });
    } else {
      const newOrder = storeSort.field === field && storeSort.order === 'ASC' ? 'DESC' : 'ASC';
      setStoreSort({ field, order: newOrder });
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const matchName = userFilters.name ? user.name.toLowerCase().includes(userFilters.name.toLowerCase()) : true;
      const matchEmail = userFilters.email ? user.email.toLowerCase().includes(userFilters.email.toLowerCase()) : true;
      const matchAddress = userFilters.address ? user.address.toLowerCase().includes(userFilters.address.toLowerCase()) : true;
      const matchRole = userFilters.role ? user.role === userFilters.role : true;
      return matchName && matchEmail && matchAddress && matchRole;
    })
    .sort((a, b) => {
      const aVal = a[userSort.field]?.toString().toLowerCase() || '';
      const bVal = b[userSort.field]?.toString().toLowerCase() || '';
      return userSort.order === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const filteredStores = stores
    .filter((store) => {
      const matchName = storeFilters.name ? store.name.toLowerCase().includes(storeFilters.name.toLowerCase()) : true;
      const matchAddress = storeFilters.address ? store.address.toLowerCase().includes(storeFilters.address.toLowerCase()) : true;
      return matchName && matchAddress;
    })
    .sort((a, b) => {
      const aVal = a[storeSort.field]?.toString().toLowerCase() || '';
      const bVal = b[storeSort.field]?.toString().toLowerCase() || '';
      return storeSort.order === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['dashboard', 'users', 'stores'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-primary-600">{stats?.totalUsers || 0}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Stores</h3>
                <p className="text-3xl font-bold text-primary-600">{stats?.totalStores || 0}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Ratings</h3>
                <p className="text-3xl font-bold text-primary-600">{stats?.totalRatings || 0}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Store Owners</h3>
                <p className="text-3xl font-bold text-primary-600">{stats?.usersByRole?.storeOwners || 0}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Users Management</h2>
              <button onClick={() => setShowCreateUser(true)} className="btn-primary">
                + Add New User
              </button>
            </div>

            <div className="card mb-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Filter by name..."
                  className="input-field"
                  value={userFilters.name}
                  onChange={(e) => setUserFilters({...userFilters, name: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Filter by email..."
                  className="input-field"
                  value={userFilters.email}
                  onChange={(e) => setUserFilters({...userFilters, email: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Filter by address..."
                  className="input-field"
                  value={userFilters.address}
                  onChange={(e) => setUserFilters({...userFilters, address: e.target.value})}
                />
                <select
                  className="input-field"
                  value={userFilters.role}
                  onChange={(e) => setUserFilters({...userFilters, role: e.target.value})}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="store_owner">Store Owner</option>
                </select>
              </div>
            </div>

            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th 
                      onClick={() => handleSort('name', 'user')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                    >
                      Name {userSort.field === 'name' && (userSort.order === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('email', 'user')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                    >
                      Email {userSort.field === 'email' && (userSort.order === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'store_owner' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {user.address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Stores Management</h2>
              <button onClick={() => setShowCreateStore(true)} className="btn-primary">
                + Add New Store
              </button>
            </div>

            <div className="card mb-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Filter by name..."
                  className="input-field"
                  value={storeFilters.name}
                  onChange={(e) => setStoreFilters({...storeFilters, name: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Filter by address..."
                  className="input-field"
                  value={storeFilters.address}
                  onChange={(e) => setStoreFilters({...storeFilters, address: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
                <div key={store.id} className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{store.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{store.email}</p>
                  <p className="text-sm text-gray-500 mb-4">{store.address}</p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Rating</p>
                      <p className="text-lg font-semibold text-primary-600">
                        {store.averageRating ? store.averageRating.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reviews</p>
                      <p className="text-lg font-semibold text-primary-600">
                        {store.totalRatings || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onSuccess={fetchDashboardData}
      />
      
      <CreateStoreModal
        isOpen={showCreateStore}
        onClose={() => setShowCreateStore(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default AdminDashboard;