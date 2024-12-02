// storage.js

const initialState = {
  clickCount: 0,
  active: false,
  canvasCoords: { x1: 0, y1: 0, x2: 0, y2: 0 },
  image: null,
  returnText: "",
  isCopied: false,
  buttonText: "Copy to Clipboard",
};

const getState = (callback) => {
  chrome.storage.local.get("state", (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting state:", chrome.runtime.lastError);
      callback(initialState);
    } else {
      callback(result.state || initialState);
    }
  });
};

const setState = (newState, callback) => {
  chrome.storage.local.set({ state: newState }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error setting state:", chrome.runtime.lastError);
    }
    if (callback) callback();
  });
};

const updateState = (updates, callback) => {
  getState((state) => {
    const newState = { ...state, ...updates };
    setState(newState, callback);
  });
};

const actions = {
  activateScreenCapture: (callback) =>
    updateState(
      {
        active: true,
        clickCount: 0,
        canvasCoords: { x1: 0, y1: 0, x2: 0, y2: 0 },
      },
      callback
    ),
  parseImage: (image, callback) => updateState({ image }, callback),
  deactivateScreenCapture: (callback) =>
    updateState(
      {
        active: false,
        clickCount: 0,
        canvasCoords: { x1: 0, y1: 0, x2: 0, y2: 0 },
      },
      callback
    ),
  cancelScreenCapture: (callback) =>
    updateState(
      { clickCount: 0, canvasCoords: { x1: 0, y1: 0, x2: 0, y2: 0 } },
      callback
    ),
  updateClickCount: (callback) =>
    getState((state) =>
      updateState({ clickCount: state.clickCount + 1 }, callback)
    ),
  updateCanvasCoords: (canvasCoords, callback) => {
    console.log("updateCanvasCoords", canvasCoords);
    updateState({ canvasCoords }, callback);
  },
  returnRecognisedText: (returnText, callback) =>
    updateState({ returnText }, callback),
  setCopied: (isCopied, callback) => updateState({ isCopied }, callback),
  changeButtonText: (buttonText, callback) =>
    updateState({ buttonText }, callback),
  resetReturnText: (callback) => updateState({ returnText: "" }, callback),
};

const myAppState = {
  getState,
  actions,
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateCanvasCoords") {
    const { canvasCoords } = message;

    // Wrap asynchronous operation in a Promise to wait for completion
    updateCanvasCoordinates(canvasCoords, sender.tab.id)
      .then(() => {
        console.log("Canvas coordinates updated successfully:", canvasCoords);
        sendResponse({ message: "Canvas coordinates updated successfully" });
      })
      .catch((error) => {
        console.error("Error updating canvas coordinates:", error);
        sendResponse({ message: "Error updating canvas coordinates" });
      });

    // Indicate that the response will be sent asynchronously
    return true;
  }
});

// Function to update the canvas coordinates and handle script execution
function updateCanvasCoordinates(canvasCoords, tabId) {
  return new Promise((resolve, reject) => {
    // First, update the coordinates in myAppState
    myAppState.actions.updateCanvasCoords(canvasCoords, () => {
      console.log("Canvas coordinates updated in myAppState:", canvasCoords);

      // Now execute the script in the content script
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: updateCanvasInContent,
          args: [canvasCoords], // Pass the updated canvas coordinates
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(
                `Error executing script: ${chrome.runtime.lastError.message}`
              )
            );
            return;
          }
          console.log("Canvas updated in content script.");
          resolve(); // Resolve the Promise when the script executes successfully
        }
      );
    });
  });
}

// Function to update the canvas coordinates in the content script
