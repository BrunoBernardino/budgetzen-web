(() => {
  function initializeApp() {
    window.app = window.app || {};
    initializeLoading();

    // TODO: Uncomment this when supporting offline mode
    // if (navigator && navigator.serviceWorker) {
    //   navigator.serviceWorker.register('/public/js/sw.js');
    // }

    document.dispatchEvent(new Event('app-loaded'));

    window.app.hideLoading();
  }

  function initializeLoading() {
    const loadingComponent = document.getElementById('loading');

    window.app.showLoading = () => loadingComponent.classList.remove('hide');
    window.app.hideLoading = () => loadingComponent.classList.add('hide');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
})();
