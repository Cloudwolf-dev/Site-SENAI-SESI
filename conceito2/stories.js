/**
 * Conceito 2 — galerias em formato de stories
 *
 * Um círculo por story; clicar num deles abre o visualizador, que passa as
 * fotos uma a uma, com as barrinhas de progresso no topo, e ao fim segue
 * para o story seguinte do mesmo grupo — como no Instagram.
 *
 * Há dois grupos, e nenhum está escrito aqui — o script só lê o HTML:
 *
 * - Eventos: a barra presa à base da tela, no desktop, com um
 *   <button class="story" data-data="..." data-fotos="a.jpg, b.jpg"> por
 *   evento. No celular a barra some e os mesmos círculos são copiados para a
 *   visão Eventos (.eventos-galeria).
 *
 * - Destaques: os cards do banner em accordion. No celular o accordion vira
 *   a fileira de destaques fixados de um perfil (.destaques-lista): um
 *   círculo por card, e o story é a foto do card com o texto e o botão dele
 *   por cima, na legenda.
 *
 * O tempo de cada foto é uma animação CSS da barrinha, e não um timer: o
 * fim da animação é o que avança. Assim pausar é só pausar a animação, e a
 * barra e o avanço nunca se desencontram.
 */
(function () {
  "use strict";

  var viewer = document.querySelector(".story-viewer");
  if (!viewer) return;

  var foto = viewer.querySelector(".story-foto");
  var desfoque = viewer.querySelector(".story-desfoque");
  var progresso = viewer.querySelector(".story-progresso");
  var titulo = viewer.querySelector("#storyTitulo");
  var dataEvento = viewer.querySelector(".story-data");
  var capa = viewer.querySelector(".story-capa");
  var contador = viewer.querySelector(".story-contador");
  var pausar = viewer.querySelector(".story-pausar");
  var legenda = viewer.querySelector(".story-legenda");

  var CHAVE_VISTOS = "conceito2-stories-vistos";

  function fotosDe(botao) {
    return (botao.getAttribute("data-fotos") || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function textoDe(raiz, seletor) {
    var el = raiz.querySelector(seletor);
    return el ? el.textContent.trim() : "";
  }

  /* --------------------------------------------------------------------
     Grupo dos eventos
     -------------------------------------------------------------------- */
  var barra = document.querySelector(".stories-bar");
  var eventos = [];

  if (barra) {
    eventos = Array.prototype.map.call(barra.querySelectorAll(".story"), function (botao) {
      return {
        // O círculo da barra e as cópias dele nas outras galerias.
        botoes: [botao],
        nome: textoDe(botao, ".story-nome"),
        data: botao.getAttribute("data-data") || "",
        fotos: fotosDe(botao)
      };
    });

    // No celular a barra some e a galeria abre a visão Eventos, numa lista
    // própria. Os círculos de lá são cópias dos da barra, feitas aqui para
    // os eventos continuarem cadastrados num lugar só.
    Array.prototype.forEach.call(document.querySelectorAll(".eventos-galeria"), function (galeria) {
      eventos.forEach(function (ev) {
        var item = document.createElement("li");
        item.appendChild(ev.botoes[0].cloneNode(true));
        galeria.appendChild(item);
        ev.botoes.push(item.firstChild);
      });
    });
  }

  /* --------------------------------------------------------------------
     Grupo dos destaques
     Cada card do accordion vira um círculo da fileira de destaques. O
     círculo é montado aqui, a partir do card, para o conteúdo do banner
     continuar escrito uma vez só.
     -------------------------------------------------------------------- */
  var listaDestaques = document.querySelector(".destaques-lista");
  var destaques = [];

  if (listaDestaques) {
    destaques = Array.prototype.map.call(document.querySelectorAll(".hero-accordion .accordion-card"), function (card) {
      var img = card.querySelector("img");
      var link = card.querySelector(".accordion-content a");
      var nome = textoDe(card, ".accordion-vertical-label");

      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "story destaque";
      var anel = document.createElement("span");
      anel.className = "story-anel";
      var miniatura = document.createElement("img");
      miniatura.src = img ? img.getAttribute("src") : "";
      miniatura.alt = "";
      anel.appendChild(miniatura);
      var rotulo = document.createElement("span");
      rotulo.className = "story-nome";
      rotulo.textContent = nome;
      botao.appendChild(anel);
      botao.appendChild(rotulo);

      var item = document.createElement("li");
      item.appendChild(botao);
      listaDestaques.appendChild(item);

      return {
        botoes: [botao],
        nome: nome,
        data: textoDe(card, ".accordion-eyebrow"),
        fotos: [miniatura.src],
        legenda: {
          selo: textoDe(card, ".badge-brand"),
          titulo: textoDe(card, ".accordion-content h3"),
          texto: textoDe(card, ".accordion-content h3 + p"),
          link: link ? link.getAttribute("href") : "",
          rotulo: link ? link.textContent.trim() : ""
        }
      };
    });
  }

  // Só os eventos lembram o que já foi visto: os destaques de um perfil não
  // têm o anel colorido de "novo", então não há o que apagar neles.
  var grupos = [
    { stories: eventos, guardaVistos: true },
    { stories: destaques, guardaVistos: false }
  ];

  var grupo = null;    // o grupo aberto no visualizador
  var atual = -1;      // índice do story aberto, dentro do grupo
  var fotoAtual = 0;   // índice da foto dentro dele
  var pausado = false;
  var origem = null;   // quem abriu, para devolver o foco ao fechar

  /* --------------------------------------------------------------------
     Vistos
     Como no Instagram, o anel de quem já foi visto perde a cor. Guardado
     na sessão, e não para sempre: numa visita nova a galeria volta a
     chamar atenção.
     -------------------------------------------------------------------- */
  function lerVistos() {
    try { return JSON.parse(sessionStorage.getItem(CHAVE_VISTOS)) || []; }
    catch (e) { return []; }
  }

  function marcarVisto(ev) {
    if (!grupo.guardaVistos) return;
    ev.botoes.forEach(function (b) { b.classList.add("visto"); });
    var vistos = lerVistos();
    if (vistos.indexOf(ev.nome) === -1) {
      vistos.push(ev.nome);
      try { sessionStorage.setItem(CHAVE_VISTOS, JSON.stringify(vistos)); } catch (e) {}
    }
  }

  var vistosDaSessao = lerVistos();
  eventos.forEach(function (ev) {
    if (vistosDaSessao.indexOf(ev.nome) !== -1) {
      ev.botoes.forEach(function (b) { b.classList.add("visto"); });
    }
  });

  /* --------------------------------------------------------------------
     Barra: rolagem lateral e recolher
     -------------------------------------------------------------------- */
  if (barra) {
    var lista = barra.querySelector(".stories-lista");
    var rolarAnterior = barra.querySelector(".stories-rolar.anterior");
    var rolarProximo = barra.querySelector(".stories-rolar.proximo");
    var recolher = barra.querySelector(".stories-recolher");

    var atualizarSetas = function () {
      var fim = lista.scrollWidth - lista.clientWidth;
      rolarAnterior.disabled = lista.scrollLeft <= 1;
      rolarProximo.disabled = lista.scrollLeft >= fim - 1;
      // Sem nada para rolar, as setas nem aparecem.
      barra.classList.toggle("sem-rolagem", fim <= 1);
    };

    var rolar = function (sentido) {
      lista.scrollBy({ left: sentido * lista.clientWidth * 0.8, behavior: "smooth" });
    };

    rolarAnterior.addEventListener("click", function () { rolar(-1); });
    rolarProximo.addEventListener("click", function () { rolar(1); });
    lista.addEventListener("scroll", atualizarSetas, { passive: true });
    window.addEventListener("resize", atualizarSetas);

    if (recolher) {
      recolher.addEventListener("click", function () {
        var recolhida = barra.classList.toggle("recolhida");
        recolher.setAttribute("aria-expanded", recolhida ? "false" : "true");
        recolher.setAttribute("aria-label", recolhida ? "Mostrar galeria" : "Recolher galeria");
        if (!recolhida) atualizarSetas();
      });
    }

    atualizarSetas();
  }

  /* --------------------------------------------------------------------
     Visualizador
     -------------------------------------------------------------------- */
  function montarProgresso(total) {
    progresso.innerHTML = "";
    for (var i = 0; i < total; i++) {
      var seg = document.createElement("span");
      seg.className = "story-segmento";
      seg.appendChild(document.createElement("span"));
      progresso.appendChild(seg);
    }
  }

  // O destaque leva o texto e o botão do card por cima da foto. Os eventos
  // não têm legenda: neles a foto é o conteúdo.
  function montarLegenda(dados) {
    viewer.classList.toggle("com-legenda", !!dados);
    if (!legenda) return;
    legenda.hidden = !dados;
    if (!dados) return;
    var selo = legenda.querySelector(".story-legenda-selo");
    var link = legenda.querySelector(".story-legenda-link");
    selo.textContent = dados.selo;
    selo.hidden = !dados.selo;
    legenda.querySelector(".story-legenda-titulo").textContent = dados.titulo;
    legenda.querySelector(".story-legenda-texto").textContent = dados.texto;
    link.textContent = dados.rotulo;
    link.setAttribute("href", dados.link || "#");
    link.hidden = !dados.rotulo;
  }

  function mostrarFoto(indice) {
    var ev = grupo.stories[atual];
    fotoAtual = indice;
    var src = ev.fotos[indice];

    foto.src = src;
    foto.alt = ev.nome + " — foto " + (indice + 1) + " de " + ev.fotos.length;
    // O fundo desfocado é a mesma foto: as horizontais ficam inteiras no
    // quadro vertical, sem faixas pretas em volta.
    desfoque.style.backgroundImage = 'url("' + src + '")';
    contador.textContent = "Foto " + (indice + 1) + " de " + ev.fotos.length;

    Array.prototype.forEach.call(progresso.children, function (seg, i) {
      seg.classList.toggle("feito", i < indice);
      seg.classList.remove("atual");
    });
    // Tirar e repor a classe na mesma volta não reinicia a animação: a
    // leitura do offsetWidth força o navegador a registrar a retirada.
    var seg = progresso.children[indice];
    void seg.offsetWidth;
    seg.classList.add("atual");

    // A próxima foto já vem carregando enquanto esta passa.
    var seguinte = grupo.stories[atual + 1];
    var proxima = ev.fotos[indice + 1] || (seguinte && seguinte.fotos[0]);
    if (proxima) new Image().src = proxima;
  }

  function abrirStory(indice, ultimaFoto) {
    var ev = grupo.stories[indice];
    if (!ev || !ev.fotos.length) return;
    atual = indice;
    titulo.textContent = ev.nome;
    dataEvento.textContent = ev.data;
    capa.src = ev.fotos[0];
    montarProgresso(ev.fotos.length);
    montarLegenda(ev.legenda);
    marcarVisto(ev);
    mostrarFoto(ultimaFoto ? ev.fotos.length - 1 : 0);
  }

  function avancar() {
    var ev = grupo.stories[atual];
    if (fotoAtual < ev.fotos.length - 1) mostrarFoto(fotoAtual + 1);
    else if (atual < grupo.stories.length - 1) abrirStory(atual + 1);
    else fechar();
  }

  function voltar() {
    if (fotoAtual > 0) mostrarFoto(fotoAtual - 1);
    else if (atual > 0) abrirStory(atual - 1, true);
    else mostrarFoto(0); // no primeiro de todos, recomeça a foto
  }

  function definirPausa(valor) {
    pausado = valor;
    viewer.classList.toggle("pausado", pausado);
    pausar.setAttribute("aria-label", pausado ? "Continuar" : "Pausar");
    pausar.querySelector("i").className = "fa-solid " + (pausado ? "fa-play" : "fa-pause");
  }

  function abrir(qual, indice, botao) {
    grupo = qual;
    origem = botao || null;
    viewer.hidden = false;
    document.documentElement.classList.add("story-aberto");
    // Quem pediu menos movimento não recebe fotos passando sozinhas: abre
    // pausado e avança quando quiser.
    definirPausa(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    abrirStory(indice);
    viewer.querySelector(".story-fechar").focus();
  }

  function fechar() {
    viewer.hidden = true;
    document.documentElement.classList.remove("story-aberto");
    atual = -1;
    foto.src = "";
    if (origem) origem.focus();
  }

  // O fim da animação da barrinha atual é o que passa para a próxima foto.
  progresso.addEventListener("animationend", function (e) {
    if (e.target.parentNode.classList.contains("atual")) avancar();
  });

  grupos.forEach(function (g) {
    g.stories.forEach(function (ev, i) {
      ev.botoes.forEach(function (botao) {
        // O rótulo embaixo do círculo corta os nomes longos; o nome inteiro
        // fica no hover.
        botao.title = ev.nome;
        botao.addEventListener("click", function () { abrir(g, i, botao); });
      });
    });
  });

  viewer.querySelector(".story-fundo").addEventListener("click", fechar);
  viewer.querySelector(".story-fechar").addEventListener("click", fechar);
  viewer.querySelector(".story-seta.anterior").addEventListener("click", voltar);
  viewer.querySelector(".story-seta.proximo").addEventListener("click", avancar);
  viewer.querySelector(".story-toque.anterior").addEventListener("click", voltar);
  viewer.querySelector(".story-toque.proximo").addEventListener("click", avancar);
  pausar.addEventListener("click", function () { definirPausa(!pausado); });

  // Com a aba em segundo plano a foto não passa sem ninguém ver.
  document.addEventListener("visibilitychange", function () {
    viewer.classList.toggle("oculto", document.hidden);
  });

  document.addEventListener("keydown", function (e) {
    if (viewer.hidden) return;
    if (e.key === "Escape") { fechar(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); avancar(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); voltar(); return; }
    // Espaço pausa — menos quando o foco está num botão ou link, que ele aciona.
    if (e.key === " " && !e.target.closest("button, a")) {
      e.preventDefault();
      definirPausa(!pausado);
      return;
    }
    // O foco não sai do diálogo: Tab dá a volta entre os controles dele que
    // estão à vista — no celular as setas laterais somem, e o link da
    // legenda só existe nos destaques.
    if (e.key === "Tab") {
      var focaveis = Array.prototype.filter.call(viewer.querySelectorAll("button, a[href]"), function (el) {
        return el.offsetParent !== null;
      });
      var primeiro = focaveis[0];
      var ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });
})();
