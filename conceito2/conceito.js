/**
 * Conceito 2 — navegação em dois níveis, com o topo reorganizado
 *
 * O estado é um par (menu, atalho) dentro de um público. O nível 1 — as abas
 * do navbar — troca o conjunto de atalhos da barra de baixo; o nível 2 é o
 * atalho escolhido dentro daquele conjunto; e o público, na aba do topbar,
 * troca a superfície do navbar e o CTA.
 *
 * No celular há ainda a visão: a página é um app de cinco telas, uma por aba
 * da barra de baixo, e só a tela da aba atual aparece. A visão quase sempre
 * é a do menu — a exceção é o Institucional, que vive dentro de Início, e o
 * CTA central, que é uma visão sem menu próprio. O botão flutuante abre, de
 * baixo para cima, o nível 2 da visão em que se está.
 *
 * Os rótulos não estão aqui: quantos atalhos cada menu tem e como se chamam
 * está no HTML, em <ul class="submenu" data-de="...">. Acrescentar um menu é
 * acrescentar um <li> no nível 1 e um <ul> no nível 2 — o script lê os dois.
 *
 * A URL guarda o estado inteiro como #publico/menu/atalho, então recarregar,
 * voltar no histórico ou compartilhar o link cai no mesmo lugar. A visão do
 * CTA, que não tem menu, aparece no lugar dele como "cursos-disponiveis".
 *
 * Muda em relação ao conceito/: a marca vive no topbar, o topbar também é
 * fixo (então há três alturas a encaixar, não uma) e o público é um toggle
 * de duas posições em vez de um botão que alterna.
 *
 * O resto do comportamento da página — busca, acessibilidade, links
 * institucionais e o banner em accordion — continua vindo de
 * assets/js/main.js, que é o mesmo do site.
 */
(function () {
  "use strict";

  /* --------------------------------------------------------------------
     Público — "Para você" / "Para empresa"
     As duas opções ficam à vista no toggle; o script só marca qual está
     apertada. Não há mais rótulo nem ícone a reescrever.
     -------------------------------------------------------------------- */
  var PUBLICOS = {
    voce: {
      nome: "Para você",
      cta: { rotulo: "Cursos Disponíveis", href: "../para-voce/cursos/index.html", icone: "fa-book-open" }
    },
    empresa: {
      nome: "Para empresa",
      cta: { rotulo: "Agende uma consulta", href: "#", icone: "fa-calendar-check" }
    }
  };

  /* --------------------------------------------------------------------
     Visões do celular
     Qual tela cada menu mostra, qual menu cada tela ativa e quais conjuntos
     de atalhos o botão de opções de cada tela abre. O Institucional não tem
     aba: é um grupo dentro das opções de Início.
     -------------------------------------------------------------------- */
  var VISAO_DO_MENU = {
    inicio: "inicio",
    institucional: "inicio",
    cursos: "cursos",
    programas: "programas",
    eventos: "eventos"
  };
  var MENU_DA_VISAO = {
    inicio: "inicio",
    cursos: "cursos",
    destaque: "cursos",
    programas: "programas",
    eventos: "eventos"
  };
  var OPCOES_DA_VISAO = {
    inicio: ["inicio", "institucional", "mais"],
    cursos: ["cursos"],
    destaque: ["cursos"],
    programas: ["programas"],
    eventos: ["eventos"]
  };
  // O nome da visão do CTA no endereço, onde as outras levam o do menu.
  var HASH_DESTAQUE = "cursos-disponiveis";

  var toggle = document.querySelector(".publico-toggle");
  var opcoesPublico = toggle ? toggle.querySelectorAll("[data-publico]") : [];
  var cta = document.getElementById("navCta");
  var tabCta = document.getElementById("tabCta");
  var publicoMenu = document.querySelector(".publico-menu");
  var publicoBotao = publicoMenu ? publicoMenu.querySelector(".publico-menu-toggle") : null;
  var publicoAtual = publicoMenu ? publicoMenu.querySelector(".publico-menu-atual") : null;
  var nivel1 = document.getElementById("menuNivel1");
  var subbar = document.querySelector(".subbar");
  var navbar = document.querySelector(".mainnav");
  var marca = document.querySelector(".mainnav-brand");
  var crumbRaiz = document.querySelector(".breadcrumb-modern a[data-menu]");
  var crumbMenu = document.getElementById("navCrumbMenu");
  var crumbSub = document.getElementById("navCrumbSub");

  if (!nivel1 || !subbar) return;

  var conjuntos = subbar.querySelectorAll(".submenu[data-de]");
  // As abas do navbar são o nível 1; as da barra de baixo, as visões.
  var abas = document.querySelectorAll("#menuNivel1 a[data-menu]");
  var abasVisao = document.querySelectorAll(".mobile-tabbar a[data-visao]");
  var visoes = document.querySelectorAll(".visao[data-visao]");
  var MENU_RAIZ = "inicio";
  var celular = window.matchMedia("(max-width: 991.98px)");
  var menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  var publico = document.body.getAttribute("data-publico") || "voce";
  var menu = MENU_RAIZ;
  var atalho = null;
  var visao = "inicio";
  // Onde cada visão estava, para a aba voltar ao mesmo ponto, como nos apps.
  var rolagem = {};

  var tituloFolha = document.getElementById("nivel2Titulo");
  var fecharFolha = subbar.querySelector(".nivel2-voltar");
  var fundoFolha = document.querySelector(".folha-fundo");
  var botaoOpcoes = document.querySelector(".fab-opcoes");
  var folhaAberta = false;

  function conjuntoDe(id) {
    return subbar.querySelector('.submenu[data-de="' + id + '"]');
  }

  function rotuloMenu(id) {
    var aba = nivel1.querySelector('a[data-menu="' + id + '"]');
    return aba ? aba.textContent.trim() : "";
  }

  // O nome da visão é o rótulo da própria aba — no CTA, o do público.
  function rotuloVisao(id) {
    var aba = document.querySelector('.mobile-tabbar a[data-visao="' + id + '"]');
    var rotulo = aba && aba.querySelector(".tab-cta-label, span:last-child");
    return rotulo ? rotulo.textContent.trim() : "";
  }

  function marcar(links, valor, attr) {
    Array.prototype.forEach.call(links, function (link) {
      // aria-current em vez de uma classe: o estado é informação, não
      // decoração, e o CSS pinta a partir do próprio atributo.
      link.setAttribute("aria-current", link.getAttribute(attr) === valor ? "true" : "false");
    });
  }

  function escreverHash() {
    var partes = [publico, visao === "destaque" ? HASH_DESTAQUE : menu];
    if (atalho) partes.push(atalho);
    history.replaceState(null, "", "#" + partes.join("/"));
  }

  /* --------------------------------------------------------------------
     Público
     -------------------------------------------------------------------- */
  function trocarPublico(id, gravarHash) {
    if (!PUBLICOS[id]) id = "voce";
    publico = id;
    document.body.setAttribute("data-publico", id);

    var def = PUBLICOS[id];
    // aria-pressed, e não uma classe: num par de botões que se excluem, é o
    // atributo que diz ao leitor de tela qual está acionado — e é dele que
    // o CSS tira a cor da opção escolhida.
    Array.prototype.forEach.call(opcoesPublico, function (op) {
      op.setAttribute("aria-pressed", op.getAttribute("data-publico") === id ? "true" : "false");
    });
    if (cta) {
      cta.textContent = def.cta.rotulo;
      cta.setAttribute("href", def.cta.href);
    }
    // O botão central da barra de baixo é o mesmo CTA, com ícone.
    if (tabCta) {
      tabCta.setAttribute("href", def.cta.href);
      var rotuloTab = tabCta.querySelector(".tab-cta-label");
      var iconeTab = tabCta.querySelector(".tab-cta-circle i");
      if (rotuloTab) rotuloTab.textContent = def.cta.rotulo;
      if (iconeTab) iconeTab.className = "fa-solid " + def.cta.icone;
    }
    if (crumbRaiz) crumbRaiz.textContent = def.nome;
    if (publicoAtual) publicoAtual.textContent = def.nome;
    rotularBotaoOpcoes();

    if (gravarHash !== false) escreverHash();
  }

  if (toggle) {
    toggle.addEventListener("click", function (e) {
      var opcao = e.target.closest("[data-publico]");
      if (!opcao) return;
      trocarPublico(opcao.getAttribute("data-publico"));
      // No celular o toggle é o painel do dropdown: escolher fecha.
      abrirPublicoMenu(false);
    });
  }

  /* --------------------------------------------------------------------
     Dropdown do público (só no celular)
     No desktop o botão não aparece e a classe não muda nada; no celular
     ela é o que mostra o toggle, como painel sob o botão.
     -------------------------------------------------------------------- */
  function abrirPublicoMenu(abrir) {
    if (!publicoMenu || !publicoBotao) return;
    publicoMenu.classList.toggle("aberto", abrir);
    publicoBotao.setAttribute("aria-expanded", abrir ? "true" : "false");
  }

  if (publicoBotao) {
    publicoBotao.addEventListener("click", function () {
      abrirPublicoMenu(!publicoMenu.classList.contains("aberto"));
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".publico-menu")) abrirPublicoMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && publicoMenu.classList.contains("aberto")) {
        abrirPublicoMenu(false);
        publicoBotao.focus();
      }
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

  function ativar(idMenu, idAtalho) {
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
      // Um atalho só fica marcado no conjunto do menu atual: o Validador,
      // por exemplo, existe em Início e em Institucional.
      if (c !== conjunto) marcar(c.querySelectorAll("a[data-sub]"), null, "data-sub");
    });
    marcar(opcoes, atalho, "data-sub");

    var ativo = atalho && conjunto.querySelector('a[aria-current="true"]');
    if (ativo && !folhaAberta) {
      // A barra rola na horizontal e o atalho ativo pode nascer fora da
      // vista. A conta é feita em rects, e não com scrollIntoView, porque
      // este último também mexe na rolagem vertical da página.
      var caixa = conjunto.getBoundingClientRect();
      var item = ativo.getBoundingClientRect();
      conjunto.scrollLeft += (item.left - caixa.left) - (caixa.width - item.width) / 2;
    }

    sincronizarCaminho();
  }

  /* --------------------------------------------------------------------
     Visões (celular)
     Só a .visao da aba atual aparece; o CSS esconde as outras a partir da
     classe. No desktop o CSS mostra sempre a de Início, então trocar de
     visão lá não muda nada na tela.
     -------------------------------------------------------------------- */
  function rotularBotaoOpcoes() {
    if (botaoOpcoes) botaoOpcoes.setAttribute("aria-label", "Opções de " + rotuloVisao(visao));
  }

  function mostrarVisao(id) {
    if (!MENU_DA_VISAO[id]) id = "inicio";
    var trocou = id !== visao;
    if (trocou) rolagem[visao] = window.scrollY;
    visao = id;

    document.body.setAttribute("data-visao", id);
    Array.prototype.forEach.call(visoes, function (v) {
      v.classList.toggle("ativa", v.getAttribute("data-visao") === id);
    });
    marcar(abasVisao, id, "data-visao");
    rotularBotaoOpcoes();

    // Cada aba volta ao ponto em que foi deixada; a primeira visita começa
    // no topo. No desktop a página é uma só e a rolagem não é da visão.
    if (trocou && celular.matches) window.scrollTo(0, rolagem[id] || 0);
  }

  function irPara(idVisao, idMenu, idAtalho, gravarHash) {
    ativar(idMenu, idAtalho);
    mostrarVisao(idVisao);
    if (gravarHash !== false) escreverHash();
  }

  /* --------------------------------------------------------------------
     Folha de opções (celular)
     O botão flutuante abre o nível 2 da visão atual como uma folha que sobe
     da barra de abas. A folha é a própria .subbar, restilizada pelo CSS a
     partir da classe no body; dentro dela aparecem só os conjuntos da
     visão — em Início, o acesso rápido, o institucional e o "Mais", em grupos.
     Escolher uma opção conclui o passo e fecha a folha.
     -------------------------------------------------------------------- */
  function abrirFolha(abrir) {
    if (folhaAberta === abrir) return;
    folhaAberta = abrir;

    if (abrir) {
      var daVisao = OPCOES_DA_VISAO[visao] || [];
      Array.prototype.forEach.call(conjuntos, function (c) {
        c.classList.toggle("na-folha", daVisao.indexOf(c.getAttribute("data-de")) !== -1);
      });
      if (tituloFolha) tituloFolha.textContent = rotuloVisao(visao);
    }

    document.body.classList.toggle("nivel2-aberto", abrir);
    if (botaoOpcoes) botaoOpcoes.setAttribute("aria-expanded", abrir ? "true" : "false");

    if (abrir) {
      // A folha reaproveita a rolagem da lista: abrir sempre no topo dela.
      var lista = subbar.querySelector(".container-xl");
      if (lista) lista.scrollTop = 0;
      if (fecharFolha) fecharFolha.focus({ preventScroll: true });
    } else if (botaoOpcoes && subbar.contains(document.activeElement)) {
      // Quem fechou pelo teclado continua de onde abriu.
      botaoOpcoes.focus({ preventScroll: true });
    }
  }

  if (botaoOpcoes) {
    botaoOpcoes.addEventListener("click", function () { abrirFolha(!folhaAberta); });
  }
  if (fecharFolha) {
    fecharFolha.addEventListener("click", function () { abrirFolha(false); });
  }
  if (fundoFolha) {
    fundoFolha.addEventListener("click", function () { abrirFolha(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && folhaAberta) abrirFolha(false);
  });
  // Girar o aparelho para a horizontal larga leva ao desktop, onde a folha
  // não existe: ela não pode ficar aberta e travando a rolagem.
  celular.addEventListener("change", function () { if (!celular.matches) abrirFolha(false); });

  document.addEventListener("click", function (e) {
    var alvo = e.target.closest("a[data-visao], a[data-menu], a[data-sub]");
    if (!alvo) return;

    // Aba da barra de baixo: troca de visão. Tocar de novo na aba atual
    // volta ao topo dela, como nos apps.
    var destinoVisao = alvo.getAttribute("data-visao");
    if (destinoVisao) {
      e.preventDefault();
      abrirFolha(false);
      if (destinoVisao === visao) {
        window.scrollTo({ top: 0, behavior: menosMovimento.matches ? "auto" : "smooth" });
        return;
      }
      irPara(destinoVisao, MENU_DA_VISAO[destinoVisao], null);
      return;
    }

    // Menu do navbar, marca ou migalha.
    var destinoMenu = alvo.getAttribute("data-menu");
    if (destinoMenu) {
      if (!conjuntoDe(destinoMenu)) return;
      e.preventDefault();
      irPara(VISAO_DO_MENU[destinoMenu] || "inicio", destinoMenu, null);
      return;
    }

    // Atalho: o menu é o do conjunto em que ele está; fora de um conjunto —
    // num card da visão —, é o menu atual. A visão só muda se o atalho for
    // de outra: no CTA, as opções são as de Cursos, e escolher uma delas
    // não deve tirar o visitante dali.
    var barra = alvo.closest(".submenu[data-de]");
    var idMenu = barra ? barra.getAttribute("data-de") : menu;
    e.preventDefault();
    var idVisao = MENU_DA_VISAO[visao] === idMenu ? visao : (VISAO_DO_MENU[idMenu] || visao);
    irPara(idVisao, idMenu, alvo.getAttribute("data-sub"));
    abrirFolha(false);
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
     Posts (celular)
     Na home do celular as notícias e os grupos de serviço viram posts do
     Instagram. O que o post tem a mais que o card — o avatar e o nome do
     perfil, os pontos e o contador do carrossel — é posto aqui, e o CSS só
     o mostra no celular: no desktop os cards continuam os mesmos.
     -------------------------------------------------------------------- */
  var AVATAR = "../assets/img/logos%20SENAI/senai_cor.png";

  function criarAvatar() {
    var avatar = document.createElement("span");
    avatar.className = "post-avatar";
    var img = document.createElement("img");
    img.src = AVATAR;
    img.alt = "";
    avatar.appendChild(img);
    return avatar;
  }

  // Notícias: o post ganha o avatar, a categoria — que estava no selo sobre
  // a foto e vai para baixo do título, no lugar da localização — e o "Ler
  // notícia completa". Onde cada um fica é a grade do CSS; o título é o
  // próprio da notícia, que sobe para o cabeçalho.
  Array.prototype.forEach.call(document.querySelectorAll(".secao-noticias .news-card"), function (card) {
    var selo = card.querySelector(".news-badge");
    card.insertBefore(criarAvatar(), card.firstChild);
    if (selo) {
      var categoria = document.createElement("span");
      categoria.className = "post-categoria";
      categoria.textContent = selo.textContent.trim();
      card.appendChild(categoria);
    }
    var ler = document.createElement("span");
    ler.className = "post-ler";
    ler.textContent = "Ler notícia completa";
    var seta = document.createElement("i");
    seta.className = "fa-solid fa-arrow-right";
    seta.setAttribute("aria-hidden", "true");
    ler.appendChild(seta);
    card.appendChild(ler);
  });

  /* --------------------------------------------------------------------
     Posts em carrossel
     Cada grupo .post-carrossel vira um post de várias fotos que passa
     sozinho a cada 3 segundos e se arrasta com o dedo. A passagem para
     enquanto o dedo ou o foco do teclado estão nele, quando sai da tela e
     com a aba em segundo plano; quem pediu menos movimento recebe o
     carrossel parado. O botão no canto pausa e retoma — conteúdo que se
     move sozinho precisa de um jeito de parar.
     -------------------------------------------------------------------- */
  var INTERVALO_CARROSSEL = 3000;

  Array.prototype.forEach.call(document.querySelectorAll(".post-carrossel"), function (post) {
    var cabeca = post.querySelector(".service-group-heading");
    var trilho = post.querySelector(".row");
    if (!cabeca || !trilho || !trilho.children.length) return;
    var total = trilho.children.length;
    var tituloGrupo = cabeca.querySelector("h3");

    // Cabeçalho: o avatar antes do título do grupo, que é a única linha —
    // como nas notícias, o nome do perfil repetido em todo post não diz
    // nada. O "Ver todos" ocupa o lugar do "Seguir".
    cabeca.insertBefore(criarAvatar(), cabeca.firstChild);

    // O trilho ganha um quadro, que é onde o contador e a pausa se apoiam.
    var quadro = document.createElement("div");
    quadro.className = "carrossel-quadro";
    trilho.parentNode.insertBefore(quadro, trilho);
    quadro.appendChild(trilho);
    trilho.classList.add("carrossel-trilho");
    trilho.setAttribute("role", "group");
    trilho.setAttribute("aria-roledescription", "carrossel");
    if (tituloGrupo) trilho.setAttribute("aria-label", tituloGrupo.textContent.trim());

    var contadorSlide = document.createElement("span");
    contadorSlide.className = "carrossel-contador";
    contadorSlide.setAttribute("aria-hidden", "true");
    quadro.appendChild(contadorSlide);

    var pausa = document.createElement("button");
    pausa.type = "button";
    pausa.className = "carrossel-pausa";
    pausa.appendChild(document.createElement("i"));
    quadro.appendChild(pausa);

    // Os pontos só mostram onde se está; quem troca de foto é o dedo, e o
    // teclado percorre os links das fotos.
    var pontos = document.createElement("div");
    pontos.className = "carrossel-pontos";
    pontos.setAttribute("aria-hidden", "true");
    for (var i = 0; i < total; i++) pontos.appendChild(document.createElement("span"));
    post.insertBefore(pontos, quadro.nextSibling);

    var slide = 0;
    var pausado = menosMovimento.matches;
    var visivel = false;
    var tocando = false;
    var focado = false;
    var timer = null;

    function marcarSlide(n) {
      slide = n;
      contadorSlide.textContent = (n + 1) + "/" + total;
      Array.prototype.forEach.call(pontos.children, function (p, j) {
        p.classList.toggle("ativo", j === n);
      });
    }

    function rotularPausa() {
      pausa.setAttribute("aria-label", (pausado ? "Continuar" : "Pausar") + " carrossel");
      pausa.firstChild.className = "fa-solid " + (pausado ? "fa-play" : "fa-pause");
    }

    function agendar() {
      clearTimeout(timer);
      if (pausado || !visivel || tocando || focado || document.hidden || !celular.matches) return;
      timer = setTimeout(function () {
        // Do último volta ao primeiro, para a passagem não parar no fim.
        trilho.scrollTo({
          left: ((slide + 1) % total) * trilho.clientWidth,
          behavior: menosMovimento.matches ? "auto" : "smooth"
        });
        agendar();
      }, INTERVALO_CARROSSEL);
    }

    trilho.addEventListener("scroll", function () {
      var n = Math.round(trilho.scrollLeft / trilho.clientWidth);
      n = Math.max(0, Math.min(total - 1, n));
      if (n !== slide) marcarSlide(n);
    }, { passive: true });

    // Depois de arrastar, a contagem recomeça: a próxima troca vem 3
    // segundos depois de soltar, e não no meio do gesto.
    trilho.addEventListener("pointerdown", function () { tocando = true; agendar(); });
    window.addEventListener("pointerup", function () {
      if (!tocando) return;
      tocando = false;
      agendar();
    });
    window.addEventListener("pointercancel", function () {
      if (!tocando) return;
      tocando = false;
      agendar();
    });
    post.addEventListener("focusin", function (e) {
      if (e.target === pausa) return;
      focado = true;
      agendar();
    });
    post.addEventListener("focusout", function () { focado = false; agendar(); });

    pausa.addEventListener("click", function () {
      pausado = !pausado;
      rotularPausa();
      agendar();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        visivel = entradas[0].isIntersecting;
        agendar();
      }, { threshold: 0.6 }).observe(quadro);
    } else {
      visivel = true;
    }
    document.addEventListener("visibilitychange", agendar);
    celular.addEventListener("change", agendar);

    marcarSlide(0);
    rotularPausa();
    agendar();
  });

  /* --------------------------------------------------------------------
     Estado inicial e histórico
     -------------------------------------------------------------------- */
  function daUrl(gravarHash) {
    var m = location.hash.match(/^#(?:(voce|empresa)\/)?([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/) || [];
    // O público entra antes do menu: quem ativa o menu já grava o hash
    // inteiro, e gravaria o público errado se viesse depois.
    trocarPublico(m[1] || publico, false);
    if (m[2] === HASH_DESTAQUE) {
      irPara("destaque", MENU_DA_VISAO.destaque, m[3] || null, gravarHash);
      return;
    }
    // Só menus de verdade: o conjunto "mais" é um grupo da folha, não menu.
    var idMenu = VISAO_DO_MENU[m[2]] && conjuntoDe(m[2]) ? m[2] : MENU_RAIZ;
    irPara(VISAO_DO_MENU[idMenu] || "inicio", idMenu, m[3] || null, gravarHash);
  }

  window.addEventListener("popstate", function () { abrirFolha(false); daUrl(false); });
  window.addEventListener("hashchange", function () { abrirFolha(false); daUrl(false); });

  encaixarBarras();
  daUrl(false);
})();
