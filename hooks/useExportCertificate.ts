import { useState } from "react";
import html2canvas from "html2canvas";

export function useExportCertificate() {
  const [isExporting, setIsExporting] = useState(false);

  const exportCertificate = async (elementId: string, fileName: string = "certificate") => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found for export:", elementId);
      return;
    }

    setIsExporting(true);
    try {
      // Create canvas from element
      const canvas = await html2canvas(element, {
        scale: 3, // High resolution
        useCORS: true,
        backgroundColor: "#0d0d1f", // Match card-surface
        logging: false,
      });

      // Convert to image
      const image = canvas.toDataURL("image/png", 1.0);
      
      // Trigger download
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = image;
      link.click();
      
      return true;
    } catch (err) {
      console.error("Export failed:", err);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCertificate, isExporting };
}
