// API Configuration
// In production, this will be proxied through nginx at /api
// In development, it points to localhost

const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

export default API_BASE_URL;

// Helper function for API calls
export const apiUrl = (path) => {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};
