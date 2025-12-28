import { useNavigate } from "react-router-dom";

export default function SubmitButton({ formData }) {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const { workload} = formData;

    if (!workload) {
      alert("Proszę uzupełnić wszystkie wymagane pola: użytkowanie");
      return;
    }

    navigate("/recommendations", { state: { formData } });
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleSubmit}
        className="w-full py-3 px-4 rounded-xl bg-purple-400 text-white font-semibold text-lg shadow hover:bg-purple-500 transition transform hover:scale-[1.02]"
      >
        Wyślij
      </button>
    </div>
  );
}