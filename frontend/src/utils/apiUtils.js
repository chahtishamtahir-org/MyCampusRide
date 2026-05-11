import { toast } from 'react-toastify';

const handleUnauthorized = () => {
  toast.warning("Your session has expired for security. Please log in again.", { autoClose: 4000 });
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const makeApiRequest = async (requestFn, options = {}) => {
  const { skipAuthHandler = false } = options;

  try {
    const response = await requestFn();
    return response;
  } catch (error) {
    if (error.response?.status === 401 && !skipAuthHandler) {
      handleUnauthorized();
    }
    throw error;
  }
};