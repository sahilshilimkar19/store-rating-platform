import { useState } from 'react';
import StarRating from '../common/starRating';
import { ratingService } from '../../services/ratingService';
import { useAuth } from '../../context/authContext';

const StoreCard = ({ store, onRatingUpdate }) => {
  const { user } = useAuth();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(store.userRating || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (store.userRatingId) {
        await ratingService.updateRating(store.userRatingId, selectedRating, user.id);
      } else {
        await ratingService.submitRating(store.id, selectedRating, user.id);
      }
      
      setShowRatingModal(false);
      if (onRatingUpdate) {
        onRatingUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{store.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{store.address}</p>
            <p className="text-gray-500 text-sm">{store.email}</p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
              <div className="flex items-center gap-2">
                <StarRating rating={store.averageRating || 0} readonly size="sm" />
                <span className="text-sm font-medium text-gray-700">
                  {store.averageRating ? store.averageRating.toFixed(1) : 'No ratings'}
                </span>
                <span className="text-xs text-gray-500">({store.totalRatings || 0})</span>
              </div>
            </div>
          </div>

          {store.userRating > 0 && (
            <div className="mb-3 p-3 bg-primary-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Your Rating</p>
              <StarRating rating={store.userRating} readonly size="sm" />
            </div>
          )}

          <button
            onClick={() => setShowRatingModal(true)}
            className="w-full btn-primary text-sm"
          >
            {store.userRating > 0 ? 'Update Rating' : 'Rate This Store'}
          </button>
        </div>
      </div>

      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Rate {store.name}</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Select your rating:</p>
              <div className="flex justify-center">
                <StarRating
                  rating={selectedRating}
                  onRatingChange={setSelectedRating}
                  size="lg"
                />
              </div>
              {selectedRating > 0 && (
                <p className="text-center mt-2 text-lg font-medium text-primary-600">
                  {selectedRating} {selectedRating === 1 ? 'Star' : 'Stars'}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreCard;