const workloadOptions = [
  "Mały wysiłek (koń na pastwiskach)",
  "Średni wysiłek (rekreacja, godzina dziennie)",
  "Duży wysiłek (sezon startowy)",
  "Klacz źrebna",
  "Klacz karmiąca",
  "Źrebię",
  "Emeryt",
  "Ogier kryjący"
];

export default function HorseBasicInfo({ formData, setFormData }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Podstawowe informacje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Wiek (lata): <span className="font-bold">{formData.age || 1}</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={formData.age || 1}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Waga (kg): <span className="font-bold">{formData.weight || 50}</span>
          </label>
          <input
            type="range"
            min={50}
            max={1500}
            value={formData.weight || 50}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="w-full"
          />
        </div>
      </div>
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Użytkowanie konia</h3>
        <div className="space-y-2">
          {workloadOptions.map((option) => (
            <label key={option} className="flex items-center space-x-2">
              <input
                type="radio"
                name="workload"
                value={option}
                checked={formData.workload === option}
                onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
                className="border-gray-300"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}