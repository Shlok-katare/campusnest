// Thin client for the CampusNest Spring Boot API.
// Set VITE_API_URL in Vercel (production) or frontend/.env.local (development).

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

export class ApiError extends Error {
    constructor(message, status = 0, fieldErrors = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            method,
            signal,
            headers: {
                Accept: 'application/json',
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...headers
            },
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch (err) {
        if (err?.name === 'AbortError') throw err;
        throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
    }

    if (res.status === 204) return null;

    let data = null;
    try {
        data = await res.json();
    } catch {
        /* response had no JSON body */
    }

    if (!res.ok) {
        throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors || {});
    }
    return data;
}

export const api = {
    health: () => request('/api/health'),

    listProperties: (signal) => request('/api/properties', { signal }),

    createProperty: (body) => request('/api/properties', { method: 'POST', body }),

    verifyProperty: (id, adminKey) =>
        request(`/api/properties/${id}/verify`, { method: 'POST', headers: { 'X-Admin-Key': adminKey } }),

    checkAdminKey: (adminKey) => request('/api/admin/check', { headers: { 'X-Admin-Key': adminKey } }),

    reserve: (body) => request('/api/escrow/reserve', { method: 'POST', body })
};
