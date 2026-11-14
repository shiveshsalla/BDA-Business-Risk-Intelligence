import CountUp from "react-countup";

function RiskCard({ title, value, color }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "14px",
      padding: "24px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      borderLeft: `6px solid ${color}`,
      flex: 1,
      transition: "0.3s"
    }}>
      <h4 style={{
        margin: 0,
        color: "#666",
        fontWeight: 500
      }}>
        {title}
      </h4>

      <h1 style={{
        margin: "15px 0 0",
        fontSize: "36px",
        color,
        fontWeight: "bold"
      }}>
        <CountUp end={value} duration={1.2} separator="," />
      </h1>
    </div>
  );
}

export default RiskCard;
