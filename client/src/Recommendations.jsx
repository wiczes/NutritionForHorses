import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import RecommendationHeader from "./components/RecommendationHeader";
import RecommendationCard from "./components/RecommendationCard";
import ActionButtons from "./components/ActionButtons";
// import FeedsList from "./components/FeedsList";

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

  const renderContent = () => {
    if (loading) {
      return <div className="text-center text-xl font-semibold text-indigo-900">Ładowanie rekomendacji...</div>;
    }
    if (error) {
      return <div className="text-center text-xl font-semibold text-red-600">Błąd: {error}</div>;
    }
    if (!recommendations) {
      return <div className="text-center text-xl font-semibold text-gray-600">Brak danych do wyświetlenia.</div>;
    }

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
    <main className="w-full max-w-7xl bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-10 border border-white/50">
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
              dose: item.dawkowanie ? `Dawkowanie: ${item.dawkowanie.join(" - ")} g dziennie` : ""
            }))}
          />
        ))}
      </div>
      {/* <FeedsList /> */}
      <ActionButtons />
    </main>
  );
  };
    return (
    <main className="min-h-screen p-4 md:p-12 flex items-center justify-center animated-gradient">
      {renderContent()}
    </main>
  );
}