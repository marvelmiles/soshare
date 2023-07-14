/**
 * customEvent constructor polyfill
 */

(() => {
  if (typeof CustomEvent !== "function") {
    // const newEvent = document.createEvent("Event");
    // newEvent.initEvent(eventType, event.bubbles, event.cancelable);
    // event.target.dispatchEvent(newEvent);
    function CustomEvent(event, params) {
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined
      };
      var evt = document.createEvent("CustomEvent");
      evt.initEvent(event, params.bubbles, params.cancelable);
      evt.customData = params.detail;
      return evt;
    }

    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
  }
})();
