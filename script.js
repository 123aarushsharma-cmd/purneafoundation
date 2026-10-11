/**
 * THE NOTICEBOARD — PURNEA REBIRTH FOUNDATION
 * Interactive Scripts, Filtering, Search, & Gemini AI Assistant
 */

document.addEventListener('DOMContentLoaded', () => {
  // ===== NAVBAR MOBILE TOGGLE =====
  const navToggle = document.getElementById('navToggle');
  const navCloseBtn = document.getElementById('navCloseBtn');
  const mainNav = document.getElementById('mainNav');

  function toggleMobileNav(open) {
    if (!mainNav) return;
    if (open) {
      mainNav.classList.add('is-open');
      if (navToggle) navToggle.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    } else {
      mainNav.classList.remove('is-open');
      if (navToggle) navToggle.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.contains('is-open');
      toggleMobileNav(!isOpen);
    });
  }

  if (navCloseBtn) {
    navCloseBtn.addEventListener('click', () => toggleMobileNav(false));
  }

  // Close mobile nav when clicking any nav link without dropdown
  if (mainNav) {
    mainNav.querySelectorAll('a:not(.nav-dropdown-trigger)').forEach(link => {
      link.addEventListener('click', () => toggleMobileNav(false));
    });
  }

  // ===== RESPONSIVE SUBMENU TOGGLE =====
  document.querySelectorAll('.nav-dropdown-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth > 860) return; // Desktop relies on CSS hover
      e.preventDefault();
      const parent = trigger.closest('.nav-dropdown');
      
      // Close other dropdowns
      document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        if (dropdown !== parent) {
          dropdown.classList.remove('is-open');
        }
      });

      parent.classList.toggle('is-open');
    });
  });

  // Close dropdowns if clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 860 && !e.target.closest('.nav-dropdown') && !e.target.closest('#navToggle')) {
      document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        dropdown.classList.remove('is-open');
      });
    }
  });

  // ===== HORIZONTAL SCROLL TICKER =====
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }

  // ===== POST BOARD FUNCTIONALITY =====
  let allPosts = [];
  let activeFilter = 'All';
  let searchQuery = '';

  const postGrid = document.getElementById('postGrid');
  const filterBar = document.getElementById('filterBar');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const liveSearchInput = document.getElementById('liveSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  // Load opportunity posts
  if (window.postsData && Array.isArray(window.postsData)) {
    initializeBoard(window.postsData);
  } else {
    fetch('posts.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(posts => initializeBoard(posts))
      .catch(err => {
        console.error('Failed to load posts:', err);
        if (postGrid) {
          postGrid.innerHTML = `<p class="empty-state">Couldn't load listings right now. Please try again later.</p>`;
        }
      });
  }

  function initializeBoard(posts) {
    allPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    buildFilters(allPosts);
    renderDaily(allPosts);
    renderPosts();
  }

  // Generate dynamic category chips
  function buildFilters(posts) {
    if (!filterBar) return;

    const categories = [
      'All',
      'Internships',
      'Moot Court Competition',
      'Scholarship/Fellowship',
      'Conferences/Seminars',
      'Certificate Courses',
      'Call for Papers',
      'Call for Chapters',
      'Jobs',
      'Management',
      'Scopus',
      'Entrepreneurship'
    ];

    filterBar.innerHTML = '';
    categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `filter-chip ${cat === activeFilter ? 'is-active' : ''}`;
      chip.dataset.filter = cat;
      chip.innerHTML = getCategoryIcon(cat) + ' ' + cat;
      filterBar.appendChild(chip);
    });

    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      
      activeFilter = chip.dataset.filter;
      renderPosts();
    });
  }

  function getCategoryIcon(cat) {
    switch (cat) {
      case 'All': return '<i class="fa-solid fa-layer-group"></i>';
      case 'Internships': return '<i class="fa-solid fa-user-graduate"></i>';
      case 'Moot Court Competition': return '<i class="fa-solid fa-scale-balanced"></i>';
      case 'Scholarship/Fellowship': return '<i class="fa-solid fa-award"></i>';
      case 'Conferences/Seminars': return '<i class="fa-solid fa-microphone"></i>';
      case 'Certificate Courses': return '<i class="fa-solid fa-certificate"></i>';
      case 'Call for Papers': return '<i class="fa-solid fa-file-lines"></i>';
      case 'Call for Chapters': return '<i class="fa-solid fa-book-bookmark"></i>';
      case 'Jobs': return '<i class="fa-solid fa-briefcase"></i>';
      case 'Management': return '<i class="fa-solid fa-chart-line"></i>';
      case 'Scopus': return '<i class="fa-solid fa-book-open"></i>';
      case 'Entrepreneurship': return '<i class="fa-solid fa-lightbulb"></i>';
      default: return '<i class="fa-solid fa-tag"></i>';
    }
  }

  // Calculate remaining days
  function daysLeft(deadline) {
    const today = new Date(); // Live date calculation
    const end = new Date(deadline);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Format date presentation
  function formatDate(dateStr) {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Basic XSS defense
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Render Daily Opportunity
  function renderDaily(posts) {
    const dailyInner = document.getElementById('dailyInner');
    if (!dailyInner) return;

    const pick = posts.find(p => p.daily) || posts[0];
    if (!pick) {
      dailyInner.innerHTML = '';
      return;
    }

    dailyInner.innerHTML = `
      <div class="daily-card">
        <div>
          <p class="daily-eyebrow"><i class="fa-solid fa-star"></i> Featured Today · Posted ${formatDate(pick.date)}</p>
          <h3>${escapeHTML(pick.title)}</h3>
          <p>${escapeHTML(pick.description)}</p>
        </div>
        <a href="${pick.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
          <span>Apply / View Notice</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>
    `;
  }

  // Render Posts Grid
  function renderPosts() {
    if (!postGrid) return;

    let filtered = allPosts;

    // Filter by Category
    if (activeFilter !== 'All') {
      filtered = filtered.filter(p => p.category === activeFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }

    if (resultCount) {
      resultCount.innerHTML = `<i class="fa-solid fa-list-check"></i> ${filtered.length} opportunity${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      postGrid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    postGrid.innerHTML = filtered.map(post => {
      const left = daysLeft(post.deadline);
      const urgent = left <= 7 && left >= 0;
      const label = left < 0 ? 'CLOSED' : left === 0 ? 'CLOSES TODAY' : `${left}D LEFT`;
      const fallbackImg = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80';
      const postImg = post.image || fallbackImg;

      return `
        <article class="post-card ${urgent ? 'is-urgent' : ''}">
          <div class="post-card-thumb-wrap">
            <img src="${postImg}" alt="${escapeHTML(post.title)}" class="post-card-img" loading="lazy" onerror="this.src='${fallbackImg}'">
            <span class="post-card-badge-overlay">${escapeHTML(post.category)}</span>
            <span class="post-card-days-badge"><i class="fa-regular fa-clock"></i> ${label}</span>
          </div>
          <div class="post-card-body">
            <h3>${escapeHTML(post.title)}</h3>
            <p>${escapeHTML(post.description)}</p>
          </div>
          <div class="post-card-footer">
            <span class="post-date"><i class="fa-regular fa-calendar"></i> ${formatDate(post.date)}</span>
            <a href="${post.link || 'https://www.linkedin.com'}" target="_blank" rel="noopener noreferrer" class="post-card-action-btn">
              <span>View Details</span> <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </article>
      `;
    }).join('');
  }

  // Live Search listener
  if (liveSearchInput) {
    liveSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
      }
      renderPosts();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (liveSearchInput) {
        liveSearchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderPosts();
        liveSearchInput.focus();
      }
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      activeFilter = 'All';
      searchQuery = '';
      if (liveSearchInput) {
        liveSearchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      }
      document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.toggle('is-active', c.dataset.filter === 'All');
      });
      renderPosts();
    });
  }

  // Connect navbar category links with board filtering
  document.querySelectorAll('[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      const cat = link.dataset.category;
      activeFilter = cat;
      searchQuery = '';
      if (liveSearchInput) {
        liveSearchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      }
      
      toggleMobileNav(false);

      if (allPosts.length) {
        renderPosts();
        
        // Sync active styling on board filters
        document.querySelectorAll('.filter-chip').forEach(c => {
          c.classList.toggle('is-active', c.dataset.filter === activeFilter);
        });

        // Scroll smoothly to noticeboard
        const oppSection = document.getElementById('opportunities');
        if (oppSection) {
          oppSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Services click flash highlight
  document.querySelectorAll('[data-course]').forEach(link => {
    link.addEventListener('click', () => {
      const courseTitle = link.dataset.course;
      const targetCard = document.querySelector(`.course-card[data-course-title="${courseTitle}"]`);
      if (targetCard) {
        setTimeout(() => {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.remove('is-highlighted');
          void targetCard.offsetWidth;
          targetCard.classList.add('is-highlighted');
        }, 120);
      }
    });
  });

  // ===== GEMINI AI ASSISTANT CONTROLLER =====
  const aiModal = document.getElementById('aiModal');
  const aiModalClose = document.getElementById('aiModalClose');
  const openAiModalBtn = document.getElementById('openAiModalBtn');
  const heroAiTrigger = document.getElementById('heroAiTrigger');
  const floatingAiBtn = document.getElementById('floatingAiBtn');
  const openApiKeyBtn = document.getElementById('openApiKeyBtn');
  const apiKeyBar = document.getElementById('apiKeyBar');
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const aiChatBody = document.getElementById('aiChatBody');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatInput = document.getElementById('aiChatInput');

  // Load saved key from localStorage
  const savedKey = localStorage.getItem('gemini_api_key') || '';
  if (geminiApiKeyInput && savedKey) {
    geminiApiKeyInput.value = savedKey;
  }

  function toggleAiModal(show) {
    if (!aiModal) return;
    if (show) {
      aiModal.classList.add('is-active');
      aiModal.setAttribute('aria-hidden', 'false');
      if (aiChatInput) aiChatInput.focus();
    } else {
      aiModal.classList.remove('is-active');
      aiModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (openAiModalBtn) openAiModalBtn.addEventListener('click', () => toggleAiModal(true));
  if (heroAiTrigger) heroAiTrigger.addEventListener('click', () => toggleAiModal(true));
  if (floatingAiBtn) floatingAiBtn.addEventListener('click', () => toggleAiModal(true));
  if (aiModalClose) aiModalClose.addEventListener('click', () => toggleAiModal(false));

  if (aiModal) {
    aiModal.addEventListener('click', (e) => {
      if (e.target === aiModal) toggleAiModal(false);
    });
  }

  if (openApiKeyBtn && apiKeyBar) {
    openApiKeyBtn.addEventListener('click', () => {
      apiKeyBar.style.display = apiKeyBar.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (saveApiKeyBtn && geminiApiKeyInput) {
    saveApiKeyBtn.addEventListener('click', () => {
      const key = geminiApiKeyInput.value.trim();
      if (key) {
        localStorage.setItem('gemini_api_key', key);
        alert('Gemini API Key saved locally!');
        if (apiKeyBar) apiKeyBar.style.display = 'none';
      } else {
        localStorage.removeItem('gemini_api_key');
        alert('API Key cleared.');
      }
    });
  }

  // Quick chip triggers
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (aiChatInput) {
        aiChatInput.value = prompt;
        submitAiChat(prompt);
      }
    });
  });

  if (aiChatForm) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = aiChatInput.value.trim();
      if (!message) return;
      submitAiChat(message);
      aiChatInput.value = '';
    });
  }

  function appendAiMessage(role, htmlContent) {
    if (!aiChatBody) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${role === 'user' ? 'ai-user' : 'ai-bot'}`;
    msgDiv.innerHTML = `
      <div class="ai-msg-avatar"><i class="fa-solid ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i></div>
      <div class="ai-msg-bubble">${htmlContent}</div>
    `;
    aiChatBody.appendChild(msgDiv);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;
  }

  async function submitAiChat(query) {
    appendAiMessage('user', escapeHTML(query));

    // Typing placeholder
    const typingId = 'typing_' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message ai-bot';
    typingDiv.id = typingId;
    typingDiv.innerHTML = `
      <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="ai-msg-bubble"><i class="fa-solid fa-spinner fa-spin"></i> Analyzing opportunities &amp; preparing answer...</div>
    `;
    aiChatBody.appendChild(typingDiv);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    const apiKey = localStorage.getItem('gemini_api_key') || '';

    // If API Key is present, call Gemini API
    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are the Official Academic Advisor for "The Noticeboard — Purnea Rebirth Foundation". We list student opportunities such as Moot Courts, Internships, Scholarships, Scopus Call for Papers, and provide Legal Advisory (Contract drafting, NDA, career guidance). Direct Desk Helpline: +91 97984 88837.
User asks: "${query}".
Answer in a friendly, concise, encouraging, and highly helpful manner with bullet points where appropriate.`
              }]
            }]
          })
        });

        const data = await response.json();
        const placeholder = document.getElementById(typingId);
        if (placeholder) placeholder.remove();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const replyText = data.candidates[0].content.parts[0].text;
          const formatted = replyText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\*/g, '<br>•')
            .replace(/\n/g, '<br>');
          appendAiMessage('bot', formatted);
          return;
        } else if (data.error) {
          appendAiMessage('bot', `<p style="color:#DC2626;"><strong>Gemini API Error:</strong> ${escapeHTML(data.error.message)}</p><p>Please check your API key in the top "Key" menu.</p>`);
          return;
        }
      } catch (err) {
        console.warn('Gemini API fetch error, falling back to local advisor:', err);
      }
    }

    // Smart Local Fallback Response (Instant, zero latency)
    setTimeout(() => {
      const placeholder = document.getElementById(typingId);
      if (placeholder) placeholder.remove();

      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('moot')) {
        reply = `<strong>12th National Moot Court Competition 2026</strong> is currently open on the board!<br>
        • Focus: Constitutional &amp; Cyber Law<br>
        • Cash Prize: INR 1,50,000 + Direct Tier-1 Internships<br>
        • Deadline: 28th September 2026<br>
        <em>Tip: Ensure your memorial follows Bluebook 21st ed. citation format.</em>`;
      } else if (q.includes('intern') || q.includes('aethel')) {
        reply = `<strong>Active Internship Opportunities:</strong><br>
        1. <strong>Aethel Legal International</strong>: Corporate law, contract drafting &amp; IP compliance (Deadline: Oct 15).<br>
        2. <strong>Assistant Incubation Manager</strong>: Startup incubation &amp; grant coordination.<br>
        3. <strong>Jagran Lakecity University</strong>: Student research associates.<br>
        <em>Check the "Internships" filter on the board to view full requirements!</em>`;
      } else if (q.includes('scholarship') || q.includes('fellowship')) {
        reply = `<strong>Scholarship Highlights:</strong><br>
        • <strong>National Merit Scholarship</strong> for Undergrad &amp; Postgrad students (Closing Sept 30, 2026). Covers full tuition and book allowances.<br>
        • Keep your previous semester marksheets and income certificates handy for verification.`;
      } else if (q.includes('contract') || q.includes('nda') || q.includes('legal') || q.includes('service')) {
        reply = `<strong>Purnea Rebirth Foundation Legal Desk:</strong><br>
        We offer students &amp; young founders dedicated services in:<br>
        • Contract Drafting &amp; NDA formulation<br>
        • Freelancer Service Agreements<br>
        • Academic &amp; Publication Advisory<br>
        📞 <strong>Direct Helpline:</strong> <a href="tel:+919798488837" style="color:#0A66C2; text-decoration:underline;">+91 97984 88837</a> or WhatsApp us directly!`;
      } else {
        reply = `Thank you for your question! Here are key recommendations:<br>
        • <strong>Browse Active Notices:</strong> Use the category filter chips above for Internships, Moot Courts, Scopus Papers, and Scholarships.<br>
        • <strong>Legal Assistance:</strong> Contact our legal desk at <strong>+91 97984 88837</strong> for one-on-one consultation.<br>
        • <em>Want full AI live reasoning? Click the "Key" button at the top to add your free Google Gemini API Key!</em>`;
      }

      appendAiMessage('bot', reply);
    }, 500);
  }

  // ===== USER AUTHENTICATION CONTROLLER =====
  const authModal = document.getElementById('authModal');
  const authNavWrapper = document.getElementById('authNavWrapper');
  const modalClose = document.getElementById('modalClose');
  const tabSignIn = document.getElementById('tabSignIn');
  const tabCreate = document.getElementById('tabCreate');
  const formSignIn = document.getElementById('formSignIn');
  const formCreate = document.getElementById('formCreate');

  function toggleAuthModal(show) {
    if (!authModal) return;
    if (show) {
      authModal.classList.add('is-active');
      authModal.setAttribute('aria-hidden', 'false');
    } else {
      authModal.classList.remove('is-active');
      authModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (authNavWrapper) {
    authNavWrapper.addEventListener('click', (e) => {
      const btn = e.target.closest('#authBtn');
      if (btn) {
        switchTab('signin');
        toggleAuthModal(true);
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => toggleAuthModal(false));
  }
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) toggleAuthModal(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (authModal.classList.contains('is-active')) toggleAuthModal(false);
        if (aiModal && aiModal.classList.contains('is-active')) toggleAiModal(false);
      }
    });
  }

  function switchTab(tabType) {
    if (tabType === 'signin') {
      tabSignIn.classList.add('active');
      tabCreate.classList.remove('active');
      formSignIn.style.display = 'flex';
      formCreate.style.display = 'none';
    } else {
      tabCreate.classList.add('active');
      tabSignIn.classList.remove('active');
      formCreate.style.display = 'flex';
      formSignIn.style.display = 'none';
    }
  }

  if (tabSignIn && tabCreate) {
    tabSignIn.addEventListener('click', () => switchTab('signin'));
    tabCreate.addEventListener('click', () => switchTab('create'));
  }

  function updateAuthHeader() {
    if (!authNavWrapper) return;
    const user = localStorage.getItem('authUser');
    if (user) {
      const cleanUser = escapeHTML(user);
      authNavWrapper.innerHTML = `
        <div class="profile-badge">
          <i class="fa-solid fa-user-check"></i>
          <span>${cleanUser}</span>
        </div>
        <button id="signOutBtn" class="btn-signout" aria-label="Sign Out">Sign Out</button>
      `;
    } else {
      authNavWrapper.innerHTML = `
        <button id="authBtn" class="btn btn-primary btn-sm"><i class="fa-solid fa-user"></i> Sign In</button>
      `;
    }
  }

  if (formSignIn) {
    formSignIn.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      const username = email.split('@')[0];
      localStorage.setItem('authUser', username);
      updateAuthHeader();
      toggleAuthModal(false);
      formSignIn.reset();
    });
  }

  if (formCreate) {
    formCreate.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('createName').value.trim();
      localStorage.setItem('authUser', name);
      updateAuthHeader();
      toggleAuthModal(false);
      formCreate.reset();
    });
  }

  if (authNavWrapper) {
    authNavWrapper.addEventListener('click', (e) => {
      const btn = e.target.closest('#signOutBtn');
      if (btn) {
        localStorage.removeItem('authUser');
        updateAuthHeader();
      }
    });
  }

  updateAuthHeader();
});
