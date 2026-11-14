import { useEffect, useState } from "react";
import {
  fetchStates,
  fetchYears,
  fetchCustomerMetrics,
  fetchCustomerTrend,
  fetchBusinessCustomerHistory
} from "../api/dataService";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const cmStyles = `
:root{
  --bg:#f4f6f9;
  --card:#ffffff;
  --muted:#888ea3;
  --accent:#3498db;
  --radius:12px;
}
.cm-page{
  padding:40px;
  background:var(--bg);
  min-height:100vh;
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  color:#111827;
}
.cm-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:16px;
  margin-bottom:20px;
}
.cm-title{
  font-size:20px;
  font-weight:700;
}
.cm-filterbar{
  display:flex;
  gap:16px;
  margin-bottom:30px;
  align-items:center;
  flex-wrap:wrap;
}
.cm-select{
  padding:10px 14px;
  border-radius:10px;
  border:1px solid #e6e9ef;
  background:var(--card);
  font-size:14px;
  min-width:160px;
  cursor:pointer;
  transition:all 0.2s ease;
}
.cm-select:hover{
  border-color:#3498db;
  box-shadow:0 2px 8px rgba(52,152,219,0.1);
}
.cm-input{
  flex:1;
  padding:10px 14px;
  border-radius:10px;
  border:1px solid #e6e9ef;
  font-size:14px;
  background:var(--card);
  transition:all 0.2s ease;
}
.cm-input:focus{
  outline:none;
  border-color:var(--accent);
  box-shadow:0 0 0 3px rgba(52,152,219,0.1);
}
.cm-search{
  display:flex;
  gap:8px;
  align-items:center;
  flex:1;
}

.cm-search-button{
  padding:10px 16px;
  border-radius:10px;
  border:none;
  background:var(--accent);
  color:white;
  cursor:pointer;
  font-weight:600;
  transition:all 0.2s ease;
}

.cm-search-button:hover{
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(43,108,176,0.22);
}
.cm-search-button:active{
  transform: translateY(0);
}
.cm-search-button:focus{
  outline: none;
  box-shadow: 0 0 0 4px rgba(52,152,219,0.12);
}
.cm-kpis{
  display:flex;
  gap:20px;
  margin-bottom:40px;
  flex-wrap:wrap;
}
.cm-metric-card{
  flex:1;
  min-width:200px;
  background:var(--card);
  padding:24px;
  border-radius:var(--radius);
  box-shadow:0 8px 24px rgba(16,24,40,0.06);
  transition:all 0.3s ease;
}
.cm-metric-card:hover{
  transform:translateY(-4px);
  box-shadow:0 12px 32px rgba(16,24,40,0.12);
}
.cm-metric-label{
  margin-bottom:12px;
  color:var(--muted);
  font-size:13px;
  font-weight:600;
  text-transform:uppercase;
  letter-spacing:0.5px;
}
.cm-metric-value{
  font-size:32px;
  font-weight:700;
  margin:0;
  color:#111827;
}
.cm-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:30px;
  margin-bottom:40px;
}
.cm-card{
  background:var(--card);
  padding:24px;
  border-radius:var(--radius);
  box-shadow:0 8px 24px rgba(16,24,40,0.06);
}
.cm-card-title{
  font-size:16px;
  font-weight:700;
  margin-bottom:20px;
  color:#111827;
}
.cm-table{
  width:100%;
  border-collapse:collapse;
  background:#fbfdff;
  border-radius:8px;
  overflow:hidden;
}
.cm-table thead tr{background:#f7f9fc}
.cm-table th,.cm-table td{padding:12px 10px;text-align:left}
.cm-table tbody tr{border-top:1px solid #f1f5f9}
.cm-table tbody tr:hover{background:#f0f7ff}
.cm-branch-section{
  margin-bottom:40px;
}
.cm-branch-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:16px;
}
.cm-branch-title{
  font-size:15px;
  font-weight:700;
  margin:0;
  color:#111827;
}
.cm-branch-link{
  color:var(--accent);
  text-decoration:none;
  font-weight:600;
  transition:all 0.2s ease;
}
.cm-branch-link:hover{
  color:#2980b9;
  text-decoration:underline;
}
.cm-loading{
  padding:20px;
  font-size:14px;
  color:var(--muted);
  display:flex;
  align-items:center;
  gap:8px;
}
.cm-spinner{
  width:30px;
  height:30px;
  border-radius:50%;
  border:4px solid rgba(0,0,0,0.06);
  border-top-color:var(--accent);
  animation:spin 1s linear infinite;
}
.cm-empty{
  padding:20px;
  color:var(--muted);
  text-align:center;
}
@keyframes spin{to{transform:rotate(360deg)}}
@media (max-width:1024px){
  .cm-grid{grid-template-columns:1fr}
  .cm-kpis{flex-direction:column}
}
`;

function injectStyles() {
  if (!document.getElementById('cm-styles')) {
    const style = document.createElement('style');
    style.id = 'cm-styles';
    style.textContent = cmStyles;
    document.head.appendChild(style);
  }
}

function CustomerMonitoring() {

  const [states, setStates] = useState([]);
  const [years, setYears] = useState([]);

  const [stateName, setStateName] = useState("");
  const [year, setYear] = useState("");

  const [metrics, setMetrics] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bottom Section 
  const [searchState, setSearchState] = useState("");
  const [searchBusiness, setSearchBusiness] = useState("");
  const [businessHistory, setBusinessHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);

  // INJECT STYLES ON MOUNT
  useEffect(() => {
    injectStyles();
  }, []);

  // LOAD STATES 
  useEffect(() => {
    let active = true;

    const loadStates = async () => {
      const res = await fetchStates();
      if (!active) return;

      setStates(res.states || []);
      if (res.states?.length > 0) {
        setStateName(res.states[0]);
        setSearchState(res.states[0]);
      }
    };

    loadStates();
    return () => { active = false; };
  }, []);

  // LOAD YEARS + TREND 
  useEffect(() => {
    if (!stateName) return;

    let active = true;

    const loadData = async () => {
      setLoading(true);
      setMetrics(null);

      const yearsRes = await fetchYears(stateName);
      if (!active) return;

      const firstYear = yearsRes.years?.[0] || "";
      setYears(yearsRes.years || []);
      setYear(firstYear);

      const trendRes = await fetchCustomerTrend(stateName);
      if (!active) return;

      setTrend(trendRes.trend || []);
    };

    loadData();
    return () => { active = false; };
  }, [stateName]);

  // LOAD METRICS
  useEffect(() => {
    if (!stateName || !year) return;

    let active = true;

    const loadMetrics = async () => {
      try {
        setLoading(true);
        const metricsRes = await fetchCustomerMetrics(stateName, year);
        if (!active) return;
        setMetrics(metricsRes);
      } catch {
        if (active) setMetrics(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMetrics();
    return () => { active = false; };
  }, [stateName, year]);

  // ENTER KEY SEARCH
  const handleSearchKeyDown = async (e) => {
    if (e.key === "Enter") {
      await handleSearchClick();
    }
  };

  // SEARCH BUTTON CLICK 
  const handleSearchClick = async () => {
    if (!searchBusiness.trim()) return;

    setSearchTriggered(true);
    setHistoryLoading(true);

    try {
      const res = await fetchBusinessCustomerHistory(searchState, searchBusiness);
      setBusinessHistory(res.history || []);
    } catch {
      setBusinessHistory([]);
    }

    setHistoryLoading(false);
  };

  if (loading || !metrics)
    return (
      <div className="cm-page">
        <div className="cm-card" style={{textAlign:'center'}}>
          <div className="cm-spinner" style={{margin:'8px auto'}} />
          <div style={{marginTop:8}}>Loading Customer Monitoring...</div>
        </div>
      </div>
    );

  return (
    <div className="cm-page">

      <div className="cm-header">
        <div>
          <div className="cm-title">Customer Monitoring Dashboard</div>
          <div style={{ color: '#6b7280', fontSize:13 }}>Ratings, sentiment analysis, and customer history</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="cm-filterbar">
        <select value={stateName} onChange={e => setStateName(e.target.value)} className="cm-select">
          {states.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>

        <select value={year} onChange={e => setYear(e.target.value)} className="cm-select">
          {years.map((y, i) => (
            <option key={i} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* KPI CARDS */}
      <div className="cm-kpis">
        <MetricCard title="Avg Rating" value={metrics.avg_rating.toFixed(2)} />
        <MetricCard title="Avg Sentiment" value={metrics.avg_sentiment.toFixed(3)} />
        <MetricCard title="Negative Review %" value={(metrics.negative_ratio * 100).toFixed(2) + "%"} />
        <MetricCard title="Rating-Sentiment Gap" value={metrics.gap.toFixed(2)} />
      </div>

      {/* TREND CHARTS  */}
      <div className="cm-grid">

        <div className="cm-card">
          <h3 className="cm-card-title">Rating vs Sentiment Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avg_rating" stroke="#2563eb" strokeWidth={3} />
              <Line type="monotone" dataKey="avg_sentiment" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="cm-card">
          <h3 className="cm-card-title">Negative Review Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="negative_ratio" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/*  BOTTOM BUSINESS SECTION  */}
      <div className="cm-card">
        <h3 className="cm-card-title">Business Customer History (All Years)</h3>

        <div className="cm-filterbar" style={{ marginBottom: 20 }}>
          <select
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
            className="cm-select"
          >
            {states.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>

          <div className="cm-search">
            <input
              type="text"
              placeholder="Search business name and press Enter..."
              value={searchBusiness}
              onChange={(e) => setSearchBusiness(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="cm-input"
            />
            <button className="cm-search-button" onClick={handleSearchClick}>Search</button>
          </div>
        </div>

        {historyLoading && <div className="cm-loading"><div className="cm-spinner"/> <div>Loading business history...</div></div>}

        {searchTriggered && businessHistory.length > 0 &&
          Object.entries(
            businessHistory.reduce((acc, item) => {
              if (!acc[item.gmap_id]) acc[item.gmap_id] = [];
              acc[item.gmap_id].push(item);
              return acc;
            }, {})
          ).map(([gmapId, records], index) => {

            const sortedRecords = [...records].sort((a, b) => a.year - b.year);
            const mapLink = sortedRecords[0].google_maps_link;

            return (
              <div key={index} className="cm-branch-section">

                <div className="cm-branch-header">
                  <h4 className="cm-branch-title">Branch ID: {gmapId}</h4>
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cm-branch-link"
                  >
                    Open in Google Maps
                  </a>
                </div>

                <table className="cm-table" style={{ marginBottom: "30px" }}>
                  <thead>
                    <tr>
                      <th style={{padding:'12px 10px',textAlign:'left'}}>Year</th>
                      <th style={{padding:'12px 10px',textAlign:'left'}}>Avg Rating</th>
                      <th style={{padding:'12px 10px',textAlign:'left'}}>Avg Sentiment</th>
                      <th style={{padding:'12px 10px',textAlign:'left'}}>Negative %</th>
                      <th style={{padding:'12px 10px',textAlign:'left'}}>Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((item, i) => (
                      <tr key={i}>
                        <td style={{padding:'12px 10px'}}>{item.year}</td>
                        <td style={{padding:'12px 10px'}}>{item.avg_rating.toFixed(2)}</td>
                        <td style={{padding:'12px 10px'}}>{item.avg_sentiment.toFixed(3)}</td>
                        <td style={{padding:'12px 10px'}}>
                          {(item.negative_ratio * 100).toFixed(2)}%
                        </td>
                        <td style={{padding:'12px 10px'}}>{item.gap.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={sortedRecords}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="yearly_negative_trend"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

              </div>
            );
          })}

        {searchTriggered && !historyLoading && businessHistory.length === 0 && (
          <div className="cm-empty">No matching business found.</div>
        )}
      </div>
    </div>
  );
}

/*  STYLES  */

function MetricCard({ title, value }) {
  return (
    <div className="cm-metric-card">
      <h4 className="cm-metric-label">{title}</h4>
      <h2 className="cm-metric-value">{value}</h2>
    </div>
  );
}

export default CustomerMonitoring;
