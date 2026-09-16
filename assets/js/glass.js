/**
 * SENAI/SESI Amapá — Camada "glass": estado sticky do header
 *
 * O header (.mainnav) é transparente no topo da página e só ganha cor quando
 * encosta no topo da viewport. CSS não expõe um estado "sticky ativo", então
 * a detecção é feita aqui e vira a classe `.mainnav.is-stuck` (estilizada em
 * assets/css/glass.css).
 *
 * Par do glass.css: removendo os dois <link>/<script> o site volta ao normal.
 */
(function () {
  "use strict";

  var nav = document.querySelector(".mainnav");
  if (!nav) return;

  function setStuck(stuck) {
    nav.classList.toggle("is-stuck", stuck);
  }

  // Caminho preferido: uma sentinela de 1px imediatamente antes do header.
  // Enquanto ela estiver visível, o header ainda não colou. É mais barato e
  // mais preciso que ler posições a cada scroll — e a sentinela é criada aqui
  // para não ter que mexer no HTML de cada página.
  if (typeof IntersectionObserver === "function" && nav.parentNode) {
    var sentinel = document.createElement("div");
    sentinel.className = "mainnav-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    nav.parentNode.insertBefore(sentinel, nav);

    new IntersectionObserver(function (entries) {
      setStuck(!entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
    return;
  }

  // Fallback: compara o topo do header com o topo da viewport.
  var ticking = false;
  function check() {
    ticking = false;
    setStuck(nav.getBoundingClientRect().top <= 0);
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(check);
  }, { passive: true });
  window.addEventListener("resize", check);
  check();
})();
