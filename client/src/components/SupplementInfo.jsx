const categories = {
  "Zdrowie wewnętrzne": ["słaba wątroba", "słabe stawy i ścięgna", "wzmocnienie zdrowych ścięgien", "regeneracja mięśni", "słaba odporność", "problemy oddechowe"],
  "Brzuch": ["słabe jelita", "wrzody", "słaby żołądek", "odpiaszczanie"],
  "Zdrowie zewnętrzne": ["słabe kopyta", "słaby stan sierści"],
  "Psychika": ["koń nerwowy", "klacz nerwowa (w rui)", "wzmożony strach lub stres"]
};

export default function Supplements({ formData, setFormData }) {
  const handleChange = (item) => {
    const updated = formData.supplements.includes(item)
      ? formData.supplements.filter((a) => a !== item)
      : [...formData.supplements, item];

    setFormData({ ...formData, supplements: updated });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Suplementacja</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-medium text-gray-600 mb-2">{category}</h3>
            <div className="space-y-1">
              {items.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.supplements.includes(item)}
                    onChange={() => handleChange(item)}
                    className="rounded border-gray-300"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}