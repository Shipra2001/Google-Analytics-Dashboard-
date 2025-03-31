import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5002/analytics/data", { withCredentials: true })
      .then((response) => {
        const formattedData = response.data.rows.map((row) => ({
          date: row.dimensionValues[0].value,
          users: parseInt(row.metricValues[0].value),
          pageViews: parseInt(row.metricValues[1].value),
        }));
        setData(formattedData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div>
      <h1>Google Analytics Dashboard</h1>
      <LineChart width={600} height={300} data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid stroke="#ccc" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="users" stroke="#8884d8" />
        <Line type="monotone" dataKey="pageViews" stroke="#82ca9d" />
      </LineChart>
    </div>
  );
}

export default Dashboard;
