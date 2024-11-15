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

export const myAppState = {
  getState,
  actions,
};
