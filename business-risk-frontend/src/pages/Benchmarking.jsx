import { useEffect, useState, useMemo } from "react";
import {
  fetchStates,
  fetchYears,
  fetchCompetitiveBenchmark,
  fetchBusinessBenchmarkDetails
} from "../api/dataService";

/*  STYLE INJECTION (MATCH FIRST FILE)  */

const cbStyles = `
:root{--bg:#f4f6f9;--card:#ffffff;--muted:#6b7280;--accent:#2563eb;--radius:16px}
.cb-page{padding:50px;background:var(--bg);min-height:100vh;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto;color:#0f172a}
.cb-title{margin-bottom:20px;font-weight:700;font-size:28px}
.cb-filterbar{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:30px;margin-bottom:50px;background:var(--card);padding:28px;border-radius:16px;box-shadow:0 12px 36px rgba(2,6,23,0.06);align-items:end}
.cb-filter-group{display:flex;flex-direction:column;gap:8px}
.cb-label{font-size:14px;font-weight:600;color:#475569}
.cb-input{padding:12px;border-radius:10px;border:1px solid #e2e8f0;font-size:14px}
.cb-apply{padding:10px 20px;background:linear-gradient(90deg,var(--accent) 0%, #1f6fd6 100%);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:800;box-shadow:0 8px 20px rgba(37,99,235,0.12)}
.cb-section{background:var(--card);padding:35px;border-radius:16px;box-shadow:0 12px 36px rgba(2,6,23,0.06);margin-bottom:40px}
.cb-section-title{margin-bottom:20px;font-size:18px;font-weight:600}
.cb-table{width:100%;border-collapse:collapse}
.cb-table th,.cb-table td{padding:14px;text-align:left;font-size:14px}
.cb-table thead tr{background:#f1f5f9}
.cb-row{border-top:1px solid #e5e7eb}
.cb-table tbody tr:hover{background:#f8fafc}
.cb-pagination{margin-top:25px;display:flex;justify-content:space-between;align-items:center}
.cb-pag-btn{padding:10px 18px;border-radius:8px;border:1px solid #e2e8f0;background:white;font-size:14px;font-weight:500;cursor:pointer}
.cb-search{margin-top:35px}
.cb-kpi-section{margin-top:50px;display:flex;flex-direction:column;gap:30px}
.cb-branch-card{background:white;padding:30px;border-radius:16px;box-shadow:0 12px 36px rgba(2,6,23,0.06)}
.cb-branch-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:25px}
.cb-kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.cb-kpi-card{background:#f8fafc;padding:20px;border-radius:12px}
.cb-loading{padding:10px;font-size:14px;color:#64748b;display:flex;align-items:center;gap:8px}
.spinner{width:28px;height:28px;border-radius:50%;border:4px solid rgba(0,0,0,0.06);border-top-color:var(--accent);animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
`;

function injectStyles(){
  if(!document.getElementById("cb-styles")){
    const s=document.createElement("style");
    s.id="cb-styles";
    s.textContent=cbStyles;
    document.head.appendChild(s);
  }
}

/*  COMPONENT  */

function CompetitiveBenchmarking() {

  useEffect(()=>{injectStyles()},[]);

  const [states,setStates]=useState([]);
  const [years,setYears]=useState([]);
  const [stateName,setStateName]=useState("");
  const [year,setYear]=useState("");
  const [category,setCategory]=useState("");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [searchBusiness,setSearchBusiness]=useState("");
  const [businessDetails,setBusinessDetails]=useState(null);
  const [detailsLoading,setDetailsLoading]=useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [currentPage,setCurrentPage]=useState(1);
  const rowsPerPage=20;

  useEffect(()=>{
    fetchStates().then(res=>{
      const list=res.states||[];
      setStates(list);
      if(list.length>0)setStateName(list[0]);
    });
  },[]);

  useEffect(()=>{
    if(!stateName)return;
    fetchYears(stateName).then(res=>{
      const list=res.years||[];
      setYears(list);
      if(list.length>0)setYear(list[0]);
    });
  },[stateName]);

  const applyFilters=async()=>{
    if(!stateName||!year||!category.trim())return;
    setLoading(true);
    setBusinessDetails(null);
    setSearchBusiness("");
    try{
      const res=await fetchCompetitiveBenchmark(stateName,year,category);
      setData(res);
      setCurrentPage(1);
    }catch(err){setData(null)}
    setLoading(false);
  };

  const paginatedLeaderboard=useMemo(()=>{
    if(!data?.leaderboard)return[];
    return data.leaderboard.slice((currentPage-1)*rowsPerPage,currentPage*rowsPerPage);
  },[data,currentPage]);

  const totalPages=useMemo(()=>{
    return data?.leaderboard?Math.ceil(data.leaderboard.length/rowsPerPage):0;
  },[data]);

  const handleSearch = async (e) => {
  if (e.key !== "Enter") return;
  if (!searchBusiness.trim()) return;

  setSearchAttempted(true);
  setDetailsLoading(true);

  try {
    const res = await fetchBusinessBenchmarkDetails(
      stateName,
      year,
      category,
      searchBusiness.trim()
    );

    if (res && res.branches && res.branches.length > 0) {
      setBusinessDetails(res);
    } else {
      setBusinessDetails(null);
    }

  } catch (err) {
    setBusinessDetails(null);
  }

  setDetailsLoading(false);
};

  return(
    <div className="cb-page">

      <h2 className="cb-title">Competitive Benchmarking</h2>

      {/* FILTER BAR */}
      <div className="cb-filterbar">

        <div className="cb-filter-group">
          <label className="cb-label">State</label>
          <select value={stateName} onChange={e=>setStateName(e.target.value)} className="cb-input">
            {states.map((s,i)=><option key={i} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="cb-filter-group">
          <label className="cb-label">Year</label>
          <select value={year} onChange={e=>setYear(e.target.value)} className="cb-input">
            {years.map((y,i)=><option key={i} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="cb-filter-group">
          <label className="cb-label">Category</label>
          <input
            type="text"
            value={category}
            onChange={e=>setCategory(e.target.value)}
            placeholder="Pizza, Fast Food..."
            className="cb-input"
          />
        </div>

        <button className="cb-apply" onClick={applyFilters}>
          Apply Filters
        </button>

      </div>

      {loading && (
        <div className="cb-loading">
          <div className="spinner"></div>
          Loading Benchmark Data...
        </div>
      )}

      {/* LEADERBOARD */}
      {data && !loading && (
  <div className="cb-section">


    {data.leaderboard && data.leaderboard.length > 0 ? (

      <>
      <h3 className="cb-section-title">Competitor Leaderboard</h3>
        <div style={{maxHeight:"420px",overflowY:"auto"}}>
          <table className="cb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Business</th>
                <th>Risk</th>
                <th>Maps</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaderboard.map((b,i)=>(
                <tr key={i} className="cb-row">
                  <td>{b.rank}</td>
                  <td style={{fontWeight:600}}>{b.name}</td>
                  <td style={{fontWeight:700}}>
                    {(b.risk_score*100).toFixed(0)}
                  </td>
                  <td>
                    <a 
                      href={b.google_maps_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{color:"#2563eb",fontWeight:500}}
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="cb-pagination">
            <button
              className="cb-pag-btn"
              disabled={currentPage===1}
              style={{opacity:currentPage===1?0.5:1}}
              onClick={()=>setCurrentPage(p=>p-1)}
            >
              Previous
            </button>

            <span style={{fontWeight:600}}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="cb-pag-btn"
              disabled={currentPage>=totalPages}
              style={{opacity:currentPage>=totalPages?0.5:1}}
              onClick={()=>setCurrentPage(p=>p+1)}
            >
              Next
            </button>
          </div>
        )}

        {/* SEARCH SHOWN ONLY WHEN DATA EXISTS */}
        <div className="cb-search">
          <label className="cb-label" style={{marginBottom:8,display:"block"}}>
            Search Business (Press Enter)
          </label>
          <input
            type="text"
            value={searchBusiness}
            onChange={e=>setSearchBusiness(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Enter Business Name..."
            className="cb-input"
            style={{width:"100%"}}
          />
        </div>
        {searchAttempted && !detailsLoading && !businessDetails && (
  <div
    style={{
      marginTop: "15px",
      color: "#64748b",
      fontSize: "14px"
    }}
  >
    No business found in the current leaderboard.
  </div>
)}

      </>

    ) : (

      <div
        style={{
          padding:"40px",
          textAlign:"center",
          color:"#64748b",
          fontSize:"15px"
        }}
      >
        No competitors found for the selected State, Year, and Category.
      </div>

    )}

  </div>
)}

      {/* KPI SECTION */}
      {businessDetails?.branches?.length>0 && !detailsLoading && (
        <div className="cb-kpi-section">
          {businessDetails.branches.map((branch,index)=>(
            <div key={index} className="cb-branch-card">

              <div className="cb-branch-header">
                <h4 style={{margin:0}}>
                  {branch.name}
                  <span style={{fontSize:13,color:"#64748b",marginLeft:8}}>
                    (Branch ID: {branch.gmap_id})
                  </span>
                </h4>
                <a href={branch.google_maps_link} target="_blank" rel="noopener noreferrer" style={{color:"#2563eb",fontWeight:500}}>
                  Open in Maps
                </a>
              </div>

              <div className="cb-kpi-grid">
                <div className="cb-kpi-card">
                  <h4>Rank</h4>
                  <h2>#{branch.rank} of {businessDetails.total_competitors}</h2>
                </div>

                <div className="cb-kpi-card">
                  <h4>Risk vs Category</h4>
                  <h2 style={{color:branch.vs_avg_percent>0?"#dc2626":"#16a34a"}}>
                    {branch.vs_avg_percent>0?"+":""}
                    {branch.vs_avg_percent}
                  </h2>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default CompetitiveBenchmarking;