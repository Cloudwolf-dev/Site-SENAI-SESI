/**
 * Conceito — comportamento mínimo
 *
 * O estado é um par (menu, opção) dentro de um público: o menu do navbar
 * troca a cor do degradê do palco e o conjunto de opções da sub bar; a opção
 * da sub bar é o segundo nível dentro do menu; e o público — "Para você" ou
 * "Para empresa" — troca a superfície do navbar (branco ou azul escuro) e,
 * com ela, a versão da logo. Fora isso, só o menu de acessibilidade abre e
 * fecha e o topbar recolhe no celular.
 *
 * A cor não é escolhida aqui: o clique só escreve o número do menu em
 * <body data-menu="N">, e o público em <body data-publico="...">; o
 * conceito.css diz o que cada valor significa.
 * Os rótulos também não: quantas opções cada menu tem e como se chamam está
 * no HTML, em <ul class="submenu" data-de="N">.
 */
(function () {
  "use strict";

  /* --------------------------------------------------------------------
     Aba de público — "Para você" / "Para empresa"
     -------------------------------------------------------------------- */
  var PUBLICOS = {
    voce: { rotulo: "Para você", icone: "fa-solid fa-user", outro: "empresa" },
    empresa: { rotulo: "Para empresa", icone: "fa-solid fa-building", outro: "voce" }
  };

  var abaPublico = document.querySelector(".publico");
  var publico = "voce";

  function trocarPublico(id, empurrarHash) {
    if (!PUBLICOS[id]) id = "voce";
    publico = id;
    document.body.setAttribute("data-publico", id);

    if (abaPublico) {
      var def = PUBLICOS[id];
      abaPublico.querySelector(".publico-rotulo").textContent = def.rotulo;
      abaPublico.querySelector("i").className = def.icone;
      abaPublico.setAttribute("data-publico-alvo", def.outro);
      // A aba mostra onde se está, como a aba ativa de um navegador; o que
      // o clique faz só é dito aqui, para quem não vê o ícone de troca.
      abaPublico.setAttribute("aria-label",
        def.rotulo + ". Trocar para " + PUBLICOS[def.outro].rotulo + ".");
    }
    if (empurrarHash !== false) escreverHash();
  }

  if (abaPublico) {
    abaPublico.addEventListener("click", function () {
      trocarPublico(abaPublico.getAttribute("data-publico-alvo"));
    });
  }

  /* --------------------------------------------------------------------
     Navbar e sub bar — o par (menu, opção)
     -------------------------------------------------------------------- */
  var menu = document.querySelector(".menu");
  var subbar = document.querySelector(".subbar");

  /* A URL guarda o estado inteiro — público, menu e opção — para recarregar
     e compartilhar caírem no mesmo lugar. */
  function escreverHash() {
    var b = document.body;
    var partes = [b.getAttribute("data-publico") || "voce",
                  "menu-" + (b.getAttribute("data-menu") || "1")];
    var op = document.querySelector('.submenu.ativo a[aria-current="true"]');
    if (op) partes.push("sub-" + op.getAttribute("data-sub"));
    history.replaceState(null, "", "#" + partes.join("/"));
  }

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

      escreverHash();
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

    var doHash = location.hash.match(/^#(?:(voce|empresa)\/)?menu-(\d+)(?:\/sub-(\d+))?$/) || [];
    // O público entra antes do menu porque quem ativa o menu já escreve o
    // hash completo, e escreveria o público errado se viesse depois.
    trocarPublico(doHash[1] || "voce", false);
    var inicial = doHash[2] && document.querySelector('a[data-menu="' + doHash[2] + '"]') ? doHash[2] : "1";
    ativar(inicial, doHash[3] || null);
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
