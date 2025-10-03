import { useEffect, useState } from "react";

export default function FeedsList() {
  const [feeds, setFeeds] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/api/pasze")
      .then(res => res.json())
      .then(data => setFeeds(data));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Lista pasz z bazy</h2>
      <ul>
        {feeds.map(feed => (
          <li key={feed._id}>
            <strong>{feed.nazwa}</strong> – {feed.typ} – {feed.cena} zł
          </li>
        ))}
      </ul>
    </div>
  );
}