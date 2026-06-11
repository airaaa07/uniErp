import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Go + React + TypeScript</h1>
      <p>Backend Status: {status}</p>
    </div>
  );
}

export default App;