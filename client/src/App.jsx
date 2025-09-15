import { useState } from "react";
import FormHeader from "./components/FormHeader";
import HorseBasicInfo from "./components/HorseBasicInfo";
import Allergies from "./components/Allergies";
import FeedingGoals from "./components/FeedingGoals";
import PastureAccess from "./components/PastureAccess";
import SubmitButton from "./components/SubmitButton";

function App() {
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    workload: "",
    allergies: [],
    goals: [],
    pasture: ""
  });

  return (
    <div className="p-6 flex items-center justify-center bg-gradient-to-br from-blue-300 to-white animate-fadeIn">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        <FormHeader />
        <HorseBasicInfo formData={formData} setFormData={setFormData} />
        <Allergies formData={formData} setFormData={setFormData} />
        <FeedingGoals formData={formData} setFormData={setFormData} />
        <PastureAccess formData={formData} setFormData={setFormData} />
        <SubmitButton formData={formData} />
      </div>
    </div>
  );
}

export default App;
