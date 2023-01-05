export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'cards-card-wrapper';
    cardWrapper.innerHTML = row.innerHTML;
    [...cardWrapper.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    li.append(cardWrapper);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
  block.classList.add('cards');
}
