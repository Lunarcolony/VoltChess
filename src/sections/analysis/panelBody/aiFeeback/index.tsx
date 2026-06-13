import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/config/apiUrl";

export default function Hello() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    console.log("useEffect started");

    fetch(`${getApiBaseUrl()}/api/hello/`)
      .then((res) => {
        console.log("response status:", res.status);
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data) => {
        console.log("received data:", data);
        setMessage(data.message);
      })
      .catch((error) => {
        console.error("Error fetching hello message:", error);
        setMessage("Error loading message");
      });
  }, []);

  return (
    <div>
      <h1>Backend Says:</h1>
      <p>{message}</p>
    </div>
  );
}
