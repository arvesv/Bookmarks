(function () {
  'use strict';

  // State
  let rawBookmarks = [];
  let searchQuery = '';

  // DOM Elements
  const mobileSiteTitleEl = document.getElementById('mobileSiteTitle');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const mobileClearSearchBtn = document.getElementById('mobileClearSearchBtn');
  const mobileBookmarksList = document.getElementById('mobileBookmarksList');
  const mobileCountStats = document.getElementById('mobileCountStats');
  const mobileEmptyState = document.getElementById('mobileEmptyState');
  const mobileAlertBanner = document.getElementById('mobileAlertBanner');

  // SVG Icons
  const ICONS = {
    external: `<svg class="external-icon" style="opacity:0.6; width:12px; height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    copy: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    bookmarkFallback: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk0YTNiOCI+PHBhdGggZD0iTTE5IDIxbC03LTUtNyA1VjVhMiAyIDAgMCAxIDItMmgxMGEyIDIgMCAwIDEgMiAyeiIvPjwvc3ZnPg=='
  };

  // Helper Functions
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getClicks(url, baseClicks) {
    const base = typeof baseClicks === 'number' ? baseClicks : 0;
    const local = parseInt(localStorage.getItem('clicks_' + url) || '0', 10);
    return base + local;
  }

  // Load Bookmarks JSON
  async function loadBookmarks() {
    try {
      const response = await fetch('./bookmarks.json');
      if (!response.ok) {
        throw new Error(`Failed to load bookmarks.json (${response.status} ${response.statusText})`);
      }
      const data = await response.json();
      
      if (data.title && mobileSiteTitleEl) {
        mobileSiteTitleEl.textContent = data.title;
        document.title = `${data.title} - Most Clicked`;
      }

      // Flatten bookmarks into single array with category info
      rawBookmarks = [];
      (data.categories || []).forEach(cat => {
        (cat.bookmarks || []).forEach(bm => {
          rawBookmarks.push({
            ...bm,
            categoryName: cat.name,
            categoryIcon: cat.icon || '📁'
          });
        });
      });

      renderList();
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      if (mobileAlertBanner) {
        mobileAlertBanner.innerHTML = `Unable to load bookmarks. Please ensure the site is running via a web server.`;
        mobileAlertBanner.style.display = 'block';
      }
    }
  }

  // Filter & Sort Bookmarks
  function getFilteredAndSortedBookmarks() {
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter
    const filtered = rawBookmarks.filter(item => {
      if (!query) return true;

      const matchTitle = item.title && item.title.toLowerCase().includes(query);
      const matchDesc = item.description && item.description.toLowerCase().includes(query);
      const matchUrl = item.url && item.url.toLowerCase().includes(query);
      const matchTag = item.tags && item.tags.some(t => t.toLowerCase().includes(query));
      const matchCat = item.categoryName && item.categoryName.toLowerCase().includes(query);

      return matchTitle || matchDesc || matchUrl || matchTag || matchCat;
    });

    // 2. Sort by total clicks descending (most clicked on top)
    filtered.sort((a, b) => {
      const clicksA = getClicks(a.url, a.clicks);
      const clicksB = getClicks(b.url, b.clicks);

      if (clicksB !== clicksA) {
        return clicksB - clicksA; // Highest clicks first
      }

      // Secondary sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });

    return filtered;
  }

  // Render Mobile Bookmarks List
  function renderList() {
    if (!mobileBookmarksList) return;

    const list = getFilteredAndSortedBookmarks();
    const totalAll = rawBookmarks.length;

    if (mobileCountStats) {
      mobileCountStats.textContent = searchQuery
        ? `Found ${list.length} of ${totalAll} bookmarks`
        : `Showing all ${list.length} bookmarks`;
    }

    if (list.length === 0) {
      mobileBookmarksList.innerHTML = '';
      if (mobileEmptyState) mobileEmptyState.style.display = 'block';
      return;
    }

    if (mobileEmptyState) mobileEmptyState.style.display = 'none';

    let html = '';
    list.forEach((bm, index) => {
      const domain = getDomain(bm.url);
      const favicon = getFaviconUrl(bm.url);
      const totalClicks = getClicks(bm.url, bm.clicks);
      const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
      const hasClicksClass = totalClicks > 0 ? 'has-clicks' : '';

      html += `
        <li class="mobile-bookmark-item">
          <a class="mobile-item-link" href="${escapeHtml(bm.url)}" target="_blank" rel="noopener noreferrer">
            <span class="mobile-rank ${rankClass}">#${index + 1}</span>
            <img class="mobile-favicon" src="${escapeHtml(favicon)}" alt="" loading="lazy" />
            <div class="mobile-item-content">
              <div class="mobile-item-title-row">
                <span class="mobile-item-title">${escapeHtml(bm.title)}</span>
                ${ICONS.external}
              </div>
              <div class="mobile-item-meta">
                <span class="mobile-domain">${escapeHtml(domain)}</span>
                <span class="mobile-category-tag">${bm.categoryIcon} ${escapeHtml(bm.categoryName)}</span>
              </div>
            </div>
            <span class="mobile-clicks-badge ${hasClicksClass}" title="${totalClicks} clicks">
              🔥 <span class="clicks-value" data-url="${escapeHtml(bm.url)}" data-base="${bm.clicks || 0}">${totalClicks}</span>
            </span>
          </a>
          <button type="button" class="mobile-copy-btn" data-url="${escapeHtml(bm.url)}" title="Copy link" aria-label="Copy link to ${escapeHtml(bm.title)}">
            ${ICONS.copy}
          </button>
        </li>
      `;
    });

    mobileBookmarksList.innerHTML = html;

    // Attach click listener to increment clicks locally
    mobileBookmarksList.querySelectorAll('.mobile-item-link').forEach(link => {
      link.addEventListener('click', () => {
        const url = link.getAttribute('href');
        const currentLocal = parseInt(localStorage.getItem('clicks_' + url) || '0', 10);
        const nextLocal = currentLocal + 1;
        localStorage.setItem('clicks_' + url, nextLocal);

        // Update badge in-place immediately
        const counterEl = link.querySelector('.clicks-value');
        if (counterEl) {
          const base = parseInt(counterEl.getAttribute('data-base') || '0', 10);
          const updated = base + nextLocal;
          counterEl.textContent = updated;
          const badge = counterEl.closest('.mobile-clicks-badge');
          if (badge) {
            badge.classList.add('has-clicks');
            badge.title = `${updated} clicks`;
          }
        }
      });
    });

    // Attach copy button handlers
    mobileBookmarksList.querySelectorAll('.mobile-copy-btn').forEach(btn => {
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
          prompt('Copy link:', url);
        }
      });
    });
  }

  // Setup Event Listeners
  function setupEventListeners() {
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (mobileClearSearchBtn) {
          mobileClearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
        }
        renderList();
      });
    }

    if (mobileClearSearchBtn) {
      mobileClearSearchBtn.addEventListener('click', () => {
        if (mobileSearchInput) {
          mobileSearchInput.value = '';
          searchQuery = '';
          mobileClearSearchBtn.style.display = 'none';
          mobileSearchInput.focus();
          renderList();
        }
      });
    }

    // Favicon Fallback Error Handler
    if (mobileBookmarksList) {
      mobileBookmarksList.addEventListener('error', (e) => {
        if (e.target && e.target.classList.contains('mobile-favicon')) {
          e.target.src = ICONS.bookmarkFallback;
        }
      }, true);
    }
  }

  // Load Version Metadata
  async function loadVersion() {
    const versionBadgeEl = document.getElementById('versionBadge');
    if (!versionBadgeEl) return;

    try {
      const res = await fetch('./version.json');
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      const version = data.version || data.tag || '';
      const sha = data.sha || (data.fullSha ? data.fullSha.slice(0, 7) : '');
      const url = data.commitUrl || (sha ? `https://github.com/arvesv/Bookmarks/commit/${data.fullSha || sha}` : '#');

      let html = '';
      if (version) {
        html += `<span class="version-tag">${escapeHtml(version)}</span>`;
      }
      if (version && sha) {
        html += `<span class="version-dot">&bull;</span>`;
      }
      if (sha) {
        html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="View commit on GitHub">#${escapeHtml(sha)}</a>`;
      }

      if (html) {
        versionBadgeEl.innerHTML = html;
        versionBadgeEl.style.display = 'inline-flex';
      }
    } catch {
      // Ignore if version.json is missing or inaccessible in local testing
    }
  }

  // Initialization
  setupEventListeners();
  loadBookmarks();
  loadVersion();
})();
