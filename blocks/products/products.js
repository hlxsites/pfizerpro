const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const P_BRAND_NAME = 'Brand Name';
const P_GENERIC_NAME = 'Generic Name';

/** @param {Response} response */
async function toJson(response) {
  return response.json();
}

/** @param {any} any */
async function getData(any) {
  return Promise.resolve(any.data);
}
/**
 * @param {string} brandName
 * @param {any[]} links
 */
function getLinksForBrandName(brandName, linksToSearch) {
  if (linksToSearch && linksToSearch.length) {
    return linksToSearch
      .filter((l) => l[P_BRAND_NAME] === brandName)
      .map((l) => {
        delete l[P_BRAND_NAME];
        return l;
      });
  }
  return [];
}

const productsPromise = fetch('products.json?sheet=products')
  .then(toJson)
  .then(getData);

const linksPromise = fetch('products.json?sheet=product-links')
  .then(toJson)
  .then(getData);

async function getProductsWithLinks() {
  return Promise.all([productsPromise, linksPromise]).then(
    ([products, links]) => products.map((p) => {
      p.links = getLinksForBrandName(p[P_BRAND_NAME], links);
      return p;
    }),
  );
  // TODO:  handle error somehow
  // .catch((err) => {
  //  console.error(err);
  // });
}

/**
 *
 * @param {string} name
 * @param {string} className
 */
function element(name, className) {
  const el = document.createElement(name);
  el.className = className;
  return el;
}

/**
 * @param {String} letter
 * @returns {Element}
 */
function letterHeader(letter) {
  const header = element('header', 'products-group-header');
  const h2 = element('h2', 'products-group-header-letter');
  h2.setAttribute('data-letter', letter);
  h2.textContent = letter;
  header.append(h2);
  return header;
}

/**
 *
 * @param {any} item
 */
function productArticle(product) {
  const parent = element('article', 'product-article');
  const header = element('header', 'product-article-header');

  const title = element('h3', 'product-article-title');
  title.textContent = product[P_BRAND_NAME];

  const description = element('p', 'product-article-description');
  description.textContent = product[P_GENERIC_NAME];

  const links = element('ul', 'product-article-links');
  if (product.links && product.links.length) {
    product.links
      .map((l) => {
        const li = element('li', 'product-article-link');
        const a = element('a', '');
        a.textContent = l.Text;
        a.href = l.URL;
        a.target = '_blank';
        li.append(a);
        return li;
      })
      .forEach((li) => links.append(li));
  }

  header.append(title);
  header.append(description);
  parent.append(header);
  parent.append(links);

  return parent;
}

/**
 *
 * @param {any[]} groupProducts
 */
function productArticles(products) {
  const wrapper = document.createElement('div');
  wrapper.className = 'product-articles';

  products.map((p) => productArticle(p)).forEach((pa) => wrapper.append(pa));

  return wrapper;
}

function productNameStartsWithLetter(product, letter) {
  // filter products by first letter
  const brandNameUpper = product[P_BRAND_NAME].toUpperCase();
  const letterUpper = letter.toUpperCase();
  return brandNameUpper.startsWith(letterUpper);
}

function getProductsStartingWithLetter(products, letter) {
  return products
    .filter((p) => productNameStartsWithLetter(p, letter))
    .sort((a, b) => {
      // alphabitical sort on brand name
      const aBrand = a[P_BRAND_NAME];
      const bBrand = b[P_BRAND_NAME];
      if (aBrand < bBrand) return -1;
      if (aBrand > bBrand) return 1;
      return 0;
    });
}

/**
 * @param {string} letter
 * @param {any[]} products
 * @returns {Element} group
 */
function letterProductGroup(products, letter) {
  const groupProducts = getProductsStartingWithLetter(products, letter);
  if (!groupProducts.length) return undefined;

  const article = document.createElement('div');
  article.className = 'product-group padded-section';
  article.append(letterHeader(letter));
  article.append(productArticles(groupProducts));
  return article;
}

function alphabitGlossary(products, block) {
  const glossaryContainer = element('div', 'product-glossary-container');
  const glossary = element('div', 'product-glossary');
  LETTERS.split('')
    .map((l) => {
      const active = !!products.filter((p) => productNameStartsWithLetter(p, l))
        .length;
      const button = element('button', 'product-glossary-button');
      button.setAttribute('data-button-letter', l);
      button.disabled = !active;
      button.textContent = l;
      return button;
    })
    .forEach((b) => glossary.append(b));

  function deactivateAllLetterButtons() {
    const activeButtons = block.querySelectorAll(
      '.product-glossary-button.active',
    );
    Array.from(activeButtons).forEach((activeButton) => {
      activeButton.classList.remove('active');
    });
  }

  function activateLetteButton(letter) {
    deactivateAllLetterButtons();
    const activeButton = block.querySelector(
      `[data-button-letter="${letter}"]`,
    );
    activeButton.classList.add('active');
    activeButton.parentElement.scrollLeft = activeButton.offsetLeft - window.innerWidth / 2 + 30;
  }

  const letterObserver = new IntersectionObserver(
    ([e]) => {
      if (e.intersectionRatio === 0) return;
      const letter = e.target.getAttribute('data-letter');
      activateLetteButton(letter);
    },
    { threshold: [0.5], rootMargin: '0px 0px -60% 0px' },
  );

  const letterTitles = block.querySelectorAll('[data-letter]');

  function toggleLetterObservers(shouleObserve) {
    Array.from(letterTitles).forEach((title) => {
      if (shouleObserve) {
        letterObserver.observe(title);
      } else letterObserver.unobserve(title);
    });
  }
  toggleLetterObservers(true);

  const observer = new IntersectionObserver(
    ([e]) => e.target.classList.toggle('is-pinned', e.intersectionRatio < 1),
    { threshold: [1] },
  );
  observer.observe(glossaryContainer);

  const buttons = glossary.querySelectorAll(
    '.product-glossary-button:not(:disabled)',
  );
  Array.from(buttons).forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const letter = button.textContent;
      activateLetteButton(letter);
      toggleLetterObservers(false);
      block.querySelector(`[data-letter="${letter}"]`).scrollIntoView();
      setTimeout(() => toggleLetterObservers(true), 0);
    });
  });

  glossaryContainer.append(glossary);
  return glossaryContainer;
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const productsWithLinks = await getProductsWithLinks();
  LETTERS.split('')
    .map((letter) => letterProductGroup(productsWithLinks, letter))
    .filter(Boolean)
    .map((pg) => block.append(pg));

  block.prepend(alphabitGlossary(productsWithLinks, block));
}
