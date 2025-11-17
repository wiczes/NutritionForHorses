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
        className="px-6 py-2 rounded-lg bg-purple-400 text-white hover:bg-purple-500 transition"
        onClick={handleBack}
      >
        Powrót do konfiguratora
      </button>
      <button
        className="px-6 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 transition"
        onClick={handleSave}
      >
        Zapisz rekomendacje
      </button>
    </div>
  );
}