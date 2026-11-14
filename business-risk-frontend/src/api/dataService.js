const BASE_URL = "http://localhost:8000";

export const fetchOverview = async (state, year) => {
  const response = await fetch(
    `${BASE_URL}/overview?state=${state}&year=${year}`
  );
  return response.json();
};

export const fetchStates = async () => {
  const response = await fetch(`${BASE_URL}/states`);
  return response.json();
};

export const fetchYears = async (state) => {
  const response = await fetch(
    `${BASE_URL}/years?state=${state}`
  );
  return response.json();
};

export const fetchBusinessHistory = async (state, name) => {
  const res = await fetch(
    `http://localhost:8000/business-history?state=${state}&name=${name}`
  );
  return res.json();
};

export async function fetchCustomerMetrics(state, year) {
  const res = await fetch(
    `${BASE_URL}/customer-metrics?state=${state}&year=${year}`
  );
  return res.json();
};

export async function fetchCustomerTrend(state) {
  const res = await fetch(
    `${BASE_URL}/customer-trend?state=${state}`
  );
  return res.json();
};

export const fetchBusinessCustomerHistory = async (state, name) => {
  const res = await fetch(
    `http://localhost:8000/business-customer-history?state=${state}&name=${name}`
  );
  return await res.json();
};

export const fetchCompetitiveBenchmark = async (state, year, category) => {
  const res = await fetch(
    `http://localhost:8000/competitive-benchmark?state=${state}&year=${year}&category=${category}`
  );
  return res.json();
};


export const fetchBusinessBenchmarkDetails = async (
  state,
  year,
  category,
  name
) => {
  const params = new URLSearchParams({
    state,
    year,
    category,
    name
  });

  const response = await fetch(
    `http://localhost:8000/business-benchmark-details?${params}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch branch benchmark details");
  }

  return await response.json();
};

const API_BASE = "http://localhost:8000";

/* ================= INVESTMENT ANALYSIS ================= */
export const fetchInvestmentAnalysis = async (state, years, category = "") => {
  const yearParams = years.map(y => `years=${y}`).join("&");

  const response = await fetch(
    `${API_BASE}/investment-analysis?state=${state}&${yearParams}&category=${encodeURIComponent(category)}`
  );

  return await response.json();
};

/* ================= CATEGORY LEADERBOARD ================= */
export const fetchCategoryBusinesses = async (state, years, category) => {
  const yearParams = years.map(y => `years=${y}`).join("&");

  const response = await fetch(
    `${API_BASE}/investment-category-leaderboard?state=${state}&${yearParams}&category=${encodeURIComponent(category)}`
  );

  return await response.json();
};

/* ================= BUSINESS TREND DETAILS ================= */
export const fetchBusinessDetails = async (state, gmapId) => {

  const response = await fetch(
    `${API_BASE}/investment-business-details?state=${state}&gmap_id=${gmapId}`
  );

  return await response.json();
};

/* ================= COMPLAINT SEVERITY ================= */
export const fetchComplaintSeverity = async (state, year) => {
  const res = await fetch(
    `${BASE_URL}/complaint-severity?state=${state}&year=${year}`
  );
  return await res.json();
};

/* ================= COMPLAINT BUSINESS HISTORY ================= */
export const fetchComplaintBusinessHistory = async (state, name) => {
  const res = await fetch(
    `${BASE_URL}/complaint-business-history?state=${state}&name=${name}`
  );
  return await res.json();
};

import axios from "axios";

// =====================================================
// BUSINESS MAP (STATE WISE)
// =====================================================
export const getBusinessMap = async (state, limit = 10000) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/business-map`,
      {
        params: {
          state: state,
          limit: limit
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching business map:", error);
    return { total_points: 0, points: [] };
  }
};