const BASE_URL = 'https://api.wanikani.com/v2';

class WaniKaniAPI {
  constructor(apiToken) {
    this.apiToken = apiToken;
  }

  async fetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Wanikani-Revision': '20170710',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API token');
      }
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async fetchAllPages(endpoint) {
    const results = [];
    let nextUrl = endpoint;

    while (nextUrl) {
      const response = await this.fetch(nextUrl);
      results.push(...response.data);
      nextUrl = response.pages?.next_url || null;
    }

    return results;
  }

  async getUser() {
    const response = await this.fetch('/user');
    return response.data;
  }

  async getLevelProgressions() {
    return this.fetchAllPages('/level_progressions');
  }

  async getAssignments() {
    return this.fetchAllPages('/assignments');
  }

  async getReviewStatistics() {
    return this.fetchAllPages('/review_statistics');
  }

  async getSummary() {
    const response = await this.fetch('/summary');
    return response.data;
  }
}

export function createAPI(token) {
  return new WaniKaniAPI(token);
}

export async function validateToken(token) {
  const api = new WaniKaniAPI(token);
  try {
    await api.getUser();
    return true;
  } catch {
    return false;
  }
}
