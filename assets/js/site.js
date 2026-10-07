(() => {
  const button = document.querySelector('.menu-button');
  const menu = document.getElementById('mobileMenu');

  if (!button || !menu) return;

  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '메뉴 열기');
    menu.hidden = true;
  };

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    button.setAttribute('aria-label', open ? '메뉴 열기' : '메뉴 닫기');
    menu.hidden = open;
  });

  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
})();