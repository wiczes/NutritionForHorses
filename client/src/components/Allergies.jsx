const categories = {
  "Zboża": ["pszenica", "jęczmień", "owies", "żyto", "kukurydza"],
  "Składniki pasz": ["otręby", "wysłodki buraczane", "melasa", "karob"],
  "Rośliny bobowate": ["lucerna", "koniczyna"],
  "Inne rośliny": ["gryka", "cykoria", "burak cukrowy"],
  "Suplementy": ["białka w suplementach"]
};

export default function Allergies({ formData, setFormData }) {
  const handleChange = (item) => {
    const updated = formData.allergies.includes(item)
      ? formData.allergies.filter((a) => a !== item)
      : [...formData.allergies, item];

    setFormData({ ...formData, allergies: updated });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Alergie / nietolerancje</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-medium text-gray-600 mb-2">{category}</h3>
            <div className="space-y-1">
              {items.map((item) => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.allergies.includes(item)}
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
