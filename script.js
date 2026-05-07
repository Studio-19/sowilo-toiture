(function () {
  'use strict';

  // ===== Navbar scroll state =====
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const links = navLinks.querySelectorAll('a');

  const onScroll = () => {
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ===== Mobile menu =====
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Ouvrir le menu');
      }
    });
  });

  // ===== Active link highlighting via IntersectionObserver =====
  const sections = document.querySelectorAll('main section[id]');
  const linkMap = {};
  links.forEach(l => {
    const id = l.getAttribute('href').replace('#', '');
    linkMap[id] = l;
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const id = entry.target.id;
        if (linkMap[id]) linkMap[id].classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => sectionObserver.observe(s));

  // ===== Reveal on scroll =====
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || (i * 80);
        setTimeout(() => el.classList.add('is-visible'), delay);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  // ===== Contact form validation =====
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  const validators = {
    firstname: v => v.trim().length >= 2 || 'Veuillez entrer votre prénom (2 caractères min).',
    lastname:  v => v.trim().length >= 2 || 'Veuillez entrer votre nom (2 caractères min).',
    email:     v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Adresse email invalide.',
    phone:     v => /^[+0-9 ().-]{7,}$/.test(v.trim()) || 'Numéro de téléphone invalide.',
    subject:   v => v !== '' || 'Veuillez choisir un service.',
    message:   v => v.trim().length >= 10 || 'Message trop court (10 caractères min).'
  };

  const setError = (name, msg) => {
    const el = form.querySelector('[data-error-for="' + name + '"]');
    if (el) el.textContent = msg || '';
  };

  Object.keys(validators).forEach(name => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener('blur', () => {
      const result = validators[name](field.value);
      setError(name, result === true ? '' : result);
    });
    field.addEventListener('input', () => setError(name, ''));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    Object.keys(validators).forEach(name => {
      const field = form.elements[name];
      if (!field) return;
      const result = validators[name](field.value);
      if (result !== true) {
        setError(name, result);
        valid = false;
      } else {
        setError(name, '');
      }
    });

    if (!valid) {
      status.textContent = 'Veuillez corriger les erreurs ci-dessus.';
      status.className = 'form-status is-visible';
      status.style.background = 'rgba(255, 107, 107, 0.1)';
      status.style.borderColor = 'rgba(255, 107, 107, 0.4)';
      status.style.color = '#ff8a8a';
      return;
    }

    const firstname = form.elements.firstname.value.trim();
    status.removeAttribute('style');
    status.className = 'form-status success is-visible';
    status.textContent = 'Merci ' + firstname + ' ! Votre message a bien été envoyé. Nous vous répondrons rapidement.';
    form.reset();

    setTimeout(() => {
      status.classList.remove('is-visible');
    }, 6000);
  });

  // ===== Services mobile carousel dots =====
  const servicesGrid = document.querySelector('.services-grid');
  const servicesDots = document.getElementById('services-dots');
  if (servicesGrid && servicesDots) {
    const cards = Array.from(servicesGrid.querySelectorAll('.service-card'));
    cards.forEach((card, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'services-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Aller au service ' + (i + 1));
      dot.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      servicesDots.appendChild(dot);
    });

    const dots = Array.from(servicesDots.children);
    const setActive = (idx) => {
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };
    setActive(0);

    const cardObserver = new IntersectionObserver((entries) => {
      let best = null;
      entries.forEach(entry => {
        if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
      });
      if (best && best.isIntersecting) {
        setActive(cards.indexOf(best.target));
      }
    }, { root: servicesGrid, threshold: [0.5, 0.75, 1] });

    cards.forEach(c => cardObserver.observe(c));
  }

  // ===== Compare slider (avant / après) =====
  document.querySelectorAll('.compare').forEach(initCompare);

  function initCompare(root) {
    const handle = root.querySelector('.compare-handle');
    if (!handle) return;

    let dragging = false;

    const setPos = (pct) => {
      const clamped = Math.max(0, Math.min(100, pct));
      root.style.setProperty('--compare-pos', clamped + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(clamped)));
    };

    const posFromEvent = (e) => {
      const rect = root.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return (x / rect.width) * 100;
    };

    const onDown = (e) => {
      dragging = true;
      root.classList.add('is-dragging');
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!dragging) return;
      setPos(posFromEvent(e));
      e.preventDefault();
    };

    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    // Drag only when finger/mouse is on the handle — leaves the image free for page scroll on mobile.
    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);

    // Keyboard accessibility
    handle.addEventListener('keydown', (e) => {
      const current = parseFloat(getComputedStyle(root).getPropertyValue('--compare-pos')) || 50;
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft')  { setPos(current - step); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPos(current + step); e.preventDefault(); }
      if (e.key === 'Home')       { setPos(0);   e.preventDefault(); }
      if (e.key === 'End')        { setPos(100); e.preventDefault(); }
    });
  }
})();
