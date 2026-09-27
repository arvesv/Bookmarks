(function () {
  'use strict';

  // State
  let bookmarksData = null;
  let activeCategory = 'all';
  let activeTag = null;
  let searchQuery = '';

  // DOM Elements
  const siteTitleEl = document.getElementById('siteTitle');
  const siteSubtitleEl = document.getElementById('siteSubtitle');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const navFiltersEl = document.getElementById('navFilters');
  const bookmarksContainer = document.getElementById('bookmarksContainer');
  const countStatsEl = document.getElementById('countStats');
  const activeFilterInfoEl = document.getElementById('activeFilterInfo');
  const emptyStateEl = document.getElementById('emptyState');
  const alertBannerEl = document.getElementById('alertBanner');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconEl = document.getElementById('themeIcon');

  // SVG Icons
  const ICONS = {
    external: `<svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    copy: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    check: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    sun: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    clicks: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 15l6 6m-6-6v4.5m0-4.5h4.5M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path></svg>`,
    bookmarkFallback: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk0YTNiOCI+PHBhdGggZD0iTTE5IDIxbC03LTUtNyA1VjVhMiAyIDAgMCAxIDItMmgxMGEyIDIgMCAwIDEgMiAyeiIvPjwvc3ZnPg=='
  };

  // Theme Management
  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      updateThemeIcon(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeIcon('dark');
    } else {
      updateThemeIcon('light');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    if (themeIconEl) {
      themeIconEl.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    }
  }

  // Load Bookmarks JSON
  async function loadBookmarks() {
    try {
      const response = await fetch('./bookmarks.json');
      if (!response.ok) {
        throw new Error(`Failed to load bookmarks.json (${response.status} ${response.statusText})`);
      }
      bookmarksData = await response.json();
      renderApp();
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      showAlert(
        `Unable to load <code>bookmarks.json</code>. If viewing this file directly from the filesystem (<code>file://</code>), ` +
        `browsers restrict fetch requests for security. Please serve with a local web server (e.g., <code>npx serve</code>, VS Code Live Server, or Python HTTP server) ` +
        `or view via GitHub Pages.`
      );
    }
  }

  function showAlert(message) {
    if (alertBannerEl) {
      alertBannerEl.innerHTML = message;
      alertBannerEl.style.display = 'block';
    }
  }

  function getDomain(urlStr) {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return urlStr;
    }
  }

  function getFaviconUrl(urlStr) {
    try {
      const parsed = new URL(urlStr);
      return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
    } catch {
      return ICONS.bookmarkFallback;
    }
  }

  // Render Full Application
  function renderApp() {
    if (!bookmarksData) return;

    // Set page header
    if (bookmarksData.title && siteTitleEl) {
      siteTitleEl.textContent = bookmarksData.title;
      document.title = bookmarksData.title;
    }
    if (bookmarksData.subtitle && siteSubtitleEl) {
      siteSubtitleEl.textContent = bookmarksData.subtitle;
    }

    renderCategoryFilters();
    renderBookmarks();
  }

  // Render Category Navigation Tabs
  function renderCategoryFilters() {
    if (!navFiltersEl || !bookmarksData.categories) return;

    let totalCount = 0;
    bookmarksData.categories.forEach(cat => {
      totalCount += (cat.bookmarks || []).length;
    });

    let navHtml = `
      <button class="filter-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
        <span>All</span>
        <span class="filter-badge">${totalCount}</span>
      </button>
    `;

    bookmarksData.categories.forEach(cat => {
      const count = (cat.bookmarks || []).length;
      navHtml += `
        <button class="filter-btn ${activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
          <span>${cat.icon || '📁'} ${escapeHtml(cat.name)}</span>
          <span class="filter-badge">${count}</span>
        </button>
      `;
    });

    navFiltersEl.innerHTML = navHtml;

    navFiltersEl.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-category');
        renderCategoryFilters();
        renderBookmarks();
      });
    });
  }

  // Filter Bookmarks
  function getFilteredData() {
    if (!bookmarksData || !bookmarksData.categories) return [];

    const query = searchQuery.trim().toLowerCase();

    return bookmarksData.categories.map(cat => {
      // Filter by category
      if (activeCategory !== 'all' && cat.id !== activeCategory) {
        return { ...cat, bookmarks: [] };
      }

      const filteredLinks = (cat.bookmarks || []).filter(item => {
        // Tag filter
        if (activeTag && !(item.tags && item.tags.includes(activeTag))) {
          return false;
        }

        // Search query filter
        if (query) {
          const matchTitle = item.title && item.title.toLowerCase().includes(query);
          const matchDesc = item.description && item.description.toLowerCase().includes(query);
          const matchUrl = item.url && item.url.toLowerCase().includes(query);
          const matchTag = item.tags && item.tags.some(t => t.toLowerCase().includes(query));
          const matchCat = cat.name && cat.name.toLowerCase().includes(query);

          if (!matchTitle && !matchDesc && !matchUrl && !matchTag && !matchCat) {
            return false;
          }
        }

        return true;
      });

      return {
        ...cat,
        bookmarks: filteredLinks
      };
    }).filter(cat => cat.bookmarks.length > 0);
  }

  // Render Bookmark Cards
  function renderBookmarks() {
    if (!bookmarksContainer) return;

    const filtered = getFilteredData();
    let totalShown = 0;
    filtered.forEach(c => totalShown += c.bookmarks.length);

    // Update stats bar
    let totalAll = 0;
    bookmarksData.categories.forEach(c => totalAll += (c.bookmarks || []).length);
    if (countStatsEl) {
      countStatsEl.textContent = `Showing ${totalShown} of ${totalAll} links`;
    }

    // Active filter pill info
    if (activeFilterInfoEl) {
      if (activeTag) {
        activeFilterInfoEl.innerHTML = `
          <span class="active-filter-indicator">
            Tag: #${escapeHtml(activeTag)}
            <a class="reset-filter-link" id="clearTagFilter" href="javascript:void(0)">(clear)</a>
          </span>
        `;
        document.getElementById('clearTagFilter')?.addEventListener('click', () => {
          activeTag = null;
          renderBookmarks();
        });
      } else {
        activeFilterInfoEl.innerHTML = '';
      }
    }

    if (totalShown === 0) {
      bookmarksContainer.innerHTML = '';
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';

    let html = '';

    filtered.forEach(category => {
      html += `
        <section class="category-section" id="cat-${category.id}">
          <div class="category-header">
            <span class="category-icon">${category.icon || '📁'}</span>
            <h2 class="category-title">${escapeHtml(category.name)}</h2>
            <span class="category-count">(${category.bookmarks.length})</span>
          </div>
          <div class="bookmarks-grid">
      `;

      category.bookmarks.forEach(bm => {
        const domain = getDomain(bm.url);
        const favicon = getFaviconUrl(bm.url);
        const baseClicks = typeof bm.clicks === 'number' ? bm.clicks : 0;
        const localClicks = parseInt(localStorage.getItem('clicks_' + bm.url) || '0', 10);
        const totalClicks = baseClicks + localClicks;

        html += `
          <div class="bookmark-card">
            <a class="bookmark-link" href="${escapeHtml(bm.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; color:inherit; display:block; flex:1;">
              <div class="bookmark-top">
                <img class="bookmark-favicon" src="${escapeHtml(favicon)}" alt="" loading="lazy" />
                <div class="bookmark-title-wrap">
                  <div class="bookmark-title">
                    <span>${escapeHtml(bm.title)}</span>
                    ${ICONS.external}
                  </div>
                  <div class="bookmark-domain">${escapeHtml(domain)}</div>
                </div>
              </div>
              <p class="bookmark-description">${escapeHtml(bm.description || '')}</p>
            </a>
            <div class="bookmark-footer">
              <div class="tags-list">
                ${(bm.tags || []).map(t => `
                  <button type="button" class="tag-badge ${activeTag === t ? 'active' : ''}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>
                `).join('')}
              </div>
              <div class="bookmark-actions">
                <span class="clicks-badge" title="Clicked ${totalClicks} time${totalClicks === 1 ? '' : 's'}">
                  ${ICONS.clicks}
                  <span class="clicks-count" data-url="${escapeHtml(bm.url)}" data-base="${baseClicks}">${totalClicks}</span>
                </span>
                <button type="button" class="copy-btn" data-url="${escapeHtml(bm.url)}" title="Copy link to clipboard">
                  ${ICONS.copy}
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </section>
      `;
    });

    bookmarksContainer.innerHTML = html;

    // Attach Link Click Handlers to increment and persist clicks locally
    bookmarksContainer.querySelectorAll('.bookmark-link').forEach(link => {
      link.addEventListener('click', () => {
        const url = link.getAttribute('href');
        const currentLocal = parseInt(localStorage.getItem('clicks_' + url) || '0', 10);
        const nextLocal = currentLocal + 1;
        localStorage.setItem('clicks_' + url, nextLocal);
        const counterEl = link.closest('.bookmark-card')?.querySelector('.clicks-count');
        if (counterEl) {
          const base = parseInt(counterEl.getAttribute('data-base') || '0', 10);
          const updated = base + nextLocal;
          counterEl.textContent = updated;
          const badge = counterEl.closest('.clicks-badge');
          if (badge) {
            badge.title = `Clicked ${updated} time${updated === 1 ? '' : 's'}`;
          }
        }
      });
    });

    // Attach Tag Click Handlers
    bookmarksContainer.querySelectorAll('.tag-badge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = btn.getAttribute('data-tag');
        activeTag = activeTag === tag ? null : tag;
        renderBookmarks();
      });
    });

    // Attach Copy Link Handlers
    bookmarksContainer.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        try {
          await navigator.clipboard.writeText(url);
          btn.innerHTML = ICONS.check;
          setTimeout(() => {
            btn.innerHTML = ICONS.copy;
          }, 1500);
        } catch {
          // Fallback prompt if clipboard API blocked
          prompt('Copy link:', url);
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
        }
        renderBookmarks();
      });
    }

    // Clear Search
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchQuery = '';
          clearSearchBtn.style.display = 'none';
          searchInput.focus();
          renderBookmarks();
        }
      });
    }

    // Theme Toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Favicon Fallback Handler
    if (bookmarksContainer) {
      bookmarksContainer.addEventListener('error', (e) => {
        if (e.target && e.target.classList.contains('bookmark-favicon')) {
          e.target.src = ICONS.bookmarkFallback;
        }
      }, true);
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      } else if (e.key === 'Escape') {
        if (searchInput && (searchInput.value || document.activeElement === searchInput)) {
          searchInput.value = '';
          searchQuery = '';
          if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          searchInput.blur();
          renderBookmarks();
        }
      }
    });
  }

  // Initialization
  initTheme();
  setupEventListeners();
  loadBookmarks();
})();
