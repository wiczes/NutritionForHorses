const options = [
  "1-3 godziny dziennie",
  "pół dnia",
  "cały dzień",
  "koń nie ma dostępu do trawiastego pastwiska"
];

export default function PastureAccess({ formData, setFormData }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Czas dostępu do pastwiska</h2>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2">
            <input
              type="radio"
              name="pasture"
              value={option}
              checked={formData.pasture === option}
              onChange={(e) => setFormData({ ...formData, pasture: e.target.value })}
              className="border-gray-300"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
