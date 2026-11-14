import { useEffect, useState, useMemo } from "react";
import {
  fetchStates,
  fetchYears,
  fetchComplaintSeverity,
  fetchComplaintBusinessHistory
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

const complaintsStyles = `
:root{--bg:#f4f6f9;--card:#ffffff;--muted:#6b7280;--accent:#2563eb;--radius:14px}
.comp-page{padding:50px;background:var(--bg);min-height:100vh;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial;color:#0f172a}
.comp-title{margin-bottom:30px;font-weight:700;font-size:28px}
.comp-filterbar{position:sticky;top:0;background:var(--card);padding:28px;border-radius:16px;display:flex;gap:30px;align-items:flex-end;box-shadow:0 8px 24px rgba(2,6,23,0.06);margin-bottom:40px;z-index:10}
.comp-filter-group{display:flex;flex-direction:column;gap:8px;min-width:180px}
.comp-label{font-size:14px;font-weight:700;color:var(--muted)}
.comp-input{padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;font-size:14px;background:#fbfdff}
.comp-kpi-card{background:linear-gradient(135deg, #ffffff 0%, #fafbff 100%);padding:25px;border-radius:4px;box-shadow:0 2px 8px rgba(37,99,235,0.06), inset 0 1px 0 rgba(255,255,255,0.8);border:1px solid rgba(37,99,235,0.08);border-left:4px solid #2563eb;margin-bottom:30px}
.comp-section{background:var(--card);padding:32px;border-radius:16px;box-shadow:0 8px 24px rgba(2,6,23,0.06);margin-bottom:24px}
.comp-section-header{margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #e5e7eb}
.comp-section-title{margin:0;font-size:18px;font-weight:700}
.comp-section-subtitle{font-size:13px;color:#64748b;margin-top:4px}
.comp-table{width:100%;border-collapse:collapse}
.comp-table th{padding:14px;text-align:left;font-size:14px;background:#f7fafc;font-weight:600;position:sticky;top:0;z-index:5}
.comp-table td{padding:14px;font-size:14px;border-top:1px solid #e5e7eb}
.comp-table tbody tr:hover{background:#fbfdff}
.comp-pagination{margin-top:25px;display:flex;justify-content:space-between;align-items:center}
.comp-pag-btn{padding:10px 18px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fbff;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.2s ease}
.comp-search-container{margin-top:30px;display:flex;gap:12px;align-items:flex-start}
.comp-search-input{flex:1;padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;font-size:14px;background:#fbfdff}
.comp-search-btn{padding:10px 20px;background:linear-gradient(90deg, #2563eb 0%, #1f6fd6 100%);color:white;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(37,99,235,0.15);white-space:nowrap}
.comp-loading{padding:10px;font-size:13px;color:#64748b;display:flex;align-items:center;gap:8px;margin-top:12px}
.comp-graphs{margin-top:30px;display:flex;flex-direction:column;gap:30px}
.comp-graph-card{background:var(--card);padding:28px;border-radius:16px;box-shadow:0 8px 24px rgba(2,6,23,0.06)}
.comp-graph-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.comp-graph-title{margin:0;font-size:18px;font-weight:600;color:#0f172a}
.comp-branch-id{font-size:14px;color:#64748b;font-weight:500}
.comp-link{color:#2563eb;font-weight:500;text-decoration:none}
.spinner{width:30px;height:30px;border-radius:50%;border:4px solid rgba(0,0,0,0.06);border-top-color:var(--accent);animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
`;

function injectComplaintsStyles(){
  if(!document.getElementById('comp-styles')){
    const s=document.createElement('style');s.id='comp-styles';s.textContent=complaintsStyles;document.head.appendChild(s);
  }
}

function Complaints() {

  const [states, setStates] = useState([]);
  const [years, setYears] = useState([]);

  const [stateName, setStateName] = useState("");
  const [year, setYear] = useState("");

  const [data, setData] = useState(null);
  const [searchBusiness, setSearchBusiness] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [branchGraphs, setBranchGraphs] = useState({});
  const [selectedBusiness, setSelectedBusiness] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchError, setSearchError] = useState("");
  const rowsPerPage = 25;
  
  // inject styles on mount
  useEffect(() => { injectComplaintsStyles(); }, []);
  

  /*  LOAD STATES  */
  useEffect(() => {
    fetchStates().then(res => {
      const list = res.states || [];
      setStates(list);
      if (list.length > 0) setStateName(list[0]);
    });
  }, []);

  /*  LOAD YEARS  */
  useEffect(() => {
    if (!stateName) return;

    fetchYears(stateName).then(res => {
      const list = res.years || [];
      setYears(list);
      if (list.length > 0) setYear(list[0]);
    });
  }, [stateName]);

  /*  LOAD TABLE  */
  useEffect(() => {
    if (!stateName || !year) return;

    fetchComplaintSeverity(stateName, year).then(res => {
      setData(res);
      setCurrentPage(1); // reset page
    });

    setBranchGraphs({});
    setSearchBusiness("");
    setSearchError("");
    setSelectedBusiness("");

  }, [stateName, year]);

  /*  PAGINATED DATA  */
  const paginatedData = useMemo(() => {
    if (!data?.leaderboard) return [];
    return data.leaderboard.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [data, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil((data?.leaderboard?.length || 0) / rowsPerPage);
  }, [data]);

  /*  SEARCH BUSINESS  */
const handleSearchKeyDown = async (e) => {
  if (e.key !== "Enter" && e.type !== "click") return;
  if (!searchBusiness.trim()) return;
  if (!data?.leaderboard) return;

  setSearchLoading(true);
  setSearchError("");
  try {
    // Get all matching branches from leaderboard (use includes for more flexible matching)
    const searchTerm = searchBusiness.trim().toLowerCase();
    const matchedBranches = data.leaderboard.filter(b =>
      b.name.toLowerCase().includes(searchTerm)
    );

    if (matchedBranches.length === 0) {
      setSearchError("Business not found in leaderboard. Try searching with another name.");
      setSearchLoading(false);
      return;
    }

    // SET SELECTED BUSINESS HERE
    setSelectedBusiness(matchedBranches[0].name);

    const res = await fetchComplaintBusinessHistory(
      stateName,
      searchBusiness.trim()
    );

    const history = res.history || [];

    // Group by branch id (only those from leaderboard)
    const grouped = {};

    matchedBranches.forEach(branch => {
      const branchId = branch.gmap_id;

      const branchHistory = history.filter(
        item => item.gmap_id === branchId
      );

      if (branchHistory.length > 0) {
        grouped[branchId] = branchHistory;
      }
    });

    setBranchGraphs(grouped);
    setSearchError("");
  } catch (err) {
    console.error(err);
    setSearchError("Error searching business. Please try again.");
  }
  setSearchLoading(false);
};

  return (
    <div className="comp-page" style={pageContainer}>

      <h2 className="comp-title" style={pageTitle}>Complaint Severity Detection</h2>

      {/*  FILTER BAR  */}
      <div className="comp-filterbar" style={stickyFilterBar}>

        <div className="comp-filter-group" style={filterGroup}>
          <label className="comp-label" style={labelStyle}>State</label>
          <select
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            className="comp-input"
            style={inputStyle}
          >
            {states.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="comp-filter-group" style={filterGroup}>
          <label className="comp-label" style={labelStyle}>Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="comp-input"
            style={inputStyle}
          >
            {years.map((y, i) => (
              <option key={i} value={y}>{y}</option>
            ))}
          </select>
        </div>

      </div>

      {/*  KPI  */}
      {data?.message && (
        <div className="comp-kpi-card" style={kpiCard}>
          <h3 style={{ margin: 0, color: "#16a34a", fontSize: "16px", fontWeight: "600" }}>
            {data.message}
          </h3>
        </div>
      )}

      {data?.worst_business && !data?.message && (
        <div className="comp-kpi-card" style={kpiCard}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Worst Negative Review Ratio</h4>
          <h2 style={{ margin: "0", fontSize: "24px", fontWeight: "700", color: "#0f172a" }}>
            {data.worst_business.name} — {(data.worst_business.negative_review_ratio * 100).toFixed(1)}%
          </h2>
        </div>
      )}

      {/*  TABLE  */}
      {data?.leaderboard?.length > 0 && (
        <div className="comp-section" style={leaderboardCard}>

          <div className="comp-section-header" style={cardHeaderStyle}>
            <div>
              <h3 className="comp-section-title" style={sectionTitle}>Complaint Severity Leaderboard</h3>
              <span className="comp-section-subtitle" style={subTextStyle}>
                {data.leaderboard.length} Businesses • {year}
              </span>
            </div>
          </div>

          <div style={tableContainerStyle}>
            <table className="comp-table" style={tableStyle}>
              <thead>
                <tr>
                  <th className="comp-table-th" style={thStyle}>Rank</th>
                  <th className="comp-table-th" style={thStyle}>Business</th>
                  <th className="comp-table-th" style={thStyle}>Complaint Score</th>
                  <th className="comp-table-th" style={thStyle}>Negative Review Ratio</th>
                  <th className="comp-table-th" style={thStyle}>Sentiment Score</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((b, i) => (
                  <tr key={i} style={rowStyle}>
                    <td style={tdStyle}>{b.rank}</td>
                    <td style={tdStyle}>{b.name}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {b.complaint_score.toFixed(3)}
                    </td>
                    <td style={tdStyle}>
                      {(b.negative_review_ratio * 100).toFixed(1)}%
                    </td>
                    <td style={tdStyle}>
                      {b.avg_sentiment_score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/*  PAGINATION  */}
        <div className="comp-pagination" style={paginationContainerStyle}>

          <button
            className="comp-pag-btn"
            style={{
              ...paginationButtonStyle,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? "not-allowed" : "pointer"
            }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            onMouseOver={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = "#e2e8f0";
              }
            }}
            onMouseOut={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = "#f8fbff";
              }
            }}
          >
            Previous
          </button>

          <span style={paginationTextStyle}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="comp-pag-btn"
            style={{
              ...paginationButtonStyle,
              opacity: currentPage >= totalPages ? 0.5 : 1,
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer"
            }}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            onMouseOver={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = "#e2e8f0";
              }
            }}
            onMouseOut={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = "#f8fbff";
              }
            }}
          >
            Next
          </button>

        </div>

          {/*  SEARCH  */}
          <div className="comp-search-container" style={searchContainerStyle}>
            <input
              type="text"
              placeholder="Search business and press Enter..."
              value={searchBusiness}
              onChange={(e) => {
                setSearchBusiness(e.target.value);
                setSearchError("");
              }}
              onKeyDown={handleSearchKeyDown}
              className="comp-search-input"
              style={searchInputStyle}
            />
            <button
              className="comp-search-btn"
              style={searchButtonStyle}
              onClick={handleSearchKeyDown}
            >
              Search
            </button>
          </div>
          {searchError && <div className="comp-error" style={errorStyle}>{searchError}</div>}
          {searchLoading && <div className="comp-loading" style={loadingStyle}><div className="spinner"></div>Searching...</div>}

        </div>
      )}

      {/*  GRAPH  */}
     {Object.keys(branchGraphs).length > 0 && (

  <div className="comp-graphs" style={graphsContainerStyle}>

    {Object.entries(branchGraphs).map(([branchId, branchData]) => (

      <div key={branchId} className="comp-graph-card" style={graphCardStyle}>

        <div className="comp-graph-header" style={graphHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3 className="comp-graph-title" style={graphTitleStyle}>
            {selectedBusiness}
          </h3>

          <span className="comp-branch-id" style={branchInlineStyle}>
            (Branch ID: {branchId})
          </span>
        </div>

        <a
          href={branchData[0]?.google_maps_link}
          target="_blank"
          rel="noopener noreferrer"
          className="comp-link"
          style={linkStyle}
        >
          Open in Maps
        </a>
      </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={branchData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
            <Line
              type="monotone"
              dataKey="negative_ratio"
              stroke="#dc2626"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

      </div>

    ))}

  </div>
)} </div>
  );
};

/*  STYLES  */

const pageContainer = {
  padding: "50px",
  background: "#f4f6f9",
  minHeight: "100vh"
};

const pageTitle = {
  marginBottom: "30px",
  fontWeight: "700",
  fontSize: "28px"
};

const stickyFilterBar = {
  position: "sticky",
  top: 0,
  background: "white",
  padding: "28px",
  borderRadius: "16px",
  display: "flex",
  gap: "30px",
  alignItems: "flex-end",
  boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
  marginBottom: "40px",
  zIndex: 10
};

const filterGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: "180px"
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#475569"
};

const inputStyle = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  background: "#fbfdff"
};

const leaderboardCard = {
  background: "white",
  padding: "32px",
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
};

const kpiCard = {
  background: "linear-gradient(135deg, #ffffff 0%, #fafbff 100%)",
  padding: "25px",
  borderRadius: "4px",
  boxShadow: "0 2px 8px rgba(37,99,235,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
  border: "1px solid rgba(37,99,235,0.08)",
  borderLeft: "4px solid #2563eb",
  marginBottom: "30px"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse"
};

const thStyle = {
  padding: "14px",
  textAlign: "left",
  fontSize: "14px",
  background: "#f7fafc",
  position: "sticky",
  top: 0,
  zIndex: 5,
  fontWeight: "600"
};

const tdStyle = {
  padding: "14px",
  fontSize: "14px"
};

const rowStyle = {
  borderTop: "1px solid #e5e7eb"
};

const tableContainerStyle = {
  maxHeight: "450px",
  overflowY: "auto",
  borderRadius: "10px"
};

const cardHeaderStyle = {
  marginBottom: "20px",
  paddingBottom: "15px",
  borderBottom: "1px solid #e5e7eb"
};

const sectionTitle = {
  margin: "0",
  fontSize: "18px",
  fontWeight: "700"
};

const subTextStyle = {
  fontSize: "13px",
  color: "#64748b"
};

const linkStyle = {
  color: "#2563eb",
  fontWeight: 500,
  textDecoration: "none"
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
  background: "#f8fbff",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 0.2s ease",
  cursor: "pointer"
};

const paginationTextStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#334155"
};

const searchContainerStyle = {
  marginTop: "30px",
  display: "flex",
  gap: "12px",
  alignItems: "flex-start"
};

const searchInputStyle = {
  flex: 1,
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  background: "#fbfdff"
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

const loadingStyle = {
  padding: "10px",
  fontSize: "13px",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "12px"
};

const graphsContainerStyle = {
  marginTop: "30px",
  display: "flex",
  flexDirection: "column",
  gap: "30px"
};

const graphCardStyle = {
  background: "white",
  padding: "28px",
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
};

const graphHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const graphTitleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 600,
  color: "#1e293b"
};

const branchInlineStyle = {
  fontSize: "14px",
  color: "#64748b",
  fontWeight: 500
};

const errorStyle = {
  padding: "12px 16px",
  fontSize: "13px",
  color: "#dc2626",
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  marginTop: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

export default Complaints;