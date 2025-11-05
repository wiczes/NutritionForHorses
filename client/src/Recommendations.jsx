import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import RecommendationHeader from "./components/RecommendationHeader";
import RecommendationCard from "./components/RecommendationCard";
import ActionButtons from "./components/ActionButtons";
import FeedsList from "./components/FeedsList";

export default function Recommendations() {
  const location = useLocation();
  const { formData } = location.state || {};
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!formData) return;
    setLoading(true);
    fetch("http://localhost:5001/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) throw new Error("Błąd pobierania rekomendacji");
        return res.json();
      })
      .then(data => {
        console.log('Otrzymane rekomendacje:', data);
        setRecommendations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [formData]);

  if (!formData) {
    return <p className="text-center mt-10">Brak danych. Wypełnij najpierw konfigurator.</p>;
  }
  if (loading) return <p className="text-center mt-10">Ładowanie rekomendacji...</p>;
  if (error) return <p className="text-center mt-10">Błąd: {error}</p>;
  if (!recommendations) return null;

  const options = [
    {
      title: "Największa zgodność",
      ...recommendations.najlepsza
    },
    {
      title: "Alternatywna opcja",
      ...recommendations.alternatywa
    },
    {
      title: "Opcja ekonomiczna",
      ...recommendations.ekonomiczna
    }
  ];

  return (
    <main className="p-6 bg-gradient-to-br from-blue-300 to-white animate-fadeIn">
      <RecommendationHeader formData={formData} />
      <div className="flex flex-col md:flex-row gap-6 justify-center mb-8">
        {options.map((option, idx) => (
          <RecommendationCard
            key={idx}
            title={option.title}
            match={option.score || 0}
            price={`${option.cena || 0} zł (${option.kosztMiesieczny || 0} zł/mies.)`}
            items={(option.items || []).map(item => ({
              name: item.nazwa,
              img: item.zdjecie,
              dose: item.dawkowanie ? `Dawkowanie: ${item.dawkowanie.join(", ")} g` : ""
            }))}
          />
        ))}
      </div>
      <FeedsList />
      <ActionButtons />
    </main>
  );
}