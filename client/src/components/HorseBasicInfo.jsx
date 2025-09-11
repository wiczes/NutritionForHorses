export default function HorseBasicInfo({ formData, setFormData }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Podstawowe informacje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">Wiek (lata)</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="mt-1 w-full border rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Waga (kg)</label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="mt-1 w-full border rounded-md p-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600">Użytkowanie konia</label>
          <select
            value={formData.workload}
            onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
            className="mt-1 w-full border rounded-md p-2"
          >
            <option>Mały wysiłek (koń na pastwiskach)</option>
            <option>Średni wysiłek (rekreacja, godzina dziennie)</option>
            <option>Duży wysiłek (sezon startowy)</option>
            <option>Klacz źrebna</option>
            <option>Klacz karmiąca</option>
            <option>Źrebię</option>
            <option>Ogier kryjący</option>
          </select>
        </div>
      </div>
    </div>
  );
}
