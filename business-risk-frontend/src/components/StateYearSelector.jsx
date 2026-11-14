import { useState } from "react";

function StateYearSelector({ onChange }) {
  const [state, setState] = useState("California");
  const [year, setYear] = useState("2022");

  const handleChange = (newState, newYear) => {
    setState(newState);
    setYear(newYear);
    onChange(newState, newYear);
  };

  return (
    <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
      <select
        value={state}
        onChange={(e) => handleChange(e.target.value, year)}
      >
        <option>California</option>
        <option>Texas</option>
        <option>New_York</option>
      </select>

      <select
        value={year}
        onChange={(e) => handleChange(state, e.target.value)}
      >
        <option>2021</option>
        <option>2022</option>
        <option>2023</option>
      </select>
    </div>
  );
}

export default StateYearSelector;
