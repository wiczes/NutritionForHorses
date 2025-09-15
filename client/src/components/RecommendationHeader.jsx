export default function RecommendationHeader({ formData }) {
  return (
    <header className="text-center mb-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">
        Sugerowane pasze i suplementy
      </h1>
      <p className="text-gray-600 mb-4">
        Na podstawie podanych informacji, przygotowaliśmy rekomendacje.
      </p>
      <section className="mx-auto w-full p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-">Podane informacje:</h2>
        <ul className="list-disc list-inside text-gray-700 text-left">
          <li>Wiek: {formData.age} lat</li>
          <li>Waga: {formData.weight} kg</li>
          <li>Alergie: {formData.allergies.length > 0 ? formData.allergies.join(", ") : "Brak"}</li>
          <li>Użytkowanie: {formData.workload}</li>
        <li>Cele żywieniowe: {formData.goals.length > 0 ? formData.goals.join(", ") : "Brak"}</li>
          <li>Pastwisko: {formData.pasture}</li>
        </ul>
      </section>
    </header>
  );
}