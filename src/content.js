// Add event listener when the DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Content script active on this page.");

  // Add event listener for the scanText button click
 
    document.getElementById("scanText").addEventListener("click", () => {
      chrome.runtime.sendMessage({action: "screenshot",}, handleScreenshotResponse);
    });


  // Notify background script that popup is opened
  chrome.runtime.sendMessage({ action: "popupOpened" });

  // Notify background script when popup is closed
  window.addEventListener("blur", () => {
    chrome.runtime.sendMessage({ action: "popupClosed" });
  });
});



// Function to handle the response from the screenshot action
function handleScreenshotResponse(response) {
  try {
    if (response?.status === "success") {
      console.log("Coordinates:", response.coordinates);
      cropImage(response.screenshotUrl, response.coordinates)
        .then((croppedImageUrl) => {
          chrome.runtime.sendMessage({ action: "performOCR", croppedImageUrl });
        })
        .catch((error) => {
          console.error("Error cropping image:", error);
        });
    } else {
      console.error("Failed to get screenshot coordinates:", response?.message);
    }
  } catch (error) {
    console.error("Error handling screenshot response:", error);
  }
}

// Function to crop image based on the selected coordinates
function cropImage(imageUrl, coordinates) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const { startX, startY, endX, endY } = coordinates;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      const croppedImageUrl = canvas.toDataURL();
      console.log("Cropped image URL:", croppedImageUrl);
      resolve(croppedImageUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image."));
  });
}

console.log("Refactored content script is running.");
