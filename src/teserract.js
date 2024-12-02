import Tesseract from "tesseract.js";

const getTextFromScreenshots = async (dataUrl) => {
    try {
      const detectedLanguage = await Tesseract.detect(dataUrl);
  
      const result = await Tesseract.recognize(
        dataUrl,
        detectedLanguage,
        { logger: m => console.log(m) } // optional: for logging progress
      );
  
      return result.data.text;
    } catch (error) {
      console.error('Error during OCR:', error);
      return null;
    }
  };

export default getTextFromScreenshots;