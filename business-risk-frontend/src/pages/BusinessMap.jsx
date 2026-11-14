import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { getBusinessMap } from "../api/dataService";

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function BusinessMap() {
  const [stateInput, setStateInput] = useState("");
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [center, setCenter] = useState([39.5, -98.35]);
  const [zoom, setZoom] = useState(4);

  const handleSearch = async () => {
    if (!stateInput) return;

    setLoading(true);

    const data = await getBusinessMap(stateInput, 10000);

    setPoints(data.points);

    if (data.points.length > 0) {
      setCenter([data.points[0].latitude, data.points[0].longitude]);
      setZoom(6);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>US Business Map</h2>

      <input
        type="text"
        placeholder="Enter state name (e.g. Texas)"
        value={stateInput}
        onChange={(e) => setStateInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
        style={{ padding: "8px", width: "250px", marginRight: "10px" }}
      />

      <button onClick={handleSearch} style={{ padding: "8px 15px" }}>
        Search
      </button>

      {loading && <p>Loading state data...</p>}

      <div style={{ height: "600px", marginTop: "20px" }}>
        <MapContainer center={center} zoom={zoom} style={{ height: "100%" }}>
          <ChangeView center={center} zoom={zoom} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup>
            {points.map((point, index) => (
              <CircleMarker
                key={index}
                center={[point.latitude, point.longitude]}
                radius={5}
                pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.8 }}
              >
                <Popup>
                  <div>
                    <strong>{point.name}</strong><br />
                    <b>Category:</b>{" "}
                    {Array.isArray(point.category)
                      ? point.category.join(", ")
                      : point.category}
                    <br />
                    <b>Total Reviews:</b> {point.num_of_reviews}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MarkerClusterGroup>

        </MapContainer>
      </div>
    </div>
  );
}