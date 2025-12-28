import React from 'react';

const goals = [
  "uspokojenie konia",
  "dodanie energii",
  "budowa masy mięśniowej",
  "utrata tkanki tłuszczowej",
  "nabranie tkanki tłuszczowej",
  "utrzymanie zbilansowanej diety"
];

const conflicts = {
  "uspokojenie konia": "dodanie energii",
  "dodanie energii": "uspokojenie konia",
  "utrata tkanki tłuszczowej": "nabranie tkanki tłuszczowej",
  "nabranie tkanki tłuszczowej": "utrata tkanki tłuszczowej"
};

export default function FeedingGoals({ formData, setFormData }) {
  const handleChange = (goal) => {
    let updatedGoals = [...formData.goals];
    const isCurrentlySelected = updatedGoals.includes(goal);

    if (isCurrentlySelected) {
      updatedGoals = updatedGoals.filter((g) => g !== goal);
    } else {
      const conflictingGoal = conflicts[goal];

      if (conflictingGoal && updatedGoals.includes(conflictingGoal)) {
        updatedGoals = updatedGoals.filter((g) => g !== conflictingGoal);
      }

      updatedGoals.push(goal);
    }

    setFormData({ ...formData, goals: updatedGoals });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Cele żywieniowe</h2>
      <div className="space-y-2">
        {goals.map((goal) => (
          <label key={goal} className="flex items-center space-x-2 cursor-pointer">
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