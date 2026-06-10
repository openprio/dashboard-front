import { getIdToken } from "./auth.js";

const API_BASE_URL = "https://dashboard-api.openprio.nl/";

async function fetchWithAuth(path, options = {}) {
  const token = await getIdToken();
  const url = `${API_BASE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      ...options.headers,
    },
  });
  return response;
}

async function fetchPublic(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path.slice(1) : path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return response;
}

// Endpoints

export async function getCurrentUser() {
  const response = await fetchWithAuth("/me");
  if (!response.ok) {
    throw new Error("Failed to get current user info");
  }
  return await response.json();
}

export async function listUsers() {
  const response = await fetchWithAuth("/admin/users");
  if (!response.ok) {
    throw new Error("Failed to list users");
  }
  return await response.json();
}

export async function createUser(email, role = "user") {
  const response = await fetchWithAuth("/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to create user");
  }
  return await response.json();
}

export async function deleteUser(email) {
  const response = await fetchWithAuth(`/admin/users/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to delete user");
  }
  // 204 No Content
  return;
}

export async function forgotPassword(email) {
  const response = await fetchPublic("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to send reset email");
  }
  return await response.json();
}

export async function resetPassword(token, newPassword) {
  const response = await fetchPublic("/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to reset password");
  }
  return await response.json();
}
