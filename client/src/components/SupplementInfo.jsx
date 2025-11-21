const categories = {
  "Zdrowie wewnętrzne": ["wzmocnienie wątroby", "słabe lub kontuzjowane ścięgna i stawy", "wzmocnienie zdrowych ścięgien i stawów", "regeneracja mięśni", "wzmocnienie odporności", "problemy oddechowe"],
  "Brzuch": ["wzmocnienie jelit", "wrzody żołądka", "wzmocnienie żołądka", "kwasowość żołądka", "odpiaszczanie"],
  "Zdrowie zewnętrzne": ["wzmocnienie kopyt", "brak połysku sierści", "wzmocnienie zębów", "odstraszenie owadów"],
  "Psychika": ["koń nerwowy", "klacz nerwowa podczas rui", "wzmożony strach lub stres"]
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
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Jakich dodatków żywieniowych poszukujesz?</h2>
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