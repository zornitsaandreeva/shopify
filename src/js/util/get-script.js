export default function getScript(url, callback, callbackError) {
  let head = document.getElementsByTagName('head')[0];
  let done = false;
  let script = document.createElement('script');
  script.src = url;

  // Attach handlers for all browsers
  script.onload = script.onreadystatechange = function () {
    if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
      done = true;
      callback();
    } else {
      callbackError();
    }
  };

  head.appendChild(script);
}
