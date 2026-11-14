import { useEffect, useState } from "react";
import React from "react";
import RiskCard from "../components/RiskCard";
import {
  fetchOverview,
  fetchStates,
  fetchYears,
  fetchBusinessHistory
} from "../api/dataService";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

const raStyles = `
:root{
  --bg:#f4f6f9;
  --card:#ffffff;
  --muted:#888ea3;
  --accent:#3498db;
  --radius:12px;
}
.ra-page{
  padding:40px;
  background:var(--bg);
  min-height:100vh;
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  color:#111827;
}
.ra-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:16px;
  margin-bottom:20px;
}
.ra-title{
  font-size:20px;
  font-weight:700;
}
.ra-filterbar{
  display:flex;
  gap:16px;
  margin-bottom:28px;
  align-items:center;
  flex-wrap:wrap;
}
.ra-select{
  padding:10px 14px;
  border-radius:10px;
  border:1px solid #e6e9ef;
  background:var(--card);
  font-size:14px;
  min-width:160px;
  cursor:pointer;
}
.ra-search{
  display:flex;
  gap:8px;
  align-items:center;
  flex:1;
}
.ra-input{
  flex:1;
  padding:10px 14px;
  border-radius:10px;
  border:1px solid #e6e9ef;
  font-size:14px;
  background:var(--card);
}
.ra-search-button{
  padding:10px 16px;
  border-radius:10px;
  border:none;
  background:var(--accent);
  color:white;
  cursor:pointer;
  font-weight:600;
  transition:all 0.2s ease;
}
.ra-search-button:hover{
  background:#2980b9;
  box-shadow:0 4px 12px rgba(52,152,219,0.3);
}
.ra-kpis{
  display:flex;
  gap:20px;
  margin-bottom:36px;
  flex-wrap:wrap;
}
.ra-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:30px;
}
.ra-card{
  background:var(--card);
  padding:24px;
  border-radius:var(--radius);
  box-shadow:0 8px 24px rgba(16,24,40,0.06);
}
.ra-chart-wrap{
  display:flex;
  justify-content:center;
  width:100%;
  margin:0 auto;
}
.ra-chart-inner{
  position:relative;
  width:320px;
  height:280px;
}
.ra-center-text{
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  text-align:center;
}
.ra-table{
  width:100%;
  border-collapse:collapse;
  background:#fbfdff;
  border-radius:8px;
  overflow:hidden;
}
.ra-table thead tr{background:#f7f9fc}
.ra-table th,.ra-table td{padding:12px 10px;text-align:left}
.ra-table tbody tr{border-top:1px solid #f1f5f9}
.ra-table tbody tr:hover{background:#f0f7ff}
.ra-branch{
  margin-bottom:28px;
}
.ra-explain-btn{
  padding:8px 14px;
  border-radius:8px;
  border:none;
  background:linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color:white;
  cursor:pointer;
  font-size:13px;
  font-weight:600;
  transition:all 0.2s ease;
  box-shadow:0 2px 8px rgba(52,152,219,0.2);
}
.ra-explain-btn:hover{
  transform:translateY(-2px);
  box-shadow:0 4px 12px rgba(52,152,219,0.35);
}
.ra-explanation{
  background:linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding:14px;
  border-radius:8px;
  margin-top:8px;
  font-size:14px;
  line-height:1.6;
  border-left:4px solid var(--accent);
  color:#1e3a5f;
}
.ra-loading{
  padding:10px;
  font-size:13px;
  color:#64748b;
  display:flex;
  align-items:center;
  gap:8px;
}
.spinner{
  width:30px;
  height:30px;
  border-radius:50%;
  border:4px solid rgba(0,0,0,0.06);
  border-top-color:var(--accent);
  animation:spin 1s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
@media (max-width:900px){
  .ra-grid{grid-template-columns:1fr}
  .ra-kpis{flex-direction:column}
}
`;

function injectStyles() {
  if (!document.getElementById('ra-styles')) {
    const style = document.createElement('style');
    style.id = 'ra-styles';
    style.textContent = raStyles;
    document.head.appendChild(style);
  }
}

const COLORS = ["#2ecc71", "#f1c40f", "#e74c3c"];

function RiskAssessment() {

  const [states, setStates] = useState([]);
  const [years, setYears] = useState([]);
  const [stateName, setStateName] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState(null);
  const [topLoading, setTopLoading] = useState(true);

  const [searchState, setSearchState] = useState("");
  const [searchBusiness, setSearchBusiness] = useState("");
  const [businessHistory, setBusinessHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [yearExplanations, setYearExplanations] = useState({});
  const [loadingRow, setLoadingRow] = useState(null);

  // INJECT STYLES ON MOUNT
  useEffect(() => {
    injectStyles();
  }, []);

  // LOAD STATES
  useEffect(() => {
    fetchStates().then(res => {
      setStates(res.states || []);
      if (res.states?.length > 0) {
        setStateName(res.states[0]);
        setSearchState(res.states[0]);
      }
    });
  }, []);

  // LOAD YEARS
  useEffect(() => {
    if (!stateName) return;
    fetchYears(stateName).then(res => {
      setYears(res.years || []);
      if (res.years?.length > 0) {
        setYear(res.years[0]);
      }
    });
  }, [stateName]);

  useEffect(() => {
  setBusinessHistory([]);
  setHasSearched(false);
  setYearExplanations({}); 
}, [searchState]);

useEffect(() => {
  setYearExplanations({});
}, [searchBusiness]);

  // LOAD OVERVIEW
  useEffect(() => {
    if (!stateName || !year) return;

    setTopLoading(true);
    fetchOverview(stateName, year).then(json => {
      setData(json);
      setTopLoading(false);
    });
  }, [stateName, year]);

  /* NEW: Manual Search Function */

 const handleBusinessSearch = () => {
  if (!searchState || !searchBusiness.trim()) {
    setBusinessHistory([]);
    setHasSearched(false);
    setYearExplanations({});
    return;
  }

  setHistoryLoading(true);
  setHasSearched(true);   
  setYearExplanations({});

  fetchBusinessHistory(searchState, searchBusiness.trim())
    .then(res => {
      setBusinessHistory(res.history || []);
      setHistoryLoading(false);
    })
    .catch(() => {
      setHistoryLoading(false);
    });
};

const handleExplainYear = async (item) => {

  const key = `${item.gmap_id}_${item.year}`;
  setLoadingRow(key);

  try {
    const response = await fetch("http://localhost:8000/year-risk-explanation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        state: item.state,      
        gmap_id: item.gmap_id,
        year: item.year,
        low: item.low,
        medium: item.medium,
        high: item.high,
        total_reviews: item.total_reviews,
        negative_review_ratio: item.negative_review_ratio,
        prediction: item.prediction,
        risk_label: item.risk_label,
        avg_sentiment_score: item.avg_sentiment_score
      })
    });

    const data = await response.json();

    setYearExplanations(prev => ({
      ...prev,
      [key]: data.explanation
    }));

  } catch (err) {
    setYearExplanations(prev => ({
      ...prev,
      [key]: "Error generating explanation."
    }));
  }

  setLoadingRow(null);
};


  /* REMOVED AUTO-LOADING useEffect */

  if (!data && topLoading)
    return (
      <div className="ra-page">
        <div className="ra-card" style={{textAlign:'center'}}>
          <div className="spinner" style={{margin:'8px auto'}} />
          <div style={{marginTop:8}}>Loading Dashboard...</div>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="ra-page">
        <div className="ra-card">No Data Available</div>
      </div>
    );

  const chartData = [
    { name: "Low", value: data.counts.low },
    { name: "Medium", value: data.counts.medium },
    { name: "High", value: data.counts.high }
  ];

  const totalBusinesses =
    data.counts.low +
    data.counts.medium +
    data.counts.high;

  return (
    <div className="ra-page">

      <div className="ra-header">
        <div>
          <div className="ra-title">Risk Assessment Dashboard</div>
          <div style={{ color: '#6b7280', fontSize:13 }}>State & year overview, top risks, and history</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="ra-filterbar">
        <select
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
          className="ra-select"
        >
          {states.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="ra-select"
        >
          {years.map((y, i) => (
            <option key={i} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* KPI CARDS */}
      <div className="ra-kpis">
        <RiskCard title="Low Risk" value={data.counts.low} color="#2ecc71" />
        <RiskCard title="Medium Risk" value={data.counts.medium} color="#f1c40f" />
        <RiskCard title="High Risk" value={data.counts.high} color="#e74c3c" />
      </div>

      {/* CHART + TOP 10 */}
      <div className="ra-grid" style={{gridTemplateColumns: data.top_high_risk.length === 0 ? '1fr' : undefined}}>

        {/* DONUT */}
        <div className="ra-card">
          <h3 style={titleStyle}>Risk Distribution</h3>

          <div className="ra-chart-wrap">
            <div className="ra-chart-inner">
              <PieChart width={320} height={280}>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={75}
                outerRadius={105}
                cx="50%"
                cy="50%"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
              <div className="ra-center-text">
              <h2 style={{ margin: 0 }}>{totalBusinesses.toLocaleString()}</h2>
              <span style={{ fontSize: "13px", color: "#888" }}>
                Total Businesses
              </span>
              </div>
            </div>
          </div>
        </div>

        {data.top_high_risk.length > 0 && (
          <div className="ra-card">
            <h3 style={titleStyle}>Top 10 High Risk Businesses</h3>
            <table className="ra-table">
              <tbody>
                {data.top_high_risk.map((b, i) => (
                  <tr key={i}>
                    <td>{b.name}</td>
                    <td style={{ textAlign: 'right', color:'#e74c3c', fontWeight:600 }}>
                      {(b.high_prob * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BUSINESS HISTORY  */}
      <div className="ra-card" style={{ marginTop: "60px" }}>
        <h3 style={titleStyle}>Business Risk History (All Years)</h3>

        <div className="ra-filterbar" style={{ marginBottom: 20 }}>
          <select
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
            className="ra-select"
          >
            {states.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>

          <div className="ra-search">
            <input
              type="text"
              placeholder="Search business name and press Enter..."
              value={searchBusiness}
              onChange={(e) => setSearchBusiness(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBusinessSearch();
                }
              }}
              className="ra-input"
            />
            <button className="ra-search-button" onClick={handleBusinessSearch}>Search</button>
          </div>
        </div>

        {historyLoading && <div style={{display:'flex',alignItems:'center',gap:12}}><div className="spinner"/> <div>Loading business history...</div></div>}

        {businessHistory.length > 0 &&
          Object.entries(
            businessHistory.reduce((acc, item) => {
              if (!acc[item.gmap_id]) acc[item.gmap_id] = [];
              acc[item.gmap_id].push(item);
              return acc;
            }, {})
          ).map(([gmapId, records], index) => {

            const sortedRecords = records.sort((a, b) => a.year - b.year);
            const mapLink = sortedRecords[0].google_maps_link;

            return (
            <div key={index} className="ra-branch">

              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <strong>Branch ID: {gmapId}</strong>
                <a 
                  href={mapLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{color:'#3498db',textDecoration:'none',fontWeight:500}}
                >
                  Open in Google Maps
                </a>
              </div>

              <table className="ra-table">
                <thead>
                  <tr>
                    <th style={thStyle}>Year</th>
                    <th style={{ ...thStyle, color: "#2ecc71" }}>Low %</th>
                    <th style={{ ...thStyle, color: "#f1c40f" }}>Medium %</th>
                    <th style={{ ...thStyle, color: "#e74c3c" }}>High %</th>
                    <th style={thStyle}>AI Insight</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedRecords.map((item, i) => (
                    <React.Fragment key={i}>

                      {/* MAIN ROW */}
                      <tr>
                        <td style={tdStyle}>{item.year}</td>

                        <td style={{ ...tdStyle, color: "#2ecc71" }}>
                          {(item.low * 100).toFixed(2)}%
                        </td>

                        <td style={{ ...tdStyle, color: "#f1c40f" }}>
                          {(item.medium * 100).toFixed(2)}%
                        </td>

                        <td style={{ ...tdStyle, color: "#e74c3c" }}>
                          {(item.high * 100).toFixed(2)}%
                        </td>

                        <td style={tdStyle}>
                          <button
                            onClick={() => handleExplainYear(item)}
                            className="ra-explain-btn"
                          >
                            {loadingRow === `${item.gmap_id}_${item.year}` ? 'Loading...' : 'Explain'}
                          </button>
                        </td>
                      </tr>

                      {/* LOADING ROW */}
                      {loadingRow === `${item.gmap_id}_${item.year}` && (
                        <tr>
                          <td colSpan="5">
                            <div className="ra-loading">
                              <div className="spinner"/>
                              <div>Generating AI explanation...</div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* EXPLANATION ROW */}
                      {yearExplanations[`${item.gmap_id}_${item.year}`] && (
                        <tr>
                          <td colSpan="5">
                            <div style={{
                              background: "#f8fafc",
                              padding: "12px",
                              borderRadius: "8px",
                              marginTop: "6px",
                              fontSize: "14px",
                              lineHeight: "1.6",
                              border: "1px solid #e2e8f0",
                              whiteSpace: "pre-line"
                            }}>
                              {yearExplanations[`${item.gmap_id}_${item.year}`]}
                            </div>
                          </td>
                        </tr>
                      )}

                    </React.Fragment>
                  ))}
                </tbody>
              </table>

            </div>
          );
          })}

        {hasSearched && !historyLoading && businessHistory.length === 0 && (
          <p>No matching business found.</p>
        )}

      </div>
    </div>
  );
}

/* SHARED STYLES */

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
};

const selectStyle = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid #dcdcdc",
  background: "white",
  fontSize: "14px",
  minWidth: "160px"
};

const inputStyle = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid #dcdcdc",
  fontSize: "14px"
};

const titleStyle = {
  marginBottom: "20px",
  fontWeight: "600"
};

const centerTextStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  textAlign: "center"
};

const thStyle = {
  padding: "10px",
  textAlign: "left"
};

const tdStyle = {
  padding: "10px"
};

export default RiskAssessment;
