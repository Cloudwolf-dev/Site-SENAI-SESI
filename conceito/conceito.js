/**
 * Conceito — comportamento mínimo
 *
 * O estado é um par (menu, opção): o menu do navbar troca a cor do degradê
 * do palco e o conjunto de opções da sub bar; a opção da sub bar é o segundo
 * nível dentro do menu. Fora isso, só o menu de acessibilidade abre e fecha
 * e o topbar recolhe no celular.
 *
 * A cor não é escolhida aqui: o clique só escreve o número do menu em
 * <body data-menu="N"> e o conceito.css diz o que aquele número significa.
 * Os rótulos também não: quantas opções cada menu tem e como se chamam está
 * no HTML, em <ul class="submenu" data-de="N">.
 */
(function () {
  "use strict";

  /* --------------------------------------------------------------------
     Navbar e sub bar — o par (menu, opção)
     -------------------------------------------------------------------- */
  var menu = document.querySelector(".menu");
  var subbar = document.querySelector(".subbar");

  if (menu) {
    var itens = menu.querySelectorAll("a[data-menu]");
    var conjuntos = subbar ? subbar.querySelectorAll(".submenu[data-de]") : [];
    var estado = document.getElementById("estado");

    function marcar(links, valor, attr) {
      Array.prototype.forEach.call(links, function (link) {
        // aria-current em vez de uma classe: o estado é informação, não
        // decoração, e o CSS pinta a partir do próprio atributo.
        link.setAttribute("aria-current", link.getAttribute(attr) === valor ? "true" : "false");
      });
    }

    function conjuntoDe(id) {
      return subbar ? subbar.querySelector('.submenu[data-de="' + id + '"]') : null;
    }

    var ativar = function (id, sub) {
      var conjunto = conjuntoDe(id);
      // Trocar de menu sem dizer qual opção cai na primeira do conjunto: a
      // sub bar nunca fica sem nada selecionado.
      var opcoes = conjunto ? conjunto.querySelectorAll("a[data-sub]") : [];
      var escolhida = null;
      Array.prototype.forEach.call(opcoes, function (op) {
        if (op.getAttribute("data-sub") === sub) escolhida = sub;
      });
      if (!escolhida && opcoes.length) escolhida = opcoes[0].getAttribute("data-sub");

      document.body.setAttribute("data-menu", id);
      marcar(itens, id, "data-menu");

      Array.prototype.forEach.call(conjuntos, function (c) {
        c.classList.toggle("ativo", c.getAttribute("data-de") === id);
      });
      if (conjunto) {
        marcar(opcoes, escolhida, "data-sub");
        // No celular a sub bar rola na horizontal e a opção ativa pode
        // nascer fora da vista. A conta é feita em rects, e não com
        // scrollIntoView, porque este último também mexe na rolagem vertical
        // da página e obedece ao `scroll-behavior: smooth` do documento.
        var ativa = conjunto.querySelector('a[aria-current="true"]');
        if (ativa) {
          var caixa = conjunto.getBoundingClientRect();
          var item = ativa.getBoundingClientRect();
          conjunto.scrollLeft += (item.left - caixa.left) - (caixa.width - item.width) / 2;
        }
      }

      if (estado) {
        var rotuloMenu = menu.querySelector('a[data-menu="' + id + '"]');
        var rotuloSub = conjunto && conjunto.querySelector('a[data-sub="' + escolhida + '"]');
        estado.textContent = (rotuloMenu ? rotuloMenu.textContent : "Menu " + id) +
                             (rotuloSub ? " › " + rotuloSub.textContent : "");
      }

      history.replaceState(null, "", "#menu-" + id + (escolhida ? "/sub-" + escolhida : ""));
    };

    menu.addEventListener("click", function (e) {
      var alvo = e.target.closest("a[data-menu]");
      if (!alvo) return;
      e.preventDefault();
      // Sem opção: cai na primeira do menu de destino.
      ativar(alvo.getAttribute("data-menu"), null);
    });

    if (subbar) {
      subbar.addEventListener("click", function (e) {
        var alvo = e.target.closest("a[data-sub]");
        if (!alvo) return;
        e.preventDefault();
        ativar(document.body.getAttribute("data-menu"), alvo.getAttribute("data-sub"));
      });
    }

    /* A sub bar gruda logo abaixo do navbar, e a altura dele muda com a
       largura da tela (no celular ele quebra em duas linhas). Medir é mais
       barato que manter dois números mágicos em sincronia com o CSS. */
    var navbar = document.querySelector(".navbar");
    function encaixarSubbar() {
      if (navbar && subbar) subbar.style.top = navbar.offsetHeight + "px";
    }
    encaixarSubbar();
    window.addEventListener("resize", encaixarSubbar);

    var doHash = location.hash.match(/^#menu-(\d+)(?:\/sub-(\d+))?$/) || [];
    var inicial = doHash[1] && document.querySelector('a[data-menu="' + doHash[1] + '"]') ? doHash[1] : "1";
    ativar(inicial, doHash[2] || null);
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
