
 
document.addEventListener("DOMContentLoaded", () => {
  console.log("Content script active on this page.");

  // Add event listener for the scanText button click
  document.getElementById("scanText").addEventListener("click", handleScanTextClick);

  // Send a message to notify popup is opened
  chrome.runtime.sendMessage({ action: "popupOpened" });

  // Handle popup closed event
  window.addEventListener("blur", () => {
    chrome.runtime.sendMessage({ action: "popupClosed" });
  });
});

// Dynamically load the Tesseract worker script

// Function to handle the "scanText" button click
function handleScanTextClick() {
  try {
    chrome.runtime.sendMessage(
      { action: "screenshot" },
      handleScreenshotResponse
    );
  } catch (error) {
    console.error("Error sending screenshot message:", error);
  }
}

// Function to handle the response from the screenshot action
function handleScreenshotResponse(response) {
  try {
    if (response && response.status === "success") {
      console.log("Coordinates:", response.coordinates);
      const croppedImageUrl = cropImage(
        response.screenshotUrl,
        response.coordinates
      );
      croppedImageUrl.then((url) => {
        chrome.runtime.sendMessage({ action: "performOCR", croppedImageUrl: url });
      });
      
    } else {
      console.error("Failed to get screenshot coordinates:", response?.message);
    }
  } catch (error) {
    console.error("Error handling screenshot response:", error);
  }
}

// Function to crop image based on the selected coordinates
const cropImage = (imageUrl, coordinates) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const { endX, endY, startX, startY } = coordinates;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);

      // Calculate the width and height
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      const croppedImageUrl = canvas.toDataURL();
      console.log("cropped image: " + croppedImageUrl);
      resolve(croppedImageUrl);
    };

    img.onerror = (error) => reject(new Error("Failed to load image: ", error));
  });
};



