// Interceptor to inject JWT token into all fetch requests
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const [resource, config] = args;
  const token = localStorage.getItem('slh_token');
  
  if (token && typeof resource === 'string' && resource.startsWith('/api')) {
    const newConfig = config || {};
    newConfig.headers = {
      ...newConfig.headers,
      Authorization: `Bearer ${token}`
    };
    return originalFetch(resource, newConfig);
  }
  
  return originalFetch(...args);
};

export {};
