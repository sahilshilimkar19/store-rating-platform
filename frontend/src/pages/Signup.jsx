import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

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
      await signup(formData);
      navigate('/stores');
    } catch (err) {
      setErrors({
        submit: err.response?.data?.message || 'Signup failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-gray-600">Join our store rating platform</p>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;