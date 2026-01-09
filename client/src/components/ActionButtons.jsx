import { useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useState } from "react";

export default function ActionButtons() {
  const navigate = useNavigate();
  const [buttonText, setButtonText] = useState("Zapisz rekomendacje");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleBack = () => {
    navigate("/");
  };

  const waitForImages = async (element) => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(promises);
  };

  const handleSave = async () => {
    const input = document.getElementById("recommendation-content");
    if (!input) {
      alert("Błąd: Nie znaleziono treści do wydruku.");
      return;
    }

    setIsGenerating(true);

    try {
      setButtonText("Ładowanie zasobów...");
      await waitForImages(input);

      const options = {
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
           height: 'auto',
           maxHeight: 'none',
           overflow: 'visible'
        },
        filter: (node) => node.getAttribute?.('data-html2canvas-ignore') !== 'true'
      };
      
      const totalAttempts = 3; 

      for (let i = 1; i <= totalAttempts; i++) {
        setButtonText(`Przetwarzanie grafiki ...`);
        await new Promise(r => setTimeout(r, 500));

        if (i < totalAttempts) {
            await toPng(input, options);
        } else {
            setButtonText("Generowanie PDF...");
            const dataUrl = await toPng(input, options);

            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const img = new Image();
            img.src = dataUrl;
            
            await new Promise((resolve) => { img.onload = resolve; });

            const imgWidth = img.width;
            const imgHeight = img.height;
            const widthRatio = pageWidth / imgWidth;
            const heightRatio = pageHeight / imgHeight;
            const ratio = Math.min(widthRatio, heightRatio);
            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;
            const xOffset = (pageWidth - finalWidth) / 2;

            pdf.addImage(dataUrl, "PNG", xOffset, 0, finalWidth, finalHeight);
            pdf.save("rekomendacje_diety.pdf");
        }
      }

    } catch (err) {
      console.error("Błąd generowania PDF:", err);
      alert("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
      setButtonText("Zapisz rekomendacje");
    }
  };

  return (
    <div 
      className="mt-8 flex justify-center space-x-4" 
      data-html2canvas-ignore="true"
    >
      <button
        className="px-6 py-2 rounded-lg bg-purple-400 text-white hover:bg-purple-500 transition"
        onClick={handleBack}
      >
        Powrót do konfiguratora
      </button>
      <button
        className="px-6 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 transition min-w-[200px]"
        onClick={handleSave}
        disabled={isGenerating}
      >
        {buttonText}
      </button>
    </div>
  );
}