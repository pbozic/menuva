/*
 * Menuva daily malica widget.
 * <script src="https://YOUR-DOMAIN/widget.js" data-restaurant="your-slug" data-lang="sl" async></script>
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var slug = script.getAttribute("data-restaurant");
  if (!slug) return;
  var lang = script.getAttribute("data-lang") || "";
  var origin = new URL(script.src).origin;

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/" + encodeURIComponent(slug) + (lang ? "?lang=" + encodeURIComponent(lang) : "");
  iframe.title = "Dnevna malica";
  iframe.loading = "lazy";
  iframe.style.cssText = "width:100%;max-width:560px;border:0;border-radius:12px;height:320px;display:block;";
  script.parentNode.insertBefore(iframe, script);

  window.addEventListener("message", function (e) {
    if (e.origin !== origin || !e.data || !e.data.menuva || e.source !== iframe.contentWindow) return;
    iframe.style.height = Math.ceil(e.data.height) + "px";
  });
})();
