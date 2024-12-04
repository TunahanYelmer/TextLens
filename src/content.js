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

// Function to handle the "scanText" button click
function handleScanTextClick() {
  try {
    chrome.runtime.sendMessage({ action: "screenshot" }, handleScreenshotResponse);
  } catch (error) {
    console.error("Error sending screenshot message:", error);
  }
}

// Function to handle the response from the screenshot action
function handleScreenshotResponse(response) {
  try {
    if (response && response.status === "success") {
      const { startX, startY, endX, endY } = response.coordinates;
      console.log("Screenshot coordinates:", startX, startY, endX, endY);

      updateCanvasCoordsInState({ x1: startX, y1: startY, x2: endX, y2: endY });
      
    } else {
      console.error("Failed to get screenshot coordinates:", response?.message);
    }
  } catch (error) {
    console.error("Error handling screenshot response:", error);
  }
}

// Function to retrieve and update the canvas coordinates in the state
function updateCanvasCoordsInState(canvasCoords) {
  try {
    getCurrentState((currentState) => {
      const updatedState = {
        ...currentState,
        canvasCoords,
      };

      saveState(updatedState, () => {
        console.log("Canvas coordinates updated in state:", updatedState.canvasCoords);
      });
    });
  } catch (error) {
    console.error("Error updating canvas coordinates in state:", error);
  }
}

// Helper function to retrieve the current state
function getCurrentState(callback) {
  try {
    chrome.storage.local.get("state", (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving state:", chrome.runtime.lastError);
        callback({});
        return;
      }
      const currentState = result.state || {}; // Fallback to an empty object if state doesn't exist
      callback(currentState);
    });
  } catch (error) {
    console.error("Error retrieving current state:", error);
    callback({});
  }
}

// Helper function to save the updated state
function saveState(newState, callback) {
  try {
    chrome.storage.local.set({ state: newState }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving state:", chrome.runtime.lastError);
      } else {
        callback();
      }
    });
  } catch (error) {
    console.error("Error saving state:", error);
  }
}
