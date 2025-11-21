import { useState } from "react";
import FormHeader from "./components/FormHeader";
import HorseBasicInfo from "./components/HorseBasicInfo";
import Allergies from "./components/Allergies";
import FeedingGoals from "./components/FeedingGoals";
import PastureAccess from "./components/PastureAccess";
import SubmitButton from "./components/SubmitButton";
import Supplements from "./components/SupplementInfo";
import BackgroundHorses from "./components/BackgroundHorses"; 

function App() {
  const [formData, setFormData] = useState({
    age: "10",
    weight: "500",
    workload: "",
    allergies: [],
    supplements: [],
    goals: [],
    pasture: ""
  });

  const getAnimationProps = (delay) => ({
    className: "animate-fadeIn",
    style: { animationFillMode: 'backwards', animationDelay: `${delay}ms` }
  });

  return (
    <div className="min-h-screen p-4 md:p-12 flex items-center justify-center animated-gradient relative overflow-hidden">
      
      <BackgroundHorses />

      <div className="w-full max-w-3xl bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-10 border border-white/50 z-10 relative">
        <div {...getAnimationProps(0)}>
          <FormHeader />
        </div>
        <div {...getAnimationProps(100)}>
          <HorseBasicInfo formData={formData} setFormData={setFormData} />
        </div>
        <div {...getAnimationProps(200)}>
          <Allergies formData={formData} setFormData={setFormData} />
        </div>
        <div {...getAnimationProps(300)}>
          <Supplements formData={formData} setFormData={setFormData} />
        </div>
        <div {...getAnimationProps(400)}>
          <FeedingGoals formData={formData} setFormData={setFormData} />
        </div>
        <div {...getAnimationProps(500)}>
          <PastureAccess formData={formData} setFormData={setFormData} />
        </div>
        <div {...getAnimationProps(600)}>
          <SubmitButton formData={formData} />
        </div>
      </div>
    </div>
  );
}

export default App;