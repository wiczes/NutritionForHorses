import { useNavigate } from "react-router-dom";

export default function ActionButtons() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  const handleSave = () => {
    window.print();
  };

  return (
    <div className="mt-8 flex justify-center space-x-4">
      <button
        className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        onClick={handleBack}
      >
        Powrót do konfiguratora
      </button>
      <button
        className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
        onClick={handleSave}
      >
        Zapisz rekomendacje
      </button>
    </div>
  );
}