
const hasDataBind = document.querySelector('[data-bind]') !== null;
const koIsLoaded =  typeof window.ko !== 'undefined';
chrome.runtime.sendMessage({ hasDataBind });