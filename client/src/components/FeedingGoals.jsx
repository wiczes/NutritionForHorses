const goals = [
  "uspokojenie konia",
  "dodanie energii",
  "budowa masy mięśniowej",
  "utrata tkanki tłuszczowej",
  "nabranie tkanki tłuszczowej",
  "utrzymanie zbilansowanej diety"
];

export default function FeedingGoals({ formData, setFormData }) {
  const handleChange = (goal) => {
    const updated = formData.goals.includes(goal)
      ? formData.goals.filter((g) => g !== goal)
      : [...formData.goals, goal];

    setFormData({ ...formData, goals: updated });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Cele żywieniowe</h2>
      <div className="space-y-2">
        {goals.map((goal) => (
          <label key={goal} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.goals.includes(goal)}
              onChange={() => handleChange(goal)}
              className="rounded border-gray-300"
            />
            <span>{goal}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
