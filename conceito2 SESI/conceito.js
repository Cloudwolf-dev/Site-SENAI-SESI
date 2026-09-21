/**
 * Conceito 2 — navegação em dois níveis, com o topo reorganizado
 *
 * O estado é um par (menu, atalho) dentro de um público. O nível 1 — as abas
 * do navbar — troca o conjunto de atalhos da barra de baixo; o nível 2 é o
 * atalho escolhido dentro daquele conjunto; e o público, na aba do topbar,
 * troca a superfície do navbar e o CTA.
 *
 * Os rótulos não estão aqui: quantos atalhos cada menu tem e como se chamam
 * está no HTML, em <ul class="submenu" data-de="...">. Acrescentar um menu é
 * acrescentar um <li> no nível 1 e um <ul> no nível 2 — o script lê os dois.
 *
 * A URL guarda o estado inteiro como #destino/menu/atalho, então recarregar,
 * voltar no histórico ou compartilhar o link cai no mesmo lugar. É o destino
 * que entra nela, e não o público: o público é consequência dele.
 *
 * Muda em relação ao conceito/: o topbar também é fixo (então há três
 * alturas a encaixar, não uma) e o público é um toggle de duas posições em
 * vez de um botão que alterna. E esta é a casa do SESI, que tem três sites:
 * dois para pessoa física — Educação e Cultura, Saúde e Esportes — e um
 * para empresas. O seletor tem as três posições, porque são três destinos.
 *
 * O resto do comportamento da página — busca, acessibilidade, links
 * institucionais e o banner em accordion — continua vindo de
 * assets/js/main.js, que é o mesmo do site.
 */
(function () {
  "use strict";

  /* --------------------------------------------------------------------
     Os três sites
     Cada destino carrega o que muda com ele: o nome que abre o caminho, o
     CTA e o público. O público continua existindo como atributo separado
     porque é dele que saem as cores, a logo e a transição — um destino diz
     *qual site*, o público diz *que cara ele tem*, e dois destinos
     compartilham a mesma cara.
     -------------------------------------------------------------------- */
  var DESTINOS = {
    educacao: {
      nome: "Educação e Cultura",
      publico: "voce",
      cta: { rotulo: "Cursos Disponíveis", href: "../para-voce/cursos/index.html" }
    },
    saude: {
      nome: "Saúde e Esportes",
      publico: "voce",
      cta: { rotulo: "Cursos Disponíveis", href: "../para-voce/cursos/index.html" }
    },
    empresa: {
      nome: "Para empresa",
      publico: "empresa",
      cta: { rotulo: "Agende uma consulta", href: "#" }
    }
  };

  var toggle = document.querySelector(".publico-toggle");
  var opcoesDestino = toggle ? toggle.querySelectorAll("[data-destino]") : [];
  var cta = document.getElementById("navCta");
  var nivel1 = document.getElementById("menuNivel1");
  var subbar = document.querySelector(".subbar");
  var navbar = document.querySelector(".mainnav");
  var marca = document.querySelector(".mainnav-brand");
  var crumbRaiz = document.querySelector(".breadcrumb-modern a[data-menu]");
  var crumbMenu = document.getElementById("navCrumbMenu");
  var crumbSub = document.getElementById("navCrumbSub");

  if (!nivel1 || !subbar) return;

  var conjuntos = subbar.querySelectorAll(".submenu[data-de]");
  var abas = nivel1.querySelectorAll("a[data-menu]");
  var MENU_RAIZ = "inicio";

  var destino = document.body.getAttribute("data-destino") || "educacao";
  var menu = MENU_RAIZ;
  var atalho = null;

  function conjuntoDe(id) {
    return subbar.querySelector('.submenu[data-de="' + id + '"]');
  }

  function rotuloMenu(id) {
    var aba = nivel1.querySelector('a[data-menu="' + id + '"]');
    return aba ? aba.textContent.trim() : "";
  }

  function marcar(links, valor, attr) {
    Array.prototype.forEach.call(links, function (link) {
      // aria-current em vez de uma classe: o estado é informação, não
      // decoração, e o CSS pinta a partir do próprio atributo.
      link.setAttribute("aria-current", link.getAttribute(attr) === valor ? "true" : "false");
    });
  }

  function escreverHash() {
    var partes = [destino, menu];
    if (atalho) partes.push(atalho);
    history.replaceState(null, "", "#" + partes.join("/"));
  }

  /* --------------------------------------------------------------------
     Troca de site
     -------------------------------------------------------------------- */
  function irPara(id, gravarHash) {
    if (!DESTINOS[id]) id = "educacao";
    destino = id;

    var def = DESTINOS[id];
    document.body.setAttribute("data-destino", id);
    // O público é derivado, e não escolhido: é o que faz "Educação e
    // Cultura" e "Saúde e Esportes" partilharem cores, logo e CTA sem
    // precisarem saber um do outro.
    document.body.setAttribute("data-publico", def.publico);

    // aria-pressed, e não uma classe: num grupo de botões que se excluem, é
    // o atributo que diz ao leitor de tela qual está acionado — e é dele
    // que o CSS tira a cor da opção escolhida.
    Array.prototype.forEach.call(opcoesDestino, function (op) {
      op.setAttribute("aria-pressed", op.getAttribute("data-destino") === id ? "true" : "false");
    });
    if (cta) {
      cta.textContent = def.cta.rotulo;
      cta.setAttribute("href", def.cta.href);
    }
    if (crumbRaiz) crumbRaiz.textContent = def.nome;

    if (gravarHash !== false) escreverHash();
  }

  if (toggle) {
    toggle.addEventListener("click", function (e) {
      var opcao = e.target.closest("[data-destino]");
      if (opcao) irPara(opcao.getAttribute("data-destino"));
    });
  }

  /* --------------------------------------------------------------------
     Níveis 1 e 2
     -------------------------------------------------------------------- */
  function sincronizarCaminho() {
    if (!crumbMenu || !crumbSub) return;
    // Na raiz o degrau do menu seria "Início > Início": some.
    crumbMenu.hidden = menu === MENU_RAIZ;
    if (!crumbMenu.hidden) crumbMenu.textContent = rotuloMenu(menu);

    var conjunto = conjuntoDe(menu);
    var link = conjunto && conjunto.querySelector('a[data-sub="' + atalho + '"]');
    crumbSub.hidden = !link;
    if (link) crumbSub.textContent = link.textContent.trim();
  }

  function ativar(idMenu, idAtalho, gravarHash) {
    var conjunto = conjuntoDe(idMenu);
    if (!conjunto) return;

    // Nenhum atalho vem marcado por padrão. Eles são acesso rápido, não
    // seções da página: destacar o primeiro só porque é o primeiro diria
    // que o visitante está nele, o que não é verdade.
    var opcoes = conjunto.querySelectorAll("a[data-sub]");
    var escolhido = null;
    Array.prototype.forEach.call(opcoes, function (op) {
      if (op.getAttribute("data-sub") === idAtalho) escolhido = idAtalho;
    });

    menu = idMenu;
    atalho = escolhido;
    document.body.setAttribute("data-menu", menu);

    marcar(abas, menu, "data-menu");
    if (marca) marca.setAttribute("aria-current", menu === MENU_RAIZ ? "true" : "false");

    Array.prototype.forEach.call(conjuntos, function (c) {
      c.classList.toggle("ativo", c.getAttribute("data-de") === menu);
    });
    marcar(opcoes, atalho, "data-sub");

    var ativo = atalho && conjunto.querySelector('a[aria-current="true"]');
    if (ativo) {
      // A barra rola na horizontal e o atalho ativo pode nascer fora da
      // vista. A conta é feita em rects, e não com scrollIntoView, porque
      // este último também mexe na rolagem vertical da página.
      var caixa = conjunto.getBoundingClientRect();
      var item = ativo.getBoundingClientRect();
      conjunto.scrollLeft += (item.left - caixa.left) - (caixa.width - item.width) / 2;
    }

    sincronizarCaminho();
    if (gravarHash !== false) escreverHash();
  }

  document.addEventListener("click", function (e) {
    var alvo = e.target.closest("a[data-menu], a[data-sub]");
    if (!alvo) return;
    var destinoMenu = alvo.getAttribute("data-menu");
    if (destinoMenu) {
      if (!conjuntoDe(destinoMenu)) return;
      e.preventDefault();
      ativar(destinoMenu, null);
      return;
    }
    // Num atalho, o menu é o da barra em que ele está — não o atual, que
    // seria o mesmo mas por acidente.
    var barra = alvo.closest(".submenu[data-de]");
    e.preventDefault();
    ativar(barra ? barra.getAttribute("data-de") : menu, alvo.getAttribute("data-sub"));
  });

  /* --------------------------------------------------------------------
     As três barras são fixas e param empilhadas: o topbar em 0, o navbar
     logo abaixo dele e a faixa de atalhos abaixo dos dois. As alturas mudam
     com a largura da tela — no celular o topbar quebra em duas linhas e o
     navbar também —, então elas são medidas em vez de escritas à mão.
     -------------------------------------------------------------------- */
  var topbar = document.querySelector(".topbar");

  // function encaixarBarras() {
  //   var alturaTopo = topbar ? topbar.offsetHeight : 0;
  //   if (navbar) navbar.style.top = alturaTopo + "px";
  //   subbar.style.top = alturaTopo + (navbar ? navbar.offsetHeight : 0) + "px";
  // }
  function encaixarBarras() {
    if (navbar) navbar.style.top = "0px";
    if (subbar) subbar.style.top = (navbar ? navbar.offsetHeight : 0) + "px";
  }
  window.addEventListener("resize", encaixarBarras);

  /* --------------------------------------------------------------------
     Estado inicial e histórico
     -------------------------------------------------------------------- */
  function daUrl(gravarHash) {
    var m = location.hash.match(/^#(?:(educacao|saude|empresa)\/)?([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/) || [];
    // O destino entra antes do menu: quem ativa o menu já grava o hash
    // inteiro, e gravaria o destino errado se viesse depois.
    irPara(m[1] || destino, false);
    ativar(conjuntoDe(m[2]) ? m[2] : MENU_RAIZ, m[3] || null, gravarHash);
  }

  window.addEventListener("popstate", function () { daUrl(false); });
  window.addEventListener("hashchange", function () { daUrl(false); });

  encaixarBarras();
  daUrl(false);
})();
