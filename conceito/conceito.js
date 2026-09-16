/**
 * Conceito — comportamento mínimo
 *
 * Três coisas, e nada além disso enquanto o conceito não tiver conteúdo:
 * o menu do navbar troca a cor do degradê do palco, o menu de acessibilidade
 * abre e fecha, e o topbar recolhe no celular.
 *
 * A cor não é escolhida aqui: o clique só escreve o número do menu em
 * <body data-menu="N"> e o conceito.css diz o que aquele número significa.
 */
(function () {
  "use strict";

  /* --------------------------------------------------------------------
     Navbar — o menu ativo define o degradê
     -------------------------------------------------------------------- */
  var menu = document.querySelector(".menu");

  if (menu) {
    var itens = menu.querySelectorAll("a[data-menu]");

    var ativar = function (id) {
      document.body.setAttribute("data-menu", id);
      Array.prototype.forEach.call(itens, function (item) {
        var atual = item.getAttribute("data-menu") === id;
        // aria-current em vez de uma classe: o estado do menu é informação,
        // não decoração, e o CSS pinta a partir do próprio atributo.
        item.setAttribute("aria-current", atual ? "true" : "false");
      });
      history.replaceState(null, "", "#menu-" + id);
    };

    menu.addEventListener("click", function (e) {
      var alvo = e.target.closest("a[data-menu]");
      if (!alvo) return;
      e.preventDefault();
      ativar(alvo.getAttribute("data-menu"));
    });

    var doHash = (location.hash.match(/^#menu-(\d+)$/) || [])[1];
    ativar(doHash && document.querySelector('a[data-menu="' + doHash + '"]') ? doHash : "1");
  }

  /* --------------------------------------------------------------------
     Menus que abrem e fecham (acessibilidade no topbar, links no celular)
     -------------------------------------------------------------------- */
  function sanfona(raiz, botao) {
    if (!raiz || !botao) return;

    function estado(aberto) {
      raiz.setAttribute("aria-expanded", aberto ? "true" : "false");
      botao.setAttribute("aria-expanded", aberto ? "true" : "false");
    }

    estado(false);

    botao.addEventListener("click", function (e) {
      e.stopPropagation();
      estado(raiz.getAttribute("aria-expanded") !== "true");
    });

    // Fecha ao clicar fora ou no Esc — sem isso o painel fica aberto por
    // cima do palco e atrapalha justamente o que se quer olhar.
    document.addEventListener("click", function (e) {
      if (!raiz.contains(e.target)) estado(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") estado(false);
    });
  }

  var acess = document.querySelector(".acessibilidade");
  sanfona(acess, acess && acess.querySelector(".acessibilidade-btn"));

  var topbarMenu = document.querySelector(".topbar-menu");
  sanfona(topbarMenu, topbarMenu && topbarMenu.querySelector(".topbar-toggler"));
})();
