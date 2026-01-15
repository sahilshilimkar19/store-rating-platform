import { useState } from 'react';
import api from '../../services/api';

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (formData.name.length < 20 || formData.name.length > 60) {
      newErrors.name = 'Name must be between 20 and 60 characters';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.password.length < 8 || formData.password.length > 16) {
      newErrors.password = 'Password must be between 8 and 16 characters';
    } else if (!/(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter and one special character';
    }

    if (formData.address.length === 0) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length > 400) {
      newErrors.address = 'Address must not exceed 400 characters';
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
      await api.post('/admin/users', formData);
      onSuccess();
      onClose();
      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
        role: 'user',
      });
    } catch (err) {
      setErrors({
        submit: err.response?.data?.message || 'Failed to create user',
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
          <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="form-label">
              Full Name (20-60 characters)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input-field"
              placeholder="John Doe Smith Anderson Williams"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password (8-16 chars, 1 uppercase, 1 special)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input-field"
              placeholder="Test@1234"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="address" className="form-label">
              Address (Max 400 characters)
            </label>
            <textarea
              id="address"
              name="address"
              required
              rows="3"
              className="input-field resize-none"
              placeholder="123 Main Street, New York, NY 10001"
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && <p className="error-text">{errors.address}</p>}
          </div>

          <div>
            <label htmlFor="role" className="form-label">
              User Role
            </label>
            <select
              id="role"
              name="role"
              className="input-field"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">Normal User</option>
              <option value="admin">Admin</option>
              <option value="store_owner">Store Owner</option>
            </select>
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
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;