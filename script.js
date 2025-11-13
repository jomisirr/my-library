/* ==============================================================
   My Local Library – script.js
   (works with index.html, about.html, contact.html)
   ============================================================== */

const $ = id => document.getElementById(id); // tiny helper

const booksGrid      = $('books-grid');
const bookForm       = $('book-form');
const searchInput    = $('search');
const categoryFilter = $('category-filter');
const themeToggle    = $('theme-toggle');
const scrollTopBtn   = $('scrollTop');
const hamburger      = document.querySelector('.hamburger');
const editModal      = $('edit-modal');
const editForm       = $('edit-form');
const contactForm    = $('contact-form');

// ------------------------------------------------------------------
// 1. BOOKS DATA (saved in localStorage)
let books = JSON.parse(localStorage.getItem('library')) || [
  { id: 1, title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" },
  { id: 2, title: "1984", author: "George Orwell", category: "Dystopia",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" },
  { id: 3, title: "Power Play Edition: First edition", author: "Rick Campbell", category: "Fiction",
    cover: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80" },
  { id: 4, title: "My love story", author: "Casey Howard", category: "Romance",
    cover: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80" }
];
let editingBookId = null; // For edit mode

// ------------------------------------------------------------------
// 2. THEME (dark / light)
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    themeToggle.innerHTML = isDark
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// ------------------------------------------------------------------
// 3. PARTICLES.JS INIT (home only)
if ($('particles-js')) {
  particlesJS('particles-js', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: '#1abc9c' },
      shape: { type: 'circle' },
      opacity: { value: 0.5, random: true },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 150, color: '#1abc9c', opacity: 0.4, width: 1 },
      move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
    },
    retina_detect: true
  });
}

// ------------------------------------------------------------------
// 4. RENDER BOOKS
function renderBooks(list = books) {
  if (!booksGrid) return;
  booksGrid.innerHTML = '';
  if (!list.length) {
    booksGrid.innerHTML = '<p class="no-books">No books found. Add one to get started!</p>';
    return;
  }
  list.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id;
    card.innerHTML = `
      <img src="${book.cover || 'https://via.placeholder.com/300x400?text=No+Cover'}"
           alt="${escapeHtml(book.title)}" onerror="this.src='https://via.placeholder.com/300x400?text=No+Cover'">
      <div class="book-info">
        <h3>${escapeHtml(book.title)}</h3>
        <p><strong>by</strong> ${escapeHtml(book.author)}</p>
        <span class="category-tag">${escapeHtml(book.category)}</span>
        <div style="margin-top: 10px;">
          <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i> Edit</button>
          <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
    booksGrid.appendChild(card);
  });
}

// Simple HTML-escape (prevents XSS)
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ------------------------------------------------------------------
// 5. CATEGORY FILTER OPTIONS
function updateCategoryFilter() {
  if (!categoryFilter) return;
  const cats = [...new Set(books.map(b => b.category))].sort();
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  cats.forEach(c => {
    const opt = new Option(c, c);
    categoryFilter.appendChild(opt);
  });
}

// ------------------------------------------------------------------
// 6. ADD/EDIT BOOK
if (bookForm) {
  bookForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = $('title').value.trim();
    const author = $('author').value.trim();
    const category = $('category').value.trim();
    const cover = $('cover').value.trim();

    if (!title || !author || !category) {
      alert('Please fill in Title, Author, and Category.');
      return;
    }

    const newBook = { title, author, category, cover };

    if (editingBookId) {
      // Edit mode
      books = books.map(b => b.id === editingBookId ? { ...b, ...newBook } : b);
      editingBookId = null;
      bookForm.querySelector('button[type="submit"]').textContent = 'Add Book';
      if (editModal) editModal.style.display = 'none';
    } else {
      // Add mode
      newBook.id = Date.now();
      books.push(newBook);
    }

    localStorage.setItem('library', JSON.stringify(books));
    renderBooks();
    updateCategoryFilter();
    bookForm.reset();
  });
}

// ------------------------------------------------------------------
// 7. SEARCH + FILTER
function applyFilters() {
  const term = searchInput?.value.toLowerCase() || '';
  const cat = categoryFilter?.value || '';
  const filtered = books.filter(b => {
    const matchesTerm = b.title.toLowerCase().includes(term) ||
                        b.author.toLowerCase().includes(term);
    const matchesCat = !cat || b.category === cat;
    return matchesTerm && matchesCat;
  });
  renderBooks(filtered);
}
if (searchInput) searchInput.addEventListener('input', applyFilters);
if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);

// ------------------------------------------------------------------
// 8. EDIT/DELETE HANDLERS
if (booksGrid) {
  booksGrid.addEventListener('click', e => {
    const card = e.target.closest('.book-card');
    if (!card) return;
    const id = Number(card.dataset.id);

    if (e.target.closest('.edit-btn')) {
      const book = books.find(b => b.id === id);
      if (book) {
        editingBookId = id;
        $('title').value = book.title;
        $('author').value = book.author;
        $('category').value = book.category;
        $('cover').value = book.cover || '';
        bookForm.querySelector('button[type="submit"]').textContent = 'Save Changes';
        if (editModal) editModal.style.display = 'flex';
      }
    } else if (e.target.closest('.delete-btn')) {
      if (confirm('Delete this book?')) {
        books = books.filter(b => b.id !== id);
        localStorage.setItem('library', JSON.stringify(books));
        renderBooks();
        updateCategoryFilter();
      }
    }
  });
}

// Edit Modal Close
const closeModal = document.querySelector('.close');
if (closeModal) {
  closeModal.addEventListener('click', () => {
    if (editModal) editModal.style.display = 'none';
    editingBookId = null;
    if (bookForm) bookForm.reset();
    if (bookForm) bookForm.querySelector('button[type="submit"]').textContent = 'Add Book';
  });
}
if (editModal) {
  window.addEventListener('click', e => {
    if (e.target === editModal) {
      editModal.style.display = 'none';
      editingBookId = null;
      if (bookForm) bookForm.reset();
      if (bookForm) bookForm.querySelector('button[type="submit"]').textContent = 'Add Book';
    }
  });
}

// ------------------------------------------------------------------
// 9. MOBILE HAMBURGER MENU
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
  });
}

// ------------------------------------------------------------------
// 10. CONTACT FORM
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const successMsg = e.target.querySelector('.success-msg');
    if (successMsg) successMsg.style.display = 'block';
    setTimeout(() => {
      e.target.reset();
      if (successMsg) successMsg.style.display = 'none';
    }, 2000);
  });
}

// ------------------------------------------------------------------
// 11. SCROLL-TO-TOP BUTTON
window.addEventListener('scroll', () => {
  if (scrollTopBtn) scrollTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
});
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ------------------------------------------------------------------
// 12. INITIALISE
renderBooks();
updateCategoryFilter();