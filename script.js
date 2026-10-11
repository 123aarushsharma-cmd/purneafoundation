/**
 * THE NOTICEBOARD — PURNEA REBIRTH FOUNDATION
 * Interactive Real-Time Noticeboard, Firestore Synchronization,
 * Student Tools & Career Suite, Secured Admin Command Center,
 * and Official Digital Advisory Desk.
 */

import { 
  initFirebase, 
  getOpportunities, 
  saveOpportunityToFirestore, 
  deleteOpportunityFromFirestore, 
  getUserBookmarks, 
  toggleBookmarkInFirestore, 
  loginWithGoogle, 
  logoutUser, 
  getFirebaseAuth, 
  isUserAdmin,
  isFirebaseReady,
  validateAdminCredentials,
  isAdminSessionActive,
  logoutAdminSession,
  getSiteSettings,
  saveSiteSettings,
  submitStudentInquiry,
  getStudentInquiries,
  updateInquiryStatusInDb,
  deleteInquiryFromDb
} from './firebase-service.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ===== ALL DOM ELEMENT REFERENCES (DECLARED AT TOP TO PREVENT TDZ ERRORS) =====
  // Unified Header Navigation
  const navToggle = document.getElementById('navToggle');
  const navCloseBtn = document.getElementById('navCloseBtn');
  const mainNav = document.getElementById('mainNav');
  const authNavWrapper = document.getElementById('authNavWrapper');

  // Noticeboard Core
  const postGrid = document.getElementById('postGrid');
  const filterBar = document.getElementById('filterBar');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const emptyStateTitle = document.getElementById('emptyStateTitle');
  const emptyStateDesc = document.getElementById('emptyStateDesc');
  const liveSearchInput = document.getElementById('liveSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const heroSearchActionBtn = document.getElementById('heroSearchActionBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const savedFilterChip = document.getElementById('savedFilterChip');
  const savedCountChip = document.getElementById('savedCountChip');
  const savedHeroBadge = document.getElementById('savedHeroBadge');
  const heroSavedTrigger = document.getElementById('heroSavedTrigger');
  const heroTickerTrack = document.getElementById('heroTickerTrack');

  // Student Tools Suite
  const toolsSavedBadge = document.getElementById('toolsSavedBadge');
  const savedItemsListContainer = document.getElementById('savedItemsListContainer');
  const exportSavedBtn = document.getElementById('exportSavedBtn');
  const coverLetterForm = document.getElementById('coverLetterForm');
  const coverLetterOutput = document.getElementById('coverLetterOutput');
  const copyLetterBtn = document.getElementById('copyLetterBtn');
  const downloadLetterBtn = document.getElementById('downloadLetterBtn');
  const mootChecklistGrid = document.getElementById('mootChecklistGrid');
  const mootProgressText = document.getElementById('mootProgressText');
  const mootProgressBarFill = document.getElementById('mootProgressBarFill');
  const studentInquiryForm = document.getElementById('studentInquiryForm');
  const inquirySuccessMsg = document.getElementById('inquirySuccessMsg');

  // Admin Gateway Modal (/admin or #admin)
  const adminAuthModal = document.getElementById('adminAuthModal');
  const adminAuthClose = document.getElementById('adminAuthClose');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminUsernameInput = document.getElementById('adminUsernameInput');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const adminLoginError = document.getElementById('adminLoginError');
  const footerAdminLink = document.getElementById('footerAdminLink');

  // Admin Control Center Modal
  const adminModal = document.getElementById('adminModal');
  const adminModalClose = document.getElementById('adminModalClose');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminTableBody = document.getElementById('adminTableBody');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminAddNewBtn = document.getElementById('adminAddNewBtn');
  const adminOpportunityForm = document.getElementById('adminOpportunityForm');
  const adminFormCancelBtn = document.getElementById('adminFormCancelBtn');
  const adminFormTabTitle = document.getElementById('adminFormTabTitle');
  const editOpportunityId = document.getElementById('editOpportunityId');
  const adminListCount = document.getElementById('adminListCount');
  const adminInquiryTabCount = document.getElementById('adminInquiryTabCount');
  const adminInquiriesTableBody = document.getElementById('adminInquiriesTableBody');
  const adminTickerForm = document.getElementById('adminTickerForm');
  const tickerItemsInput = document.getElementById('tickerItemsInput');
  const adminExportJsonBtn = document.getElementById('adminExportJsonBtn');
  const adminResetDefaultsBtn = document.getElementById('adminResetDefaultsBtn');

  // Admin Stats Bar
  const adminStatTotalPosts = document.getElementById('adminStatTotalPosts');
  const adminStatInquiries = document.getElementById('adminStatInquiries');
  const adminStatBookmarks = document.getElementById('adminStatBookmarks');
  const adminStatDailyTitle = document.getElementById('adminStatDailyTitle');

  // Advisory Desk Drawer
  const aiModal = document.getElementById('aiModal');
  const aiModalClose = document.getElementById('aiModalClose');
  const floatingAdvisorBtn = document.getElementById('floatingAdvisorBtn');
  const aiChatBody = document.getElementById('aiChatBody');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiChatInput = document.getElementById('aiChatInput');

  // Authentication Modal
  const authModal = document.getElementById('authModal');
  const modalClose = document.getElementById('modalClose');
  const tabSignIn = document.getElementById('tabSignIn');
  const tabCreate = document.getElementById('tabCreate');
  const formSignIn = document.getElementById('formSignIn');
  const formCreate = document.getElementById('formCreate');
  const googleSignInBtn = document.getElementById('googleSignInBtn');

  // ===== APPLICATION STATE =====
  let currentUser = null;
  let savedItemIds = new Set();
  let allPosts = [];
  let activeFilter = 'All';
  let searchQuery = '';

  // ===== HELPER FUNCTIONS =====
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function daysLeft(deadline) {
    if (!deadline) return 999;
    const today = new Date();
    const end = new Date(deadline);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Active';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function updateSavedCounters() {
    const count = savedItemIds.size;
    if (savedCountChip) savedCountChip.textContent = count;
    if (savedHeroBadge) savedHeroBadge.textContent = count;
    if (toolsSavedBadge) toolsSavedBadge.textContent = count;
    renderSavedTrackerTool();
  }

  function loadLocalBookmarks() {
    try {
      const stored = localStorage.getItem('user_saved_bookmarks');
      if (stored) {
        const arr = JSON.parse(stored);
        savedItemIds = new Set(arr.map(String));
      }
    } catch {
      savedItemIds = new Set();
    }
    updateSavedCounters();
  }

  function saveLocalBookmarks() {
    localStorage.setItem('user_saved_bookmarks', JSON.stringify(Array.from(savedItemIds)));
    updateSavedCounters();
  }

  function updateAuthHeader() {
    if (!authNavWrapper) return;
    if (currentUser) {
      const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Student';
      const cleanUser = escapeHTML(name);
      authNavWrapper.innerHTML = `
        <div class="profile-badge">
          <i class="fa-solid fa-user-graduate" style="color:var(--gold-600);"></i>
          <span>${cleanUser}</span>
          <button id="signOutBtn" class="btn-signout" aria-label="Sign Out">Sign Out</button>
        </div>
      `;
      const signOutBtn = document.getElementById('signOutBtn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
          await logoutUser();
          currentUser = null;
          localStorage.removeItem('authUser');
          updateAuthHeader();
          renderPosts();
        });
      }
    } else {
      authNavWrapper.innerHTML = `
        <button id="authBtn" class="btn-auth-nav"><i class="fa-regular fa-user"></i> <span>Sign In</span></button>
      `;
      const authBtn = document.getElementById('authBtn');
      if (authBtn) {
        authBtn.addEventListener('click', () => {
          switchAuthTab('signin');
          toggleAuthModal(true);
        });
      }
    }
  }

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

  function switchAuthTab(tabType) {
    if (tabType === 'signin') {
      if (tabSignIn) tabSignIn.classList.add('active');
      if (tabCreate) tabCreate.classList.remove('active');
      if (formSignIn) formSignIn.style.display = 'block';
      if (formCreate) formCreate.style.display = 'none';
    } else {
      if (tabCreate) tabCreate.classList.add('active');
      if (tabSignIn) tabSignIn.classList.remove('active');
      if (formCreate) formCreate.style.display = 'block';
      if (formSignIn) formSignIn.style.display = 'none';
    }
  }

  function getCategoryIcon(cat) {
    switch (cat) {
      case 'All': return '<i class="fa-solid fa-layer-group"></i>';
      case 'Saved': return '<i class="fa-solid fa-bookmark"></i>';
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

  function renderDaily(posts) {
    const dailyInner = document.getElementById('dailyInner');
    if (!dailyInner) return;

    const pick = posts.find(p => p.daily) || posts[0];
    if (!pick) {
      dailyInner.innerHTML = '';
      return;
    }

    const isSaved = savedItemIds.has(String(pick.id));

    dailyInner.innerHTML = `
      <div class="daily-card">
        <div>
          <p class="daily-eyebrow"><i class="fa-solid fa-star"></i> Featured Today · Posted ${formatDate(pick.date)}</p>
          <h3>${escapeHTML(pick.title)}</h3>
          <p>${escapeHTML(pick.description)}</p>
        </div>
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <button class="btn btn-outline-light card-save-daily-btn" data-post-id="${pick.id}" style="color:var(--teal-900); border:1.5px solid var(--border-medium); background:#FFFFFF; padding:10px 18px;">
            <i class="${isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}" style="${isSaved ? 'color:var(--gold-600);' : ''}"></i>
            <span>${isSaved ? 'Saved' : 'Save Notice'}</span>
          </button>
          <a href="${pick.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
            <span>Apply / View Notice</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </div>
    `;

    const saveBtn = dailyInner.querySelector('.card-save-daily-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => handleSaveClick(pick.id));
    }
  }

  function renderPosts() {
    if (!postGrid) return;

    let filtered = allPosts;

    if (activeFilter === 'Saved') {
      filtered = filtered.filter(p => savedItemIds.has(String(p.id)));
    } else if (activeFilter !== 'All') {
      filtered = filtered.filter(p => p.category === activeFilter);
    }

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
      resultCount.innerHTML = `<i class="fa-solid fa-list-check"></i> ${filtered.length} verified notice${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      postGrid.innerHTML = '';
      if (emptyState) {
        emptyState.hidden = false;
        if (activeFilter === 'Saved') {
          if (emptyStateTitle) emptyStateTitle.textContent = 'No Saved Opportunities Yet';
          if (emptyStateDesc) emptyStateDesc.textContent = 'Click the bookmark icon on any opportunity card to save it here for fast tracking.';
        } else {
          if (emptyStateTitle) emptyStateTitle.textContent = 'No opportunities match this filter';
          if (emptyStateDesc) emptyStateDesc.textContent = 'No active notices found under this selection. Reset your filters or search query to browse all listings.';
        }
      }
      return;
    }
    if (emptyState) emptyState.hidden = true;

    postGrid.innerHTML = filtered.map(post => {
      const left = daysLeft(post.deadline);
      const urgent = left <= 7 && left >= 0;
      const label = left < 0 ? 'CLOSED' : left === 0 ? 'CLOSES TODAY' : `${left}D LEFT`;
      const fallbackImg = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80';
      const postImg = post.image || fallbackImg;
      const isSaved = savedItemIds.has(String(post.id));

      return `
        <article class="post-card ${urgent ? 'is-urgent' : ''}">
          <div class="post-card-thumb-wrap">
            <img src="${postImg}" alt="${escapeHTML(post.title)}" class="post-card-img" loading="lazy" onerror="this.src='${fallbackImg}'">
            <span class="post-card-badge-overlay">${escapeHTML(post.category)}</span>
            <button class="card-save-btn ${isSaved ? 'is-saved' : ''}" data-post-id="${post.id}" title="${isSaved ? 'Remove from Saved' : 'Save Opportunity'}" aria-label="Save ${escapeHTML(post.title)}">
              <i class="${isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}"></i>
            </button>
            <span class="post-card-days-badge"><i class="fa-regular fa-clock"></i> ${label}</span>
          </div>
          <div class="post-card-body">
            <h3>${escapeHTML(post.title)}</h3>
            <p>${escapeHTML(post.description)}</p>
          </div>
          <div class="post-card-footer">
            <span class="post-date"><i class="fa-regular fa-calendar"></i> ${formatDate(post.date)}</span>
            <a href="${post.link || 'https://www.linkedin.com'}" target="_blank" rel="noopener noreferrer" class="post-card-action-btn">
              <span>View Notice</span> <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </article>
      `;
    }).join('');

    postGrid.querySelectorAll('.card-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const postId = btn.dataset.postId;
        handleSaveClick(postId);
      });
    });
  }

  async function handleSaveClick(postId) {
    if (!postId) return;
    const strId = String(postId);

    if (!currentUser) {
      toggleAuthModal(true);
      const subtext = document.getElementById('authSubtext');
      if (subtext) subtext.textContent = 'Please sign in or create an account to save opportunities to your student dashboard.';
      return;
    }

    const willSave = !savedItemIds.has(strId);
    if (willSave) {
      savedItemIds.add(strId);
    } else {
      savedItemIds.delete(strId);
    }

    saveLocalBookmarks();

    if (currentUser.uid) {
      await toggleBookmarkInFirestore(currentUser.uid, strId, willSave);
    }

    renderPosts();
    renderDaily(allPosts);
    renderSavedTrackerTool();
  }

  function buildFilters(posts) {
    if (!filterBar) return;

    const categories = [
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

    const existingChips = filterBar.querySelectorAll('.filter-chip:not([data-filter="All"]):not([data-filter="Saved"])');
    existingChips.forEach(c => c.remove());

    categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `filter-chip ${cat === activeFilter ? 'is-active' : ''}`;
      chip.dataset.filter = cat;
      chip.innerHTML = `${getCategoryIcon(cat)} <span>${cat}</span>`;
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

  // ===== STUDENT TOOLS SUITE FUNCTIONS =====
  function initStudentTools() {
    // Tabs switching
    document.querySelectorAll('.tools-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolTarget = btn.dataset.tool;
        document.querySelectorAll('.tools-tab-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        document.querySelectorAll('.tool-content-panel').forEach(p => p.classList.remove('is-active'));
        if (toolTarget === 'tracker') {
          const p = document.getElementById('toolPanelTracker');
          if (p) p.classList.add('is-active');
          renderSavedTrackerTool();
        } else if (toolTarget === 'cover-letter') {
          const p = document.getElementById('toolPanelCoverLetter');
          if (p) p.classList.add('is-active');
        } else if (toolTarget === 'moot-check') {
          const p = document.getElementById('toolPanelMootCheck');
          if (p) p.classList.add('is-active');
          loadMootChecklist();
        } else if (toolTarget === 'legal-inquiry') {
          const p = document.getElementById('toolPanelLegalInquiry');
          if (p) p.classList.add('is-active');
        }
      });
    });

    // Tool 1: Export Saved
    if (exportSavedBtn) {
      exportSavedBtn.addEventListener('click', () => {
        const savedPosts = allPosts.filter(p => savedItemIds.has(String(p.id)));
        if (savedPosts.length === 0) {
          alert('You have no saved opportunities to export.');
          return;
        }

        let txt = `THE NOTICEBOARD — PURNEA REBIRTH FOUNDATION\nMY SAVED OPPORTUNITIES & DEADLINES EXPORT\nGenerated: ${new Date().toLocaleString()}\n=======================================================\n\n`;
        savedPosts.forEach((p, idx) => {
          txt += `${idx + 1}. ${p.title}\nCategory: ${p.category}\nDeadline: ${p.deadline} (${daysLeft(p.deadline)} days remaining)\nOfficial Link: ${p.link}\nDescription: ${p.description}\n-------------------------------------------------------\n\n`;
        });

        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `my_saved_opportunities_${Date.now()}.txt`;
        a.click();
      });
    }

    // Tool 2: Cover Letter Generator
    if (coverLetterForm) {
      coverLetterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sName = document.getElementById('clStudentName').value.trim() || 'Applicant';
        const sUni = document.getElementById('clUniversity').value.trim() || 'Law School';
        const sOrg = document.getElementById('clTargetOrg').value.trim() || 'Esteemed Organization';
        const sArea = document.getElementById('clPracticeArea').value;
        const sHighlight = document.getElementById('clKeyHighlight').value.trim();

        const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const highlightSentence = sHighlight 
          ? `Notably, ${sHighlight}, which further honed my analytical diligence and ability to synthesize complex statutory propositions under strict time constraints.`
          : `Through my rigorous coursework, I have developed disciplined research acumen, proficiency with primary legal databases, and precision in legal drafting.`;

        const letterText = `${todayStr}

To,
The Internship Selection Committee / Managing Partner
${sOrg}

Subject: Application for Legal Internship & Research Associate Position — ${sArea}

Respected Madam / Sir,

I am writing to formally submit my candidature for an internship placement with ${sOrg}. As a dedicated law scholar at ${sUni}, I have cultivated a steadfast interest and rigorous practical orientation in ${sArea}.

${highlightSentence}

Having closely observed ${sOrg}'s benchmark contributions to corporate practice, jurisprudence, and institutional excellence, I am enthusiastic about supporting your team with case research, brief drafting, statutory compliance analysis, and documentation. I am well-versed with Bluebook citation formats, SCC/AIR indexing, and contractual structuring.

I welcome the opportunity to discuss my qualifications and how I can contribute meaningfully to your ongoing matters. My curriculum vitae is enclosed herewith for your kind consideration.

Thank you for your time and consideration.

Yours sincerely,

${sName}
Candidate in Law · ${sUni}
Email: ${currentUser ? (currentUser.email || 'available on request') : 'available on request'}`;

        if (coverLetterOutput) coverLetterOutput.value = letterText;
      });
    }

    if (copyLetterBtn && coverLetterOutput) {
      copyLetterBtn.addEventListener('click', async () => {
        if (!coverLetterOutput.value) return;
        await navigator.clipboard.writeText(coverLetterOutput.value);
        const originalHtml = copyLetterBtn.innerHTML;
        copyLetterBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => copyLetterBtn.innerHTML = originalHtml, 2000);
      });
    }

    if (downloadLetterBtn && coverLetterOutput) {
      downloadLetterBtn.addEventListener('click', () => {
        if (!coverLetterOutput.value) return;
        const blob = new Blob([coverLetterOutput.value], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Legal_Cover_Letter_${Date.now()}.txt`;
        a.click();
      });
    }

    // Tool 3: Moot Court Checklist
    if (mootChecklistGrid) {
      mootChecklistGrid.querySelectorAll('input[type="checkbox"]').forEach(box => {
        box.addEventListener('change', () => {
          saveMootChecklist();
          updateMootProgress();
        });
      });
    }

    // Tool 4: Priority Student Legal Desk Form
    if (studentInquiryForm) {
      studentInquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('inqSubmitBtn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        }

        const inquiryData = {
          name: document.getElementById('inqName').value.trim(),
          email: document.getElementById('inqEmail').value.trim(),
          phone: document.getElementById('inqPhone').value.trim(),
          serviceType: document.getElementById('inqServiceType').value,
          message: document.getElementById('inqMessage').value.trim()
        };

        try {
          await submitStudentInquiry(inquiryData);
          if (inquirySuccessMsg) inquirySuccessMsg.style.display = 'flex';
          studentInquiryForm.reset();
          renderAdminInquiries();
          setTimeout(() => {
            if (inquirySuccessMsg) inquirySuccessMsg.style.display = 'none';
          }, 8000);
        } catch (err) {
          console.warn('Inquiry submit fallback:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit to Legal Desk';
          }
        }
      });
    }
  }

  function renderSavedTrackerTool() {
    if (!savedItemsListContainer) return;
    const savedPosts = allPosts.filter(p => savedItemIds.has(String(p.id)));

    if (savedPosts.length === 0) {
      savedItemsListContainer.innerHTML = `
        <div style="text-align:center; padding:36px 20px; background:var(--bg-page); border-radius:var(--radius-lg); border:1px dashed var(--border-medium);">
          <i class="fa-regular fa-bookmark" style="font-size:2rem; color:var(--text-muted); margin-bottom:12px;"></i>
          <h4 style="color:var(--teal-900); margin-bottom:6px;">No Saved Applications Yet</h4>
          <p style="color:var(--text-muted); font-size:0.88rem; max-width:440px; margin:0 auto 16px;">
            Save upcoming moot courts, fellowships, and internships from the Noticeboard to monitor deadlines here.
          </p>
          <a href="#opportunities" class="btn btn-primary" style="padding:8px 18px; font-size:0.85rem;"><i class="fa-solid fa-layer-group"></i> Browse Opportunities</a>
        </div>
      `;
      return;
    }

    savedItemsListContainer.innerHTML = savedPosts.map(post => {
      const left = daysLeft(post.deadline);
      let badgeClass = 'plenty';
      let badgeText = `${left} days left`;
      if (left <= 3) {
        badgeClass = 'urgent';
        badgeText = left <= 0 ? 'Closes Today' : `${left} days left (Urgent)`;
      } else if (left <= 10) {
        badgeClass = 'normal';
        badgeText = `${left} days left`;
      }

      return `
        <div class="saved-item-row">
          <div class="saved-item-info">
            <h4 class="saved-item-title">${escapeHTML(post.title)}</h4>
            <div class="saved-item-meta">
              <span><i class="fa-solid fa-tag"></i> ${escapeHTML(post.category)}</span>
              <span class="saved-deadline-badge ${badgeClass}"><i class="fa-regular fa-clock"></i> ${badgeText}</span>
              <span><i class="fa-regular fa-calendar"></i> Deadline: ${formatDate(post.deadline)}</span>
            </div>
          </div>
          <div class="saved-item-actions">
            <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-primary">
              Apply <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button class="btn btn-xs btn-outline-danger remove-saved-tool-btn" data-remove-id="${post.id}" title="Remove Bookmark">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    savedItemsListContainer.querySelectorAll('.remove-saved-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.removeId;
        handleSaveClick(id);
      });
    });
  }

  function saveMootChecklist() {
    if (!mootChecklistGrid) return;
    const completed = [];
    mootChecklistGrid.querySelectorAll('input[type="checkbox"]').forEach(box => {
      if (box.checked) completed.push(box.dataset.task);
    });
    localStorage.setItem('moot_checklist_tasks', JSON.stringify(completed));
  }

  function loadMootChecklist() {
    if (!mootChecklistGrid) return;
    try {
      const stored = localStorage.getItem('moot_checklist_tasks');
      const completed = stored ? JSON.parse(stored) : [];
      mootChecklistGrid.querySelectorAll('input[type="checkbox"]').forEach(box => {
        const isDone = completed.includes(box.dataset.task);
        box.checked = isDone;
        const parent = box.closest('.moot-check-item');
        if (parent) parent.classList.toggle('is-done', isDone);
      });
    } catch {}
    updateMootProgress();
  }

  function updateMootProgress() {
    if (!mootChecklistGrid) return;
    const total = mootChecklistGrid.querySelectorAll('input[type="checkbox"]').length;
    const checked = mootChecklistGrid.querySelectorAll('input[type="checkbox"]:checked').length;
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

    if (mootProgressText) mootProgressText.textContent = `${checked} / ${total} Tasks (${pct}%)`;
    if (mootProgressBarFill) mootProgressBarFill.style.width = `${pct}%`;

    mootChecklistGrid.querySelectorAll('.moot-check-item').forEach(item => {
      const box = item.querySelector('input[type="checkbox"]');
      if (box) item.classList.toggle('is-done', box.checked);
    });
  }

  // ===== SECURE ADMIN GATEWAY & CONSOLE CONTROLLERS =====
  function toggleAdminAuthModal(show) {
    if (!adminAuthModal) return;
    if (show) {
      adminAuthModal.classList.add('is-active');
      adminAuthModal.setAttribute('aria-hidden', 'false');
      if (adminUsernameInput) {
        adminUsernameInput.value = '';
        adminUsernameInput.focus();
      }
      if (adminPasswordInput) adminPasswordInput.value = '';
      if (adminLoginError) adminLoginError.style.display = 'none';
    } else {
      adminAuthModal.classList.remove('is-active');
      adminAuthModal.setAttribute('aria-hidden', 'true');
    }
  }

  function toggleAdminModal(show) {
    if (!adminModal) return;
    if (show) {
      adminModal.classList.add('is-active');
      adminModal.setAttribute('aria-hidden', 'false');
      renderAdminTable();
      renderAdminMetrics();
      renderAdminInquiries();
      loadTickerToEditor();
    } else {
      adminModal.classList.remove('is-active');
      adminModal.setAttribute('aria-hidden', 'true');
    }
  }

  function checkAdminRoute() {
    const isHashAdmin = window.location.hash === '#admin';
    const isPathAdmin = window.location.pathname.endsWith('/admin');

    if (isHashAdmin || isPathAdmin) {
      if (isAdminSessionActive()) {
        toggleAdminAuthModal(false);
        toggleAdminModal(true);
      } else {
        toggleAdminModal(false);
        toggleAdminAuthModal(true);
      }
    }
  }

  window.addEventListener('hashchange', checkAdminRoute);

  // Admin Gateway Authentication Form
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = adminUsernameInput.value.trim();
      const p = adminPasswordInput.value.trim();

      if (u === 'admin234' && p === 'admin121') {
        validateAdminCredentials(u, p);
        if (adminLoginError) adminLoginError.style.display = 'none';
        toggleAdminAuthModal(false);
        toggleAdminModal(true);
      } else {
        if (adminLoginError) adminLoginError.style.display = 'flex';
        adminPasswordInput.value = '';
        adminPasswordInput.focus();
      }
    });
  }

  if (adminAuthClose) {
    adminAuthClose.addEventListener('click', () => {
      toggleAdminAuthModal(false);
      if (window.location.hash === '#admin') {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      logoutAdminSession();
      toggleAdminModal(false);
      if (window.location.hash === '#admin') {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    });
  }

  if (footerAdminLink) {
    footerAdminLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (isAdminSessionActive()) {
        toggleAdminModal(true);
      } else {
        toggleAdminAuthModal(true);
      }
    });
  }

  // Admin Metrics
  function renderAdminMetrics() {
    if (adminStatTotalPosts) adminStatTotalPosts.textContent = allPosts.length;
    if (adminStatBookmarks) adminStatBookmarks.textContent = savedItemIds.size;
    const dailyPick = allPosts.find(p => p.daily) || allPosts[0];
    if (adminStatDailyTitle) adminStatDailyTitle.textContent = dailyPick ? dailyPick.title : 'None';
  }

  // Admin Table & Form
  function renderAdminTable() {
    if (!adminTableBody) return;
    const filterQuery = (adminSearchInput?.value || '').toLowerCase().trim();
    let displayList = allPosts;
    if (filterQuery) {
      displayList = displayList.filter(p => 
        (p.title && p.title.toLowerCase().includes(filterQuery)) ||
        (p.category && p.category.toLowerCase().includes(filterQuery))
      );
    }

    if (adminListCount) adminListCount.textContent = allPosts.length;

    if (displayList.length === 0) {
      adminTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">No listings found matching filter.</td></tr>`;
      return;
    }

    adminTableBody.innerHTML = displayList.map(item => `
      <tr>
        <td style="font-weight:600; max-width:280px;">${escapeHTML(item.title)}</td>
        <td><span class="section-tag" style="padding:2px 8px; font-size:0.7rem;">${escapeHTML(item.category)}</span></td>
        <td style="font-size:0.82rem;">${formatDate(item.deadline)}</td>
        <td>
          <button class="btn btn-xs toggle-daily-star-btn" data-daily-id="${item.id}" style="background:transparent; border:none; cursor:pointer;" title="Click to toggle as Featured Daily Pick">
            ${item.daily ? '<span style="color:#10B981; font-weight:800;"><i class="fa-solid fa-star"></i> Featured</span>' : '<span style="color:var(--text-muted);"><i class="fa-regular fa-star"></i> Set Pick</span>'}
          </button>
        </td>
        <td>
          <div class="admin-actions-cell">
            <button class="btn-admin-action btn-admin-edit" data-edit-id="${item.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
            <button class="btn-admin-action btn-admin-delete" data-delete-id="${item.id}"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    adminTableBody.querySelectorAll('.toggle-daily-star-btn').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.dailyId;
        const target = allPosts.find(p => String(p.id) === String(id));
        if (!target) return;

        allPosts.forEach(p => p.daily = false);
        target.daily = true;

        try {
          await saveOpportunityToFirestore(target, target.id);
        } catch (err) {
          console.warn('Daily star update Firestore warning:', err);
        }

        renderDaily(allPosts);
        renderAdminTable();
        renderAdminMetrics();
      });
    });

    adminTableBody.querySelectorAll('.btn-admin-edit').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.editId;
        const item = allPosts.find(p => String(p.id) === String(id));
        if (item) populateEditForm(item);
      });
    });

    adminTableBody.querySelectorAll('.btn-admin-delete').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.deleteId;
        if (confirm('Are you sure you want to delete this listing from the database?')) {
          await handleDeleteOpportunity(id);
        }
      });
    });
  }

  function switchAdminTab(target) {
    document.querySelectorAll('[data-admin-tab]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.adminTab === target);
    });

    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('is-active'));
    if (target === 'admin-list') {
      const t = document.getElementById('tabAdminList');
      if (t) t.classList.add('is-active');
      renderAdminTable();
    } else if (target === 'admin-form') {
      const t = document.getElementById('tabAdminForm');
      if (t) t.classList.add('is-active');
    } else if (target === 'admin-inquiries') {
      const t = document.getElementById('tabAdminInquiries');
      if (t) t.classList.add('is-active');
      renderAdminInquiries();
    } else if (target === 'admin-ticker') {
      const t = document.getElementById('tabAdminTicker');
      if (t) t.classList.add('is-active');
      loadTickerToEditor();
    } else if (target === 'admin-tools') {
      const t = document.getElementById('tabAdminTools');
      if (t) t.classList.add('is-active');
    }
  }

  function resetAdminForm() {
    if (!adminOpportunityForm) return;
    adminOpportunityForm.reset();
    if (editOpportunityId) editOpportunityId.value = '';
    if (adminFormTabTitle) adminFormTabTitle.textContent = 'Add New Opportunity';
  }

  function populateEditForm(item) {
    if (!adminOpportunityForm) return;
    if (editOpportunityId) editOpportunityId.value = item.id;
    if (adminFormTabTitle) adminFormTabTitle.textContent = `Edit Opportunity #${item.id}`;

    document.getElementById('formTitle').value = item.title || '';
    document.getElementById('formCategory').value = item.category || 'Internships';
    document.getElementById('formDeadline').value = item.deadline || '';
    document.getElementById('formDate').value = item.date || '';
    document.getElementById('formTag').value = item.tag || '';
    document.getElementById('formLink').value = item.link || '';
    document.getElementById('formImage').value = item.image || '';
    document.getElementById('formDescription').value = item.description || '';
    document.getElementById('formDaily').checked = Boolean(item.daily);

    switchAdminTab('admin-form');
  }

  async function handleDeleteOpportunity(id) {
    const strId = String(id);
    try {
      await deleteOpportunityFromFirestore(strId);
    } catch (err) {
      console.warn('Firestore delete failed, updating local state:', err);
    }
    allPosts = allPosts.filter(p => String(p.id) !== strId);
    savedItemIds.delete(strId);
    saveLocalBookmarks();
    renderPosts();
    renderDaily(allPosts);
    renderAdminTable();
    renderAdminMetrics();
  }

  // Admin Inquiries Tab Controller
  async function renderAdminInquiries() {
    if (!adminInquiriesTableBody) return;
    let list = [];
    try {
      list = await getStudentInquiries();
    } catch { list = []; }

    if (adminInquiryTabCount) adminInquiryTabCount.textContent = list.length;
    if (adminStatInquiries) adminStatInquiries.textContent = list.length;

    if (list.length === 0) {
      adminInquiriesTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No student inquiries received yet.</td></tr>`;
      return;
    }

    adminInquiriesTableBody.innerHTML = list.map(inq => {
      const isResolved = inq.status === 'Resolved';
      const statusBadge = isResolved
        ? '<span style="color:#059669; font-weight:700;"><i class="fa-solid fa-check"></i> Resolved</span>'
        : '<span style="color:#D97706; font-weight:700;"><i class="fa-solid fa-clock"></i> Pending</span>';

      return `
        <tr>
          <td><strong>${escapeHTML(inq.name)}</strong><br><small style="color:var(--text-muted);">${formatDate(inq.createdAt)}</small></td>
          <td>
            <a href="mailto:${inq.email}">${escapeHTML(inq.email)}</a><br>
            <a href="tel:${inq.phone}" style="color:var(--teal-700);">${escapeHTML(inq.phone)}</a>
          </td>
          <td><span class="section-tag" style="font-size:0.7rem;">${escapeHTML(inq.serviceType)}</span></td>
          <td style="max-width:260px; font-size:0.84rem;">${escapeHTML(inq.message)}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="admin-actions-cell">
              <button class="btn btn-xs ${isResolved ? 'btn-outline-light' : 'btn-primary'} inq-toggle-status-btn" data-inq-id="${inq.id}" data-current-status="${inq.status}">
                ${isResolved ? 'Mark Pending' : 'Mark Resolved'}
              </button>
              <button class="btn btn-xs btn-outline-danger inq-delete-btn" data-inq-id="${inq.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    adminInquiriesTableBody.querySelectorAll('.inq-toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inqId = btn.dataset.inqId;
        const current = btn.dataset.currentStatus;
        const next = current === 'Resolved' ? 'Pending' : 'Resolved';
        await updateInquiryStatusInDb(inqId, next);
        renderAdminInquiries();
      });
    });

    adminInquiriesTableBody.querySelectorAll('.inq-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inqId = btn.dataset.inqId;
        if (confirm('Delete this inquiry record?')) {
          await deleteInquiryFromDb(inqId);
          renderAdminInquiries();
        }
      });
    });
  }

  // ===== CONTINUOUS INFINITE TICKER BUILDER (AT GREEN & WHITE BORDER) =====
  function setupInfiniteTicker(itemsList) {
    if (!heroTickerTrack) return;

    let items = itemsList;
    if (!items || items.length === 0) {
      items = [
        { title: 'SCHOLARSHIPS & FELLOWSHIPS', icon: 'fa-award', category: 'Scholarship/Fellowship' },
        { title: 'CORPORATE & LEGAL INTERNSHIPS', icon: 'fa-user-graduate', category: 'Internships' },
        { title: 'NATIONAL & GLOBAL MOOT COURTS', icon: 'fa-scale-balanced', category: 'Moot Court Competition' },
        { title: 'CALL FOR PAPERS & ESSAYS', icon: 'fa-file-signature', category: 'Call for Papers' },
        { title: 'SCOPUS INDEXED PUBLICATIONS', icon: 'fa-book-open', category: 'Scopus' },
        { title: 'JUDICIAL CLERKSHIPS & CHAMBERS', icon: 'fa-building-columns', category: 'Internships' },
        { title: 'CONFERENCES & WORKSHOPS', icon: 'fa-microphone', category: 'Conferences/Seminars' },
        { title: 'CERTIFICATE COURSES & TRAINING', icon: 'fa-certificate', category: 'Certificate Courses' },
        { title: 'FREE STUDENT LEGAL DESK', icon: 'fa-shield-halved', category: 'All' },
        { title: 'VERIFIED ACTIVE DEADLINES', icon: 'fa-bolt', category: 'All' }
      ];
    }

    // Build single group HTML
    const groupHtml = items.map(item => {
      const text = typeof item === 'string' ? item : item.title;
      const icon = (typeof item === 'object' && item.icon) ? item.icon : 'fa-star';
      const cat = (typeof item === 'object' && item.category) ? item.category : 'All';
      return `<button type="button" class="ticker-item" data-category="${escapeHTML(cat)}"><i class="fa-solid ${escapeHTML(icon)}"></i> <span>${escapeHTML(text)}</span></button><span class="ticker-dot">•</span>`;
    }).join('');

    // Seamless continuous infinite loop with identical cloned groups
    heroTickerTrack.innerHTML = `
      <div class="ticker-group">
        ${groupHtml}
      </div>
      <div class="ticker-group" aria-hidden="true">
        ${groupHtml}
      </div>
    `;

    attachTickerClickEvents();
  }

  function attachTickerClickEvents() {
    if (!heroTickerTrack) return;
    heroTickerTrack.querySelectorAll('.ticker-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.category;
        if (cat) {
          activeFilter = cat;
          searchQuery = '';
          if (liveSearchInput) {
            liveSearchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          }
          document.querySelectorAll('.filter-chip').forEach(c => {
            c.classList.toggle('is-active', c.dataset.filter === activeFilter);
          });
          renderPosts();
          const oppSection = document.getElementById('opportunities');
          if (oppSection) oppSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // Admin Live Ticker Tab Controller
  function loadTickerToEditor() {
    if (!tickerItemsInput || !heroTickerTrack) return;
    const items = [];
    const firstGroup = heroTickerTrack.querySelector('.ticker-group');
    const sourceEl = firstGroup || heroTickerTrack;
    sourceEl.querySelectorAll('.ticker-item').forEach(el => {
      const text = el.querySelector('span')?.textContent.trim() || el.textContent.trim();
      if (text) items.push(text);
    });
    if (items.length > 0) {
      tickerItemsInput.value = items.join(' • ');
    }
  }

  if (adminTickerForm) {
    adminTickerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = tickerItemsInput.value.trim();
      if (!raw || !heroTickerTrack) return;

      const segments = raw.split(/[•,]/).map(s => s.trim()).filter(Boolean);
      const itemsList = segments.map(seg => ({
        title: seg,
        icon: 'fa-bullhorn',
        category: 'All'
      }));

      setupInfiniteTicker(itemsList);
      await saveSiteSettings({ tickerText: raw });
      alert('Live Ticker updated and continuously running infinitely!');
    });
  }

  // Admin Data Backup Tools
  if (adminExportJsonBtn) {
    adminExportJsonBtn.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPosts, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `purnea_opportunities_backup_${Date.now()}.json`);
      dlAnchor.click();
    });
  }

  if (adminResetDefaultsBtn) {
    adminResetDefaultsBtn.addEventListener('click', async () => {
      if (confirm('Reload master verified opportunities? Any unsaved edits will be refreshed.')) {
        try {
          const res = await fetch('posts.json');
          if (res.ok) {
            allPosts = await res.json();
            renderPosts();
            renderDaily(allPosts);
            renderAdminTable();
            renderAdminMetrics();
            alert('Default verified notices successfully restored.');
          }
        } catch (err) {
          alert('Could not reload defaults: ' + err.message);
        }
      }
    });
  }

  // ===== ADVISORY DESK DRAWER CONTROLLER =====
  function toggleAdvisorDrawer(show) {
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

  function appendAdvisorMessage(role, htmlContent) {
    if (!aiChatBody) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${role === 'user' ? 'ai-user' : 'ai-bot'}`;
    msgDiv.innerHTML = `
      <div class="ai-msg-avatar"><i class="fa-solid ${role === 'user' ? 'fa-user' : 'fa-graduation-cap'}"></i></div>
      <div class="ai-msg-bubble">${htmlContent}</div>
    `;
    aiChatBody.appendChild(msgDiv);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;
  }

  async function submitAdvisorInquiry(query) {
    appendAdvisorMessage('user', escapeHTML(query));

    const typingId = 'typing_' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message ai-bot';
    typingDiv.id = typingId;
    typingDiv.innerHTML = `
      <div class="ai-msg-avatar"><i class="fa-solid fa-graduation-cap"></i></div>
      <div class="ai-msg-bubble"><i class="fa-solid fa-spinner fa-spin"></i> Consulting database &amp; drafting guidance...</div>
    `;
    aiChatBody.appendChild(typingDiv);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (response.ok) {
        const data = await response.json();
        const placeholder = document.getElementById(typingId);
        if (placeholder) placeholder.remove();

        if (data.reply) {
          const formatted = data.reply
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\*/g, '<br>•')
            .replace(/\n/g, '<br>');
          appendAdvisorMessage('bot', formatted);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend advisory fallback:', err);
    }

    const placeholder = document.getElementById(typingId);
    if (placeholder) placeholder.remove();

    let reply = '';
    const q = query.toLowerCase();

    if (q.includes('moot')) {
      reply = `<strong>12th National Moot Court Competition 2026</strong> is currently live on our board:<br>
      • <strong>Subject:</strong> Constitutional Law &amp; Emerging Cyber Jurisprudence<br>
      • <strong>Honours:</strong> INR 1,50,000 Prize Pool + Tier-1 Corporate Internships<br>
      • <strong>Registration Deadline:</strong> 28th September 2026<br>
      <em>Recommendation: Ensure citations conform strictly with the Bluebook 21st Edition standard. Use our Moot Court Checklist tool under Student Tools above.</em>`;
    } else if (q.includes('intern') || q.includes('aethel')) {
      reply = `<strong>Currently Active Internship Listings:</strong><br>
      1. <strong>Aethel Legal International</strong>: Corporate commercial law, contract drafting &amp; IP compliance (Deadline: Oct 15).<br>
      2. <strong>Assistant Incubation Manager</strong>: Startup incubation &amp; grant coordination.<br>
      3. <strong>Jagran Lakecity University</strong>: Student research associates.<br>
      <em>Tip: Generate your formal application letter using the Cover Letter Builder in the Student Tools section!</em>`;
    } else if (q.includes('scholarship') || q.includes('fellowship')) {
      reply = `<strong>Active Scholarships &amp; Grants:</strong><br>
      • <strong>National Merit Scholarship 2026</strong> for Undergraduate &amp; Postgraduate scholars.<br>
      • Covers comprehensive semester tuition and research stipends.<br>
      • Ensure your verified marksheets and institution endorsement letters are ready.`;
    } else if (q.includes('contract') || q.includes('nda') || q.includes('legal') || q.includes('service')) {
      reply = `<strong>Purnea Rebirth Foundation Legal Desk:</strong><br>
      We provide students, scholars, and early-stage founders direct advisory in:<br>
      • Commercial Contract Drafting &amp; NDA formulation<br>
      • Freelancer Agreement reviews<br>
      • Academic Publication rights &amp; Copyright<br>
      📞 <strong>Desk Helpline:</strong> <a href="tel:+919798488837" style="color:#0E6770; font-weight:700;">+91 97984 88837</a> or submit a Priority Consultation under the Student Tools section!`;
    } else {
      reply = `Thank you for consulting the Noticeboard Advisory Desk.<br>
      • <strong>Browse Active Notices:</strong> Use the category filter chips above for Internships, Moot Courts, Scopus Papers, and Scholarships.<br>
      • <strong>Personalized Guidance:</strong> Contact our advisory coordinators directly at <strong>+91 97984 88837</strong> or email <strong>info@thenoticeboard.edu</strong>.`;
    }

    appendAdvisorMessage('bot', reply);
  }

  // ===== SINGLE UNIFIED NAVIGATION & SCROLL OBSERVER =====
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

  if (navCloseBtn) navCloseBtn.addEventListener('click', () => toggleMobileNav(false));

  if (mainNav) {
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMobileNav(false));
    });
  }

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 860 && mainNav && mainNav.classList.contains('is-open')) {
      if (!mainNav.contains(e.target) && !navToggle.contains(e.target)) {
        toggleMobileNav(false);
      }
    }
  });

  // Single Header Scroll Spy
  const mainNavLinks = document.querySelectorAll('.main-nav .nav-link');
  const scrollSectionIds = ['hero', 'opportunities', 'student-tools', 'courses', 'advisory-board', 'partners', 'about'];

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 160;
    let currentId = 'hero';

    for (const secId of scrollSectionIds) {
      const sec = document.getElementById(secId);
      if (sec) {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentId = secId;
          break;
        }
      }
    }

    mainNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('is-active', href === `#${currentId}`);
    });
  }, { passive: true });

  // Hero saved trigger
  if (heroSavedTrigger) {
    heroSavedTrigger.addEventListener('click', () => {
      activeFilter = 'Saved';
      document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.toggle('is-active', c.dataset.filter === 'Saved');
      });
      renderPosts();
      const oppSection = document.getElementById('opportunities');
      if (oppSection) oppSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Live search
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

  if (heroSearchActionBtn) {
    heroSearchActionBtn.addEventListener('click', () => {
      const oppSection = document.getElementById('opportunities');
      if (oppSection) oppSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.querySelectorAll('.quick-search-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const filterCat = pill.dataset.searchFilter;
      activeFilter = filterCat;
      searchQuery = '';
      if (liveSearchInput) {
        liveSearchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      }

      document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.toggle('is-active', c.dataset.filter === activeFilter);
      });

      renderPosts();

      const oppSection = document.getElementById('opportunities');
      if (oppSection) oppSection.scrollIntoView({ behavior: 'smooth' });
    });
  });

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

  // Admin Modal Controls
  if (adminModalClose) adminModalClose.addEventListener('click', () => toggleAdminModal(false));

  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) toggleAdminModal(false);
    });
  }

  document.querySelectorAll('[data-admin-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const target = tabBtn.dataset.adminTab;
      switchAdminTab(target);
    });
  });

  if (adminAddNewBtn) {
    adminAddNewBtn.addEventListener('click', () => {
      resetAdminForm();
      switchAdminTab('admin-form');
    });
  }

  if (adminFormCancelBtn) {
    adminFormCancelBtn.addEventListener('click', () => {
      resetAdminForm();
      switchAdminTab('admin-list');
    });
  }

  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', () => renderAdminTable());
  }

  if (adminOpportunityForm) {
    adminOpportunityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const existingId = editOpportunityId.value;

      const oppData = {
        title: document.getElementById('formTitle').value.trim(),
        category: document.getElementById('formCategory').value,
        deadline: document.getElementById('formDeadline').value,
        date: document.getElementById('formDate').value || new Date().toISOString().split('T')[0],
        tag: document.getElementById('formTag').value.trim() || 'General',
        link: document.getElementById('formLink').value.trim(),
        image: document.getElementById('formImage').value.trim() || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        description: document.getElementById('formDescription').value.trim(),
        daily: document.getElementById('formDaily').checked
      };

      const submitBtn = document.getElementById('adminFormSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      }

      try {
        let savedItem = null;
        try {
          savedItem = await saveOpportunityToFirestore(oppData, existingId || null);
        } catch (dbErr) {
          console.warn('Firestore write warning (saving in memory):', dbErr);
          savedItem = { id: existingId || Date.now(), ...oppData };
        }

        if (existingId) {
          const idx = allPosts.findIndex(p => String(p.id) === String(existingId));
          if (idx !== -1) allPosts[idx] = { id: existingId, ...oppData };
        } else {
          allPosts.unshift({ id: savedItem.id, ...oppData });
        }

        if (oppData.daily) {
          allPosts.forEach(p => {
            if (String(p.id) !== String(savedItem.id)) p.daily = false;
          });
        }

        renderPosts();
        renderDaily(allPosts);
        renderAdminTable();
        renderAdminMetrics();
        resetAdminForm();
        switchAdminTab('admin-list');
      } catch (err) {
        console.error('Save error:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Save to Database';
        }
      }
    });
  }

  // Advisor triggers
  if (floatingAdvisorBtn) floatingAdvisorBtn.addEventListener('click', () => toggleAdvisorDrawer(true));
  if (aiModalClose) aiModalClose.addEventListener('click', () => toggleAdvisorDrawer(false));

  if (aiModal) {
    aiModal.addEventListener('click', (e) => {
      if (e.target === aiModal) toggleAdvisorDrawer(false);
    });
  }

  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      if (aiChatInput) {
        aiChatInput.value = prompt;
        submitAdvisorInquiry(prompt);
      }
    });
  });

  if (aiChatForm) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = aiChatInput.value.trim();
      if (!message) return;
      submitAdvisorInquiry(message);
      aiChatInput.value = '';
    });
  }

  // Auth modal triggers
  if (modalClose) modalClose.addEventListener('click', () => toggleAuthModal(false));

  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) toggleAuthModal(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (authModal.classList.contains('is-active')) toggleAuthModal(false);
        if (aiModal && aiModal.classList.contains('is-active')) toggleAdvisorDrawer(false);
        if (adminAuthModal && adminAuthModal.classList.contains('is-active')) toggleAdminAuthModal(false);
        if (adminModal && adminModal.classList.contains('is-active')) toggleAdminModal(false);
      }
    });
  }

  if (tabSignIn && tabCreate) {
    tabSignIn.addEventListener('click', () => switchAuthTab('signin'));
    tabCreate.addEventListener('click', () => switchAuthTab('create'));
  }

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      try {
        const result = await loginWithGoogle();
        currentUser = result.user;
        updateAuthHeader();
        toggleAuthModal(false);
        const cloudBookmarks = await getUserBookmarks(currentUser.uid);
        if (cloudBookmarks) {
          cloudBookmarks.forEach(id => savedItemIds.add(String(id)));
          saveLocalBookmarks();
        }
        renderPosts();
      } catch (err) {
        console.warn('Google sign-in fallback:', err);
      }
    });
  }

  if (formSignIn) {
    formSignIn.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('signinEmail').value.trim();
      const username = email.split('@')[0] || 'Student';
      currentUser = { displayName: username, email };
      localStorage.setItem('authUser', username);
      updateAuthHeader();
      toggleAuthModal(false);
      formSignIn.reset();
      renderPosts();
    });
  }

  if (formCreate) {
    formCreate.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('createName').value.trim() || 'Student';
      const email = document.getElementById('createEmail').value.trim();
      currentUser = { displayName: name, email };
      localStorage.setItem('authUser', name);
      updateAuthHeader();
      toggleAuthModal(false);
      formCreate.reset();
      renderPosts();
    });
  }

  // ===== INITIAL LOAD EXECUTION =====
  loadLocalBookmarks();
  initStudentTools();
  checkAdminRoute();

  // Initialize Firebase Auth & Data
  await initFirebase();
  const auth = getFirebaseAuth();

  if (auth) {
    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      updateAuthHeader();
      if (user) {
        const cloudBookmarks = await getUserBookmarks(user.uid);
        if (cloudBookmarks && cloudBookmarks.length > 0) {
          cloudBookmarks.forEach(id => savedItemIds.add(String(id)));
          saveLocalBookmarks();
        }
      }
      renderPosts();
    });
  } else {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      currentUser = { displayName: savedUser, email: savedUser.includes('@') ? savedUser : `${savedUser}@university.edu` };
    }
    updateAuthHeader();
  }

  // Load Opportunities from Firestore or local data
  let firestoreData = null;
  try {
    firestoreData = await getOpportunities();
  } catch (err) {
    console.warn('Firestore load error, falling back:', err);
  }

  if (firestoreData && firestoreData.length > 0) {
    allPosts = firestoreData;
  } else if (window.postsData && Array.isArray(window.postsData)) {
    allPosts = window.postsData;
  } else {
    try {
      const res = await fetch('posts.json');
      if (res.ok) {
        allPosts = await res.json();
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }

  allPosts.sort((a, b) => new Date(b.date || '2026-01-01') - new Date(a.date || '2026-01-01'));
  buildFilters(allPosts);
  renderDaily(allPosts);
  renderPosts();
  renderSavedTrackerTool();
  loadMootChecklist();
  renderAdminTable();
  renderAdminMetrics();

  // Load site settings (ticker) if customized, else initialize default continuous infinite ticker
  try {
    const settings = await getSiteSettings();
    if (settings && settings.tickerText) {
      const segments = settings.tickerText.split(/[•,]/).map(s => s.trim()).filter(Boolean);
      setupInfiniteTicker(segments.map(s => ({ title: s, icon: 'fa-bullhorn', category: 'All' })));
    } else {
      setupInfiniteTicker();
    }
  } catch {
    setupInfiniteTicker();
  }
});
