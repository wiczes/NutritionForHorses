export default function SubmitButton() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Formularz wysłany!");
  };

  return (
    <div className="text-center">
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition"
      >
        Wyślij formularz
      </button>
    </div>
  );
}
