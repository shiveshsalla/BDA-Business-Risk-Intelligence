import { NavLink } from "react-router-dom";

function Layout({ children }) {
  return (
    <div style={container}>

      {/* ===== SIDEBAR ===== */}
      <aside style={sidebar}>

        <div style={logoSection}>
          <h2 style={logo}>Risk AI</h2>
          <span style={logoSub}>Business Intelligence</span>
        </div>

        <nav style={nav}>
          <SidebarLink to="/" label="Dashboard" />
          <SidebarLink to="/risk" label="Risk Assessment" />
          <SidebarLink to="/monitoring" label="Monitoring" />
          <SidebarLink to="/benchmarking" label="Benchmarking" />
          <SidebarLink to="/investment" label="Investment" />
          <SidebarLink to="/complaints" label="Complaints" />
        </nav>

        <div style={footer}>
          <span style={footerText}>© 2026 Risk AI</span>
        </div>

      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={main}>
        {children}
      </main>

    </div>
  );
}

/* ================= SIDEBAR LINK COMPONENT ================= */

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        ...linkBase,
        ...(isActive ? activeLink : {})
      })}
    >
      {label}
    </NavLink>
  );
}

/* ================= STYLES ================= */

const container = {
  display: "flex",
  minHeight: "100vh",
  background: "#f1f5f9"
};

const sidebar = {
  width: "260px",
  background: "linear-gradient(180deg, #0f172a, #1e293b)",
  padding: "35px 25px",
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "sticky",
  top: 0,
  height: "100vh",
  boxShadow: "4px 0 20px rgba(0,0,0,0.15)"
};

const logoSection = {
  marginBottom: "40px"
};

const logo = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "0.5px"
};

const logoSub = {
  fontSize: "12px",
  color: "#94a3b8",
  letterSpacing: "1px"
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const linkBase = {
  padding: "12px 16px",
  borderRadius: "10px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: "500",
  color: "#cbd5e1",
  transition: "all 0.2s ease"
};

const activeLink = {
  background: "rgba(59,130,246,0.15)",
  color: "#ffffff",
  borderLeft: "4px solid #3b82f6",
  paddingLeft: "12px"
};

const footer = {
  marginTop: "40px"
};

const footerText = {
  fontSize: "12px",
  color: "#64748b"
};

const main = {
  flex: 1,
  padding: "50px 60px",
  overflowY: "auto"
};

export default Layout;