// Backend ko call karne ka helper. Token apne aap lag jata hai.
export async function api(path, options = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch('/api' + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // jawab JSON nahi tha
  }

  if (!res.ok) {
    const detail = data?.detail;
        const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
        ? 'Please check the email and password format'
        : `Server error (status ${res.status})`;
    throw new Error(message);
  }
  return data;
}

// Login ke baad session save karo
export function saveSession({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userName', user.name);
  if (user.department) localStorage.setItem('department', user.department);
}