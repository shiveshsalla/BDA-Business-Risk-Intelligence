import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div style={pageContainer}>

      {/*  Hero Section  */}
      <div style={heroSection}>
        <h1 style={heroTitle}>
          Business Risk Intelligence Dashboard
        </h1>
        <p style={heroSubtitle}>
          Advanced analytics platform for risk evaluation, monitoring,
          benchmarking and complaint severity intelligence.
        </p>
      </div>

      {/*  Cards Section  */}
      <div style={cardGrid}>

        <DashboardCard
          title="Business Risk Assessment"
          description="Evaluate risk score, probability and business health indicators."
          link="/risk"
        />

        <DashboardCard
          title="Customer Experience Monitoring"
          description="Track rating trends and customer sentiment over time."
          link="/monitoring"
        />

        <DashboardCard
          title="Competitive Benchmarking"
          description="Compare business performance within category competitors."
          link="/benchmarking"
        />

        <DashboardCard
          title="Investment Decision Support"
          description="Analyze investment feasibility based on risk metrics."
          link="/investment"
        />

        <DashboardCard
          title="Complaint Severity Detection"
          description="Identify businesses with high negative complaint intensity."
          link="/complaints"
        />

      </div>
    </div>
  );
}

/*  CARD COMPONENT  */

function DashboardCard({ title, description, link }) {
  return (
    <Link to={link} style={cardLink}>
      <div style={cardStyle}>
        <h3 style={cardTitle}>{title}</h3>
        <p style={cardDescription}>{description}</p>
        <span style={cardAction}>Explore →</span>
      </div>
    </Link>
  );
}

/*  STYLES  */

const pageContainer = {
  padding: "60px 80px",
  background: "#f8fafc",
  minHeight: "100vh"
};

const heroSection = {
  marginBottom: "60px"
};

const heroTitle = {
  fontSize: "36px",
  fontWeight: "700",
  marginBottom: "15px",
  color: "#1e293b"
};

const heroSubtitle = {
  fontSize: "18px",
  color: "#64748b",
  maxWidth: "700px",
  lineHeight: "1.6"
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "30px"
};

const cardLink = {
  textDecoration: "none"
};

const cardStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  transition: "all 0.25s ease",
  cursor: "pointer"
};

const cardTitle = {
  margin: "0 0 12px 0",
  fontSize: "20px",
  fontWeight: "600",
  color: "#0f172a"
};

const cardDescription = {
  margin: 0,
  fontSize: "14px",
  color: "#64748b",
  lineHeight: "1.6"
};

const cardAction = {
  display: "inline-block",
  marginTop: "20px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#2563eb"
};

export default Dashboard;