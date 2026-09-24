/**
 * Campanha de (re)matrícula 2027 — comportamento da página
 *
 * 1. Menu: marca o link da seção que está na tela, ao clicar e também ao
 *    rolar à mão — o que a referência não fazia —, e desliza a pílula até
 *    ele. A rolagem até a seção é do próprio navegador (âncora + CSS).
 * 2. Palavra do banner que troca.
 * 3. Seletor "Já sou aluno" / "Quero estudar no SESI".
 * 4. CTA flutuante do celular, que aparece quando o banner sai da tela.
 *
 * Sem dependências: a página não carrega Bootstrap nem o main.js do site.
 */
(function () {
  "use strict";

  var nav = document.querySelector(".cm-nav");
  var menu = document.querySelector(".cm-menu");
  var pilula = menu.querySelector(".cm-menu-pilula");
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  var secoes = Array.prototype.slice.call(document.querySelectorAll("[data-secao]"));
  var hero = document.getElementById("inicio");

  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --------------------------------------------------------------------
     1. Menu
     -------------------------------------------------------------------- */
  // A seção diz a qual link pertence: pelo próprio id ou, quando não tem
  // link no menu (a de inscrição), pelo valor de data-secao.
  function linkDa(secao) {
    var alvo = secao.getAttribute("data-secao") || secao.id;
    return menu.querySelector('a[href="#' + alvo + '"]');
  }

  var ativo = null;

  function posicionarPilula() {
    if (!ativo) return;
    // Medido no link, relativo ao menu e somando a rolagem lateral dele:
    // a pílula é filha do menu e rola junto com os links.
    var caixa = menu.getBoundingClientRect();
    var r = ativo.getBoundingClientRect();
    var x = r.left - caixa.left + menu.scrollLeft;
    var y = r.top - caixa.top + menu.scrollTop;
    pilula.style.width = r.width + "px";
    pilula.style.height = r.height + "px";
    pilula.style.transform = "translate(" + x + "px, " + y + "px)";
  }

  function marcar(link) {
    if (!link || link === ativo) return;
    links.forEach(function (l) {
      l.setAttribute("aria-current", l === link ? "true" : "false");
    });
    ativo = link;
    posicionarPilula();

    // No celular o menu rola na horizontal: o link ativo é trazido para o
    // meio da faixa. Em rects, e não com scrollIntoView, que também mexeria
    // na rolagem vertical da página.
    if (menu.scrollWidth > menu.clientWidth) {
      var caixa = menu.getBoundingClientRect();
      var r = link.getBoundingClientRect();
      menu.scrollTo({
        left: menu.scrollLeft + (r.left - caixa.left) - (caixa.width - r.width) / 2,
        behavior: reduzido.matches ? "auto" : "smooth"
      });
    }
  }

  // A seção atual é a última cujo topo já passou de uma linha imaginária
  // um pouco abaixo do menu. No fim da página vale a última de todas: a
  // do rodapé é curta demais para chegar à linha sozinha.
  function secaoNaTela() {
    var linha = nav.offsetHeight + window.innerHeight * 0.3;
    var atual = secoes[0];
    secoes.forEach(function (s) {
      if (s.getBoundingClientRect().top <= linha) atual = s;
    });
    var fim = document.documentElement.scrollHeight - window.innerHeight - 2;
    if (window.scrollY >= fim) atual = secoes[secoes.length - 1];
    return atual;
  }

  // Ao clicar, o link já acende na hora, e a leitura pela rolagem fica em
  // pausa até a página parar: sem isso a pílula passaria por cada seção do
  // caminho até chegar ao destino.
  var travado = false;
  var fimDaRolagem = null;

  function soltarQuandoParar() {
    clearTimeout(fimDaRolagem);
    fimDaRolagem = setTimeout(function () {
      travado = false;
      atualizar();
    }, 150);
  }

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      travado = true;
      marcar(link);
      // Se o destino já estiver na tela não há rolagem, e o timer abaixo é
      // o único que solta a trava.
      soltarQuandoParar();
    });
  });

  var agendado = false;
  function atualizar() {
    agendado = false;
    nav.classList.toggle("rolou", window.scrollY > 4);
    if (!travado) marcar(linkDa(secaoNaTela()));
    atualizarCta();
  }

  window.addEventListener("scroll", function () {
    if (travado) soltarQuandoParar();
    if (!agendado) {
      agendado = true;
      requestAnimationFrame(atualizar);
    }
  }, { passive: true });

  // A altura do menu muda com a largura (no celular ele tem duas linhas):
  // é ela que diz onde as âncoras param, e ela é medida em vez de escrita.
  function medir() {
    document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
    posicionarPilula();
  }
  window.addEventListener("resize", medir);
  // Quem chega por um link com âncora (…/#duvidas) já abre rolado: a seção
  // é relida quando o navegador termina de posicionar a página.
  window.addEventListener("load", atualizar);
  window.addEventListener("hashchange", atualizar);
  // A fonte muda a largura dos rótulos: remedir quando ela chegar.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);

  /* --------------------------------------------------------------------
     2. Palavra do banner
     O leitor de tela lê a frase inteira, que está escrita num span oculto;
     a palavra que troca é só visual.
     -------------------------------------------------------------------- */
  var palavra = document.querySelector(".cm-palavra > span");
  var PALAVRAS = ["transforma", "inspira", "prepara"];
  if (palavra && !reduzido.matches) {
    var i = 0;
    setInterval(function () {
      // Com a aba em segundo plano não há quem veja a troca.
      if (document.hidden) return;
      i = (i + 1) % PALAVRAS.length;
      palavra.classList.remove("entra");
      void palavra.offsetWidth; // reinicia a animação
      palavra.textContent = PALAVRAS[i];
      palavra.classList.add("entra");
    }, 2800);
  }

  /* --------------------------------------------------------------------
     3. Seletor de matrícula
     O padrão de abas do WAI-ARIA: setas trocam de aba, e só a aba ativa
     fica na ordem do Tab.
     -------------------------------------------------------------------- */
  var abas = document.querySelector(".cm-abas");
  var botoesAba = abas ? Array.prototype.slice.call(abas.querySelectorAll('[role="tab"]')) : [];

  function escolherAba(id, focar) {
    botoesAba.forEach(function (b) {
      var sim = b.getAttribute("data-aba") === id;
      b.setAttribute("aria-selected", sim ? "true" : "false");
      b.tabIndex = sim ? 0 : -1;
      document.getElementById(b.getAttribute("aria-controls")).hidden = !sim;
      if (sim && focar) b.focus();
    });
    abas.setAttribute("data-ativa", id);
  }

  botoesAba.forEach(function (b, n) {
    b.addEventListener("click", function () { escolherAba(b.getAttribute("data-aba")); });
    b.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var prox = botoesAba[(n + (e.key === "ArrowRight" ? 1 : -1) + botoesAba.length) % botoesAba.length];
      escolherAba(prox.getAttribute("data-aba"), true);
    });
  });

  // Links de fora que já chegam com a aba escolhida — "Já sou aluno" no
  // banner abre a seção direto na rematrícula.
  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[data-aba]");
    if (link && abas) escolherAba(link.getAttribute("data-aba"));
  });

  /* --------------------------------------------------------------------
     4. CTA flutuante (celular)
     Some enquanto o banner — que tem o próprio botão — está na tela, e
     também na seção de inscrição, para onde ele leva.
     -------------------------------------------------------------------- */
  var inscricao = document.getElementById("inscricao");
  function atualizarCta() {
    var passouDoBanner = hero.getBoundingClientRect().bottom < 0;
    var r = inscricao.getBoundingClientRect();
    var naInscricao = r.top < window.innerHeight && r.bottom > 0;
    document.body.classList.toggle("cta-visivel", passouDoBanner && !naInscricao);
  }

  /* --------------------------------------------------------------------
     Estado inicial
     -------------------------------------------------------------------- */
  // A primeira posição da pílula é sem transição: senão ela nasceria no
  // canto e deslizaria até o primeiro link na abertura da página.
  pilula.style.transition = "none";
  medir();
  atualizar();
  void pilula.offsetWidth;
  pilula.style.transition = "";
  menu.classList.add("pronto");
})();
