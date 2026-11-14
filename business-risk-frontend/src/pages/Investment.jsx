import { useEffect, useState, useMemo } from "react";
import {
  fetchStates,
  fetchYears,
  fetchInvestmentAnalysis,
  fetchCategoryBusinesses,
  fetchBusinessDetails
} from "../api/dataService";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const invStyles = `
:root{--bg:#f4f6f9;--card:#ffffff;--muted:#6b7280;--accent:#2563eb;--radius:14px}
.inv-page{padding:50px;background:var(--bg);min-height:100vh;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial;color:#0f172a}
.inv-title{margin-bottom:20px;font-weight:700;font-size:28px}
.inv-filterbar{display:grid;grid-template-columns:auto 1fr;gap:40px;margin-bottom:50px;background:var(--card);padding:28px;border-radius:16px;box-shadow:0 12px 36px rgba(2,6,23,0.06);align-items:start}

.inv-filter-group{display:flex;flex-direction:column;gap:8px;min-width:220px}
.inv-label{font-size:14px;font-weight:700;color:var(--muted)}
.inv-year-box{padding:12px;border-radius:10px;border:1px solid #e6eefb;background:#fbfdff;font-size:14px}
.inv-chip{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:9999px;cursor:pointer;user-select:none;background:#f1f5f9;color:#0f172a;font-weight:600;border:1px solid #eef4fb}
.inv-chip.selected{background:var(--accent);color:white;box-shadow:0 12px 28px rgba(37,99,235,0.12);font-weight:700;border:none}
.inv-apply{padding:8px 16px;background:linear-gradient(90deg,var(--accent) 0%, #1f6fd6 100%);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:800;box-shadow:0 8px 20px rgba(37,99,235,0.12);align-self:center}
.inv-btn-sm{padding:8px 14px;border-radius:10px;border:none;cursor:pointer;font-weight:700}
.inv-btn-sm.outline{background:white;color:var(--accent);border:1px solid #bfd7ff}
.inv-section{background:var(--card);padding:32px;border-radius:16px;box-shadow:0 12px 36px rgba(2,6,23,0.06);margin-bottom:24px}
.inv-section-title{margin-bottom:20px;font-size:18px;font-weight:700}
.inv-table{width:100%;border-collapse:collapse}
.inv-table th,.inv-table td{padding:14px;text-align:left;font-size:14px}
.inv-table thead tr{background:#f7fafc}
.inv-row{border-top:1px solid #e6eef8}
.inv-table tbody tr:hover{background:#fbfdff}
.inv-input{padding:12px;border-radius:10px;border:1px solid #e6eefb;width:100%}
.inv-search-row{display:flex;gap:12px;margin-top:20px}
.inv-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(2,6,23,0.5);display:flex;justify-content:center;align-items:center;z-index:1200}
.inv-modal{background:var(--card);padding:32px;border-radius:18px;width:760px}
.inv-pagination{display:flex;justify-content:space-between;align-items:center;margin-top:20px}
.inv-pag-btn{padding:10px 18px;border-radius:8px;border:1px solid #e6eefb;background:#f8fbff;cursor:pointer}
.inv-loading{padding:10px;font-size:13px;color:#64748b;display:flex;align-items:center;gap:8px}
.spinner{width:30px;height:30px;border-radius:50%;border:4px solid rgba(0,0,0,0.06);border-top-color:var(--accent);animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media (max-width:1000px){.inv-kpis{grid-template-columns:1fr}.inv-filterbar{display:grid;grid-template-columns:1fr;gap:20px}}
`;

function injectInvStyles(){
  if(!document.getElementById('inv-styles')){
    const s=document.createElement('style');s.id='inv-styles';s.textContent=invStyles;document.head.appendChild(s);
  }
}
function InvestmentExpansion() {

  const [states, setStates] = useState([]);
  const [years, setYears] = useState([]);

  const [stateName, setStateName] = useState("");
  const [selectedYears, setSelectedYears] = useState([]);
  const [tempYears, setTempYears] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [categorySearch, setCategorySearch] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryLeaderboard, setCategoryLeaderboard] = useState(null);

  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessTrend, setBusinessTrend] = useState(null);

  const [currentPageCategories, setCurrentPageCategories] = useState(1);
  const [currentPageCategoryLb, setCurrentPageCategoryLb] = useState(1);
  const rowsPerPage = 25;

  // inject styles on mount
  useEffect(() => { injectInvStyles(); }, []);

  /*  LOAD STATES  */
  useEffect(() => {
    fetchStates().then(res => {
      setStates(res.states || []);
      if (res.states?.length > 0) {
        setStateName(res.states[0]);
      }
    });
  }, []);

  /*  LOAD YEARS  */
  useEffect(() => {
    if (!stateName) return;

    fetchYears(stateName).then(res => {
      setYears(res.years || []);
    });

  }, [stateName]);

  /*  APPLY FILTERS  */
  const applyFilters = async () => {
    if (!stateName || tempYears.length === 0) return;

    setSelectedYears(tempYears);
    setCategoryLeaderboard(null);
    setSelectedBusiness(null);
    setBusinessTrend(null);

    setLoading(true);

    try {
      const res = await fetchInvestmentAnalysis(stateName, tempYears);
      setData(res);
      setCurrentPageCategories(1);
    } catch (err) {
      console.error(err);
      setData(null);
    }

    setLoading(false);
  };

  /*  CATEGORY SEARCH  */
  const handleCategorySearch = async (e) => {
    if (e.key !== "Enter" && e.type !== "click") return;
    if (!categorySearch.trim()) return;

    setCategoryLoading(true);
    try {
      const res = await fetchCategoryBusinesses(
        stateName,
        selectedYears,
        categorySearch
      );
      setCategoryLeaderboard(res);
    } catch (err) {
      console.error(err);
    }
    setCategoryLoading(false);
  };

  /*  OPEN BUSINESS MODAL  */
  const openBusinessModal = async (business) => {
    setSelectedBusiness(business);

    const res = await fetchBusinessDetails(
      stateName,
      business.gmap_id
    );

    setBusinessTrend(res);
  };

  /*  STATE CHANGE HANDLER  */
  const handleStateChange = (val) => {
    setStateName(val);
    // reset all selections and results when state changes
    setTempYears([]);
    setSelectedYears([]);
    setData(null);
    setCategoryLeaderboard(null);
    setSelectedBusiness(null);
    setBusinessTrend(null);
    setCurrentPageCategories(1);
    setCurrentPageCategoryLb(1);
  };

  /*  YEAR SELECTION HELPERS  */
  const toggleYear = (y) => {
    setTempYears(prev => {
      const exists = prev.includes(y);
      if (exists) return prev.filter(v => v !== y);
      const next = [...prev, y];
      return next.sort((a, b) => a - b);
    });
    // clear any applied results when user changes year selection
    setSelectedYears([]);
    setData(null);
    setCategoryLeaderboard(null);
    setSelectedBusiness(null);
    setBusinessTrend(null);
  };

  const selectAllYears = () => {
    setTempYears(Array.isArray(years) ? [...years].sort((a,b)=>a-b) : []);
    setSelectedYears([]);
    setData(null);
    setCategoryLeaderboard(null);
    setSelectedBusiness(null);
    setBusinessTrend(null);
    setCurrentPageCategories(1);
    setCurrentPageCategoryLb(1);
  };

  const clearYears = () => setTempYears([]);
  // also clear results when clearing years
  const clearYearsAndResults = () => {
    setTempYears([]);
    setSelectedYears([]);
    setData(null);
    setCategoryLeaderboard(null);
    setSelectedBusiness(null);
    setBusinessTrend(null);
    setCurrentPageCategories(1);
    setCurrentPageCategoryLb(1);
  };

  /*  PAGINATION COMPUTE (unconditional hooks)  */
  const paginatedCategories = useMemo(() => {
    if (!data?.categories) return [];
    const start = (currentPageCategories - 1) * rowsPerPage;
    return data.categories.slice(start, start + rowsPerPage);
  }, [data, currentPageCategories]);

  const categoriesTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil((data?.categories?.length || 0) / rowsPerPage));
  }, [data]);

  const paginatedCategoryLeaderboard = useMemo(() => {
    if (!categoryLeaderboard?.leaderboard) return [];
    const start = (currentPageCategoryLb - 1) * rowsPerPage;
    return categoryLeaderboard.leaderboard.slice(start, start + rowsPerPage);
  }, [categoryLeaderboard, currentPageCategoryLb]);

  const categoryLbTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil((categoryLeaderboard?.leaderboard?.length || 0) / rowsPerPage));
  }, [categoryLeaderboard]);

  return (
    <div className="inv-page" style={pageContainer}>

      <h2 className="inv-title" style={pageTitle}>
        Investment & Expansion Decision Support
      </h2>

      {/*  FILTER BAR  */}
      <div className="inv-filterbar" style={filterBar}>

        <div className="inv-filter-group" style={filterGroup}>
          <label className="inv-label" style={labelStyle}>State</label>
          <select
            value={stateName}
            onChange={(e) => handleStateChange(e.target.value)}
            style={inputStyle}
          >
            {states.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* wrapper containing years and apply button */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
          <div className="inv-filter-group" style={{ ...filterGroup, flex: 1, maxWidth: 760 }}>
            <label className="inv-label" style={labelStyle}>Years</label>

            <div className="inv-year-box" style={yearDisplayBox}>
              {tempYears.length === 0 ? "Select years..." : tempYears.join(", ")}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button className="inv-btn-sm" style={smallPrimaryButton} onClick={selectAllYears}>Select All</button>
              <button className="inv-btn-sm outline" style={smallOutlineButton} onClick={clearYears}>Clear</button>
            </div>

            <div style={{ ...chipGrid, marginTop: 18 }}>
              {years.map((y, i) => {
                const selected = tempYears.includes(y);
                return (
                  <div
                    key={i}
                    onClick={() => toggleYear(y)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleYear(y); } }}
                      className={selected ? 'inv-chip selected' : 'inv-chip'}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 14px",
                        borderRadius: "9999px",
                        cursor: "pointer",
                        userSelect: "none",
                        fontWeight: selected ? 700 : 600
                      }}
                  >
                    {y}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={applyContainer}>
            <button className="inv-apply" style={applyButtonBig} onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>

      </div>

      {loading && <div className="inv-loading" style={{ marginTop: "20px" }}><div className="spinner"></div>Loading Investment Analysis...</div>}

      {/*  DATA SECTION  */}
      {data && !loading && (
        <>

          {/*  CATEGORY TABLE  */}
          <div className="inv-section" style={card}>
            <h3 className="inv-section-title" style={sectionTitle}>
              Investment Opportunities by Category
            </h3>

            <div style={tableWrapper}>
              <table className="inv-table" style={tableStyle}>
                <thead style={tableHeader}>
                  <tr>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Avg Risk</th>
                    <th style={thStyle}>Businesses</th>
                  </tr>
                </thead>
                <tbody>
                    {paginatedCategories.map((c, i) => (
                      <tr key={i} className="inv-row" style={rowStyle}>
                        <td style={tdStyle}>{c.category}</td>
                        <td style={tdStyle}>
                          {(c.risk_score * 100).toFixed(1)}
                        </td>
                        <td style={tdStyle}>{c.business_count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/** Pagination for categories */}
            {data?.categories?.length > rowsPerPage && (
              <div style={paginationContainerStyle}>
                <button
                  style={{
                    ...paginationButtonStyle,
                    opacity: currentPageCategories === 1 ? 0.5 : 1,
                    cursor: currentPageCategories === 1 ? "not-allowed" : "pointer"
                  }}
                  disabled={currentPageCategories === 1}
                  onClick={() => setCurrentPageCategories(prev => prev - 1)}
                  onMouseOver={(e) => { if (!e.target.disabled) e.target.style.background = "#e2e8f0" }}
                  onMouseOut={(e) => { if (!e.target.disabled) e.target.style.background = "white" }}
                >
                  Previous
                </button>

                <span style={paginationTextStyle}>
                  Page {currentPageCategories} of {categoriesTotalPages}
                </span>

                <button
                  style={{
                    ...paginationButtonStyle,
                    opacity: currentPageCategories >= categoriesTotalPages ? 0.5 : 1,
                    cursor: currentPageCategories >= categoriesTotalPages ? "not-allowed" : "pointer"
                  }}
                  disabled={currentPageCategories >= categoriesTotalPages}
                  onClick={() => setCurrentPageCategories(prev => prev + 1)}
                  onMouseOver={(e) => { if (!e.target.disabled) e.target.style.background = "#e2e8f0" }}
                  onMouseOut={(e) => { if (!e.target.disabled) e.target.style.background = "white" }}
                >
                  Next
                </button>
              </div>
            )}

            <div style={{ marginTop: "30px" }}>
              <div className="inv-search-row">
                <input
                  type="text"
                  placeholder="Enter category and press Enter..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  onKeyDown={handleCategorySearch}
                  className="inv-input"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  className="inv-apply"
                  style={searchButtonStyle}
                  onClick={handleCategorySearch}
                >
                  Search
                </button>
              </div>
              {categoryLoading && <div className="inv-loading" style={{ marginTop: "12px" }}><div className="spinner"></div>Searching...</div>}
            </div>

          </div>

          {/*  CATEGORY LEADERBOARD  */}
          {categoryLeaderboard?.leaderboard?.length > 0 && (
            <div className="inv-section" style={{ ...card, marginTop: "40px" }}>
              <h3 className="inv-section-title" style={sectionTitle}>
                Category Leaderboard
              </h3>

              <div style={tableWrapper}>
                <table className="inv-table" style={tableStyle}>
                  <thead style={tableHeader}>
                    <tr>
                      <th style={thStyle}>Rank</th>
                      <th style={thStyle}>Business</th>
                      <th style={thStyle}>Risk</th>
                      <th style={thStyle}>Maps</th>
                    </tr>
                  </thead>
                  <tbody>
                        {paginatedCategoryLeaderboard.map((b, i) => (
                          <tr key={i} className="inv-row" style={rowStyle}>
                            <td style={tdStyle}>{b.rank}</td>
                            <td
                              style={{ ...tdStyle, cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
                              onClick={() => openBusinessModal(b)}
                            >
                              {b.name}
                            </td>
                            <td style={tdStyle}>
                              {(b.risk_score * 100).toFixed(1)}
                            </td>
                            <td style={tdStyle}>
                              <a
                                href={b.google_maps_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#2563eb", fontWeight: 500 }}
                              >
                                Open
                              </a>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/** Pagination for category leaderboard */}
              {categoryLeaderboard?.leaderboard?.length > rowsPerPage && (
                <div className="inv-pagination" style={paginationContainerStyle}>
                  <button
                    className="inv-pag-btn"
                    style={{
                      ...paginationButtonStyle,
                      opacity: currentPageCategoryLb === 1 ? 0.5 : 1,
                      cursor: currentPageCategoryLb === 1 ? "not-allowed" : "pointer"
                    }}
                    disabled={currentPageCategoryLb === 1}
                    onClick={() => setCurrentPageCategoryLb(prev => prev - 1)}
                    onMouseOver={(e) => { if (!e.target.disabled) e.target.style.background = "#e2e8f0" }}
                    onMouseOut={(e) => { if (!e.target.disabled) e.target.style.background = "white" }}
                  >
                    Previous
                  </button>

                  <span style={paginationTextStyle}>
                    Page {currentPageCategoryLb} of {categoryLbTotalPages}
                  </span>

                  <button
                    className="inv-pag-btn"
                    style={{
                      ...paginationButtonStyle,
                      opacity: currentPageCategoryLb >= categoryLbTotalPages ? 0.5 : 1,
                      cursor: currentPageCategoryLb >= categoryLbTotalPages ? "not-allowed" : "pointer"
                    }}
                    disabled={currentPageCategoryLb >= categoryLbTotalPages}
                    onClick={() => setCurrentPageCategoryLb(prev => prev + 1)}
                    onMouseOver={(e) => { if (!e.target.disabled) e.target.style.background = "#e2e8f0" }}
                    onMouseOut={(e) => { if (!e.target.disabled) e.target.style.background = "white" }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/*  MODAL  */}
      {selectedBusiness && businessTrend && (
        <div className="inv-modal-overlay" style={modalOverlay}>
          <div className="inv-modal" style={modalBox}>

            <h3 style={{ marginBottom: "15px" }}>
              {selectedBusiness.name}
              <span style={{
                fontSize: "14px",
                marginLeft: "10px",
                color: "#64748b"
              }}>
                (Branch ID: {selectedBusiness.gmap_id})
              </span>
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={businessTrend.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#dc2626"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>

            <button
              className="inv-apply"
              style={{ ...applyButton, marginTop: "25px" }}
              onClick={() => {
                setSelectedBusiness(null);
                setBusinessTrend(null);
              }}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

/*  STYLES  */

const pageContainer = {
  padding: "50px",
  background: "#f8fafc",
  minHeight: "100vh"
};

const pageTitle = {
  marginBottom: "20px",
  fontWeight: "700",
  fontSize: "28px"
};

const filterBar = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "40px",
  marginBottom: "50px",
  background: "white",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 6px 24px rgba(0,0,0,0.05)",
  alignItems: "start"
};

const filterGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: "220px"
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#475569"
};

const yearDisplayBox = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#f1f5f9",
  fontSize: "14px"
};

const inputStyle = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0"
};
const smallPrimaryButton = {
  padding: "8px 14px",
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14
};

const smallOutlineButton = {
  padding: "8px 14px",
  background: "#ffffff",
  color: "#2563eb",
  border: "1px solid #bfd7ff",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14
};

const applyButton = {
  padding: "8px 16px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14
};

const applyButtonBig = {
  padding: "10px 16px",
  marginLeft: "8px",
  marginTop: "27px",
  marginRight: "37px",
  background: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "0 8px 20px rgba(37,99,235,0.12)",
  fontSize: 14,
  flexShrink: 0
};

const applyContainer = {
  display: "flex",
  alignItems: "center"
};

const chipGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(80px, 1fr))",
  gap: "12px",
  alignItems: "start"
};

const card = {
  background: "white",
  padding: "35px",
  borderRadius: "16px",
  boxShadow: "0 6px 24px rgba(0,0,0,0.05)"
};

const sectionTitle = {
  marginBottom: "25px",
  fontSize: "18px",
  fontWeight: "600"
};

const tableWrapper = {
  maxHeight: "400px",
  overflowY: "auto",
  borderRadius: "12px"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse"
};

const tableHeader = {
  background: "#f1f5f9"
};

const thStyle = {
  padding: "14px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "600"
};

const tdStyle = {
  padding: "14px",
  fontSize: "14px"
};

const rowStyle = {
  borderTop: "1px solid #e5e7eb"
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modalBox = {
  background: "white",
  padding: "40px",
  borderRadius: "18px",
  width: "750px"
};

const paginationContainerStyle = {
  marginTop: "25px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const paginationButtonStyle = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 0.2s ease"
};

const paginationTextStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#334155"
};

const searchButtonStyle = {
  padding: "10px 20px",
  background: "linear-gradient(90deg, #2563eb 0%, #1f6fd6 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  boxShadow: "0 4px 12px rgba(37,99,235,0.15)",
  whiteSpace: "nowrap"
};

export default InvestmentExpansion;
