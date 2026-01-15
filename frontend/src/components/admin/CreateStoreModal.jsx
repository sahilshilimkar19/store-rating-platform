import { useState, useEffect } from 'react';
import api from '../../services/api';

const CreateStoreModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: '',
  });
  const [storeOwners, setStoreOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStoreOwners();
    }
  }, [isOpen]);

  const fetchStoreOwners = async () => {
    try {
      const response = await api.get('/admin/users');
      const owners = response.data.filter((u) => u.role === 'store_owner');
      setStoreOwners(owners);
    } catch (error) {
      console.error('Failed to fetch store owners:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.name.length < 20 || formData.name.length > 60) {
      newErrors.name = 'Store name must be between 20 and 60 characters';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.address.length === 0) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length > 400) {
      newErrors.address = 'Address must not exceed 400 characters';
    }

    if (!formData.ownerId) {
      newErrors.ownerId = 'Please select a store owner';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/admin/stores', formData);
      onSuccess();
      onClose();
      setFormData({
        name: '',
        email: '',
        address: '',
        ownerId: '',
      });
    } catch (err) {
      setErrors({
        submit: err.response?.data?.message || 'Failed to create store',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Store</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {storeOwners.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              No store owners found. Please create a user with "Store Owner" role first.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="form-label">
              Store Name (20-60 characters)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input-field"
              placeholder="Best Electronics Store in New York"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              Store Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="store@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="address" className="form-label">
              Store Address (Max 400 characters)
            </label>
            <textarea
              id="address"
              name="address"
              required
              rows="3"
              className="input-field resize-none"
              placeholder="456 Business Ave, New York, NY 10002"
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && <p className="error-text">{errors.address}</p>}
          </div>

          <div>
            <label htmlFor="ownerId" className="form-label">
              Store Owner
            </label>
            <select
              id="ownerId"
              name="ownerId"
              className="input-field"
              value={formData.ownerId}
              onChange={handleChange}
              required
            >
              <option value="">Select a store owner</option>
              {storeOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email})
                </option>
              ))}
            </select>
            {errors.ownerId && <p className="error-text">{errors.ownerId}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading || storeOwners.length === 0}
            >
              {loading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoreModal;