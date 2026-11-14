import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RiskAssessment from "./pages/RiskAssessment";
import CustomerMonitoring from "./pages/CustomerMonitoring";
import Benchmarking from "./pages/Benchmarking";
import Investment from "./pages/Investment";
import Complaints from "./pages/Complaints";
import Layout from "./components/Layout";
import BusinessMap from "./pages/BusinessMap";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/risk" element={<RiskAssessment />} />
          <Route path="/monitoring" element={<CustomerMonitoring />} />
          <Route path="/benchmarking" element={<Benchmarking />} />
          <Route path="/investment" element={<Investment />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/business-map" element={<BusinessMap />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
