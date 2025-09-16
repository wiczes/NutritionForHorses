import { useLocation } from "react-router-dom";
import RecommendationHeader from "./components/RecommendationHeader";
import RecommendationCard from "./components/RecommendationCard";
import ActionButtons from "./components/ActionButtons";

const sampleOptions = [
  {
    title: "Największa zgodność",
    match: 97,
    price: "980 zł/miesiąc",
    items: [
      { name: "Granulat", img: "granulat.jpg", desc: "Pełnoporcjowy granulat dla koni sportowych.", dose: "Dawkowanie: 1 kg dziennie" },
      { name: "Musli", img: "musli.png", desc: "Musli z dodatkiem ziół i oleju lnianego.", dose: "Dawkowanie: 2 kg dziennie" },
      { name: "Witaminy", img: "witaminy.jpg", desc: "Kompleks witaminowy dla wsparcia odporności.", dose: "Dawkowanie: 1 miarka = 15 g" },
      { name: "Elektrolity", img: "elektrolity.jpg", desc: "Suplement elektrolitowy na lato.", dose: "Dawkowanie: 1 miarka = 10 g" }
    ]
  },
  {
    title: "Alternatywna opcja",
    match: 89,
    price: "600 zł/miesiąc",
    items: [
      { name: "Musli", img: "musli.png", desc: "Musli z dodatkiem ziół i oleju lnianego.", dose: "Dawkowanie: 2,5 kg dziennie" },
      { name: "Sieczka", img: "sieczka.jpg", desc: "Sieczka z lucerny dla lepszego trawienia.", dose: "Dawkowanie: 2 kg dziennie" },
      { name: "Elektrolity", img: "elektrolity.jpg", desc: "Suplement elektrolitowy na lato.", dose: "Dawkowanie: 1 miarka = 10 g" }
    ]
  },
  {
    title: "Opcja ekonomiczna",
    match: 75,
    price: "220 zł/miesiąc",
    items: [
      { name: "Owies", img: "owies.png", desc: "Owies płatkowany.", dose: "Dawkowanie: 2 kg dziennie" },
      { name: "Sieczka", img: "sieczka.jpg", desc: "Sieczka z lucerny.", dose: "Dawkowanie: 2 kg dziennie" },
      { name: "Witaminy", img: "witaminy.jpg", desc: "Podstawowy kompleks witaminowy. Dawkowanie: 1 miarka dziennie.", dose: "Dawkowanie: 1 miarka = 15 g" }
    ]
  }
];

export default function Recommendations() {
  const location = useLocation();
  const { formData } = location.state || {};

  if (!formData) {
    return <p className="text-center mt-10">Brak danych. Wypełnij najpierw konfigurator.</p>;
  }

  return (
    <main className="p-6 bg-gradient-to-br from-blue-300 to-white animate-fadeIn">
      <RecommendationHeader formData={formData} />
      <div className="flex flex-col md:flex-row gap-6 justify-center mb-8">
        {sampleOptions.map((option, idx) => (
          <RecommendationCard key={idx} {...option} />
        ))}
      </div>
      <ActionButtons />
    </main>
  );
}