/**
 * Conceito 2 — galeria de eventos em formato de stories
 *
 * A barra da base da tela tem um círculo por evento; clicar num deles abre
 * o visualizador, que passa as fotos do evento uma a uma, com as barrinhas
 * de progresso no topo, e ao fim segue para o evento seguinte — como nos
 * stories do Instagram.
 *
 * Os eventos não estão aqui: nome, data e fotos de cada um estão no HTML,
 * em <button class="story" data-data="..." data-fotos="a.jpg, b.jpg">. O
 * script só lê a lista.
 *
 * O tempo de cada foto é uma animação CSS da barrinha, e não um timer: o
 * fim da animação é o que avança. Assim pausar é só pausar a animação, e a
 * barra e o avanço nunca se desencontram.
 */
(function () {
  "use strict";

  var barra = document.querySelector(".stories-bar");
  var viewer = document.querySelector(".story-viewer");
  if (!barra || !viewer) return;

  var lista = barra.querySelector(".stories-lista");
  var circulos = Array.prototype.slice.call(barra.querySelectorAll(".story"));
  var rolarAnterior = barra.querySelector(".stories-rolar.anterior");
  var rolarProximo = barra.querySelector(".stories-rolar.proximo");
  var recolher = barra.querySelector(".stories-recolher");

  var foto = viewer.querySelector(".story-foto");
  var desfoque = viewer.querySelector(".story-desfoque");
  var progresso = viewer.querySelector(".story-progresso");
  var titulo = viewer.querySelector("#storyTitulo");
  var dataEvento = viewer.querySelector(".story-data");
  var capa = viewer.querySelector(".story-capa");
  var contador = viewer.querySelector(".story-contador");
  var pausar = viewer.querySelector(".story-pausar");

  var CHAVE_VISTOS = "conceito2-stories-vistos";

  var eventos = circulos.map(function (botao) {
    return {
      botao: botao,
      nome: botao.querySelector(".story-nome").textContent.trim(),
      data: botao.getAttribute("data-data") || "",
      fotos: (botao.getAttribute("data-fotos") || "")
        .split(",")
        .map(function (s) { return s.trim(); })
        .filter(Boolean)
    };
  });

  var atual = -1;      // índice do evento aberto
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
    ev.botao.classList.add("visto");
    var vistos = lerVistos();
    if (vistos.indexOf(ev.nome) === -1) {
      vistos.push(ev.nome);
      try { sessionStorage.setItem(CHAVE_VISTOS, JSON.stringify(vistos)); } catch (e) {}
    }
  }

  var vistosDaSessao = lerVistos();
  eventos.forEach(function (ev) {
    if (vistosDaSessao.indexOf(ev.nome) !== -1) ev.botao.classList.add("visto");
  });

  /* --------------------------------------------------------------------
     Barra: rolagem lateral e recolher
     -------------------------------------------------------------------- */
  function atualizarSetas() {
    var fim = lista.scrollWidth - lista.clientWidth;
    rolarAnterior.disabled = lista.scrollLeft <= 1;
    rolarProximo.disabled = lista.scrollLeft >= fim - 1;
    // Sem nada para rolar, as setas nem aparecem.
    barra.classList.toggle("sem-rolagem", fim <= 1);
  }

  function rolar(sentido) {
    lista.scrollBy({ left: sentido * lista.clientWidth * 0.8, behavior: "smooth" });
  }

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

  function mostrarFoto(indice) {
    var ev = eventos[atual];
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
    var proxima = ev.fotos[indice + 1] || (eventos[atual + 1] && eventos[atual + 1].fotos[0]);
    if (proxima) new Image().src = proxima;
  }

  function abrirEvento(indice, ultimaFoto) {
    var ev = eventos[indice];
    if (!ev || !ev.fotos.length) return;
    atual = indice;
    titulo.textContent = ev.nome;
    dataEvento.textContent = ev.data;
    capa.src = ev.fotos[0];
    montarProgresso(ev.fotos.length);
    marcarVisto(ev);
    mostrarFoto(ultimaFoto ? ev.fotos.length - 1 : 0);
  }

  function avancar() {
    var ev = eventos[atual];
    if (fotoAtual < ev.fotos.length - 1) mostrarFoto(fotoAtual + 1);
    else if (atual < eventos.length - 1) abrirEvento(atual + 1);
    else fechar();
  }

  function voltar() {
    if (fotoAtual > 0) mostrarFoto(fotoAtual - 1);
    else if (atual > 0) abrirEvento(atual - 1, true);
    else mostrarFoto(0); // no primeiro de todos, recomeça a foto
  }

  function definirPausa(valor) {
    pausado = valor;
    viewer.classList.toggle("pausado", pausado);
    pausar.setAttribute("aria-label", pausado ? "Continuar" : "Pausar");
    pausar.querySelector("i").className = "fa-solid " + (pausado ? "fa-play" : "fa-pause");
  }

  function abrir(indice, botao) {
    origem = botao || null;
    viewer.hidden = false;
    document.documentElement.classList.add("story-aberto");
    // Quem pediu menos movimento não recebe fotos passando sozinhas: abre
    // pausado e avança quando quiser.
    definirPausa(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    abrirEvento(indice);
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

  circulos.forEach(function (botao, i) {
    // O rótulo embaixo do círculo corta os nomes longos; o nome inteiro
    // fica no hover.
    botao.title = eventos[i].nome;
    botao.addEventListener("click", function () { abrir(i, botao); });
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
    // Espaço pausa — menos quando o foco está num botão, que ele aciona.
    if (e.key === " " && !e.target.closest("button")) {
      e.preventDefault();
      definirPausa(!pausado);
      return;
    }
    // O foco não sai do diálogo: Tab dá a volta entre os botões dele.
    if (e.key === "Tab") {
      var focaveis = viewer.querySelectorAll("button");
      var primeiro = focaveis[0];
      var ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });

  atualizarSetas();
})();
