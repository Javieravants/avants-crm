const API = {
  baseURL: '/api',

  getToken() {
    return localStorage.getItem('token');
  },

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const opts = { method, headers };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${this.baseURL}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        Auth.logout();
      }
      throw new Error(data.error || 'Error en la petición');
    }

    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  patch(path, body) { return this.request('PATCH', path, body); },
  delete(path) { return this.request('DELETE', path); },

  // Upload de archivos (FormData)
  async upload(path, formData) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${this.baseURL}${path}`, {
      method: 'POST', headers, body: formData
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) Auth.logout();
      throw new Error(data.error || 'Error en la petición');
    }
    return data;
  },
};
