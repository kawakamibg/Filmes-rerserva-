// ================= VERIFICAÇÃO DE LOGIN =================
// Checa se o usuário está logado antes de carregar a página principal
const currentUser = localStorage.getItem('letterboxd_user');
if (!currentUser) {
    // Se não tiver usuário salvo, expulsa para a tela de login
    window.location.href = 'login.html';
}
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Lógica do botão Sair (Logout)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Remove o usuário do navegador e volta pro login
            localStorage.removeItem('letterboxd_user');
            window.location.href = 'login.html';
        });
    }
    const form = document.getElementById('movie-form');
    const movieGrid = document.getElementById('movie-grid');
    const watchlistContainer = document.getElementById('watchlist-container');
    const itemTypeSelect = document.getElementById('item-type');
    const watchedFields = document.getElementById('watched-fields');
    const tabsContainer = document.querySelector('.tabs');
    const tabContents = document.querySelectorAll('.tab-content');
    // ================= INTEGRAÇÃO TMDB (BUSCA INTELIGENTE) =================
    const TMDB_API_KEY = '14ee92810316ee5630394dfd5053e218';
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w500';

    const inputTitulo = document.getElementById('movie-title');
    const inputPoster = document.getElementById('movie-poster-url');
    const resultsContainer = document.getElementById('tmdb-results');
    let searchTimeout;

    // Fica "escutando" o que você digita no campo de título
    inputTitulo.addEventListener('input', (e) => {
        clearTimeout(searchTimeout); // Evita buscar a cada letra, espera você parar de digitar
        const query = e.target.value.trim();
        
        // Só busca se tiver 3 letras ou mais
        if (query.length < 3) {
            resultsContainer.style.display = 'none';
            return;
        }

        // Espera meio segundo depois que você parar de digitar para fazer a busca
        searchTimeout = setTimeout(() => {
            buscarFilmesTMDB(query);
        }, 500); 
    });

    async function buscarFilmesTMDB(query) {
        try {
            const resposta = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`);
            const dados = await resposta.json();
            
            if (dados.results && dados.results.length > 0) {
                mostrarResultados(dados.results.slice(0, 5)); // Mostra os 5 primeiros resultados
            } else {
                resultsContainer.style.display = 'none';
            }
        } catch (erro) {
            console.error('Erro ao buscar no TMDB:', erro);
        }
    }

    function mostrarResultados(filmes) {
        resultsContainer.innerHTML = ''; // Limpa resultados antigos
        
        filmes.forEach(filme => {
            // Pega o ano de lançamento
            const anoLancamento = filme.release_date ? filme.release_date.split('-')[0] : 'Ano desconhecido';
            // Monta a URL da capa
            const posterPath = filme.poster_path ? TMDB_IMG_URL + filme.poster_path : 'https://via.placeholder.com/40x60?text=Sem+Capa';
            
            // Cria o item na listinha
            const item = document.createElement('div');
            item.classList.add('tmdb-result-item');
            item.innerHTML = `
                <img src="${posterPath}" alt="Capa" class="tmdb-result-poster">
                <div class="tmdb-result-info">
                    <h4>${filme.title}</h4>
                    <p>${anoLancamento}</p>
                </div>
            `;
            
            // O que acontece quando você clica em um filme da lista:
            item.addEventListener('click', () => {
                inputTitulo.value = filme.title; // Preenche o título oficial
                inputPoster.value = posterPath;  // Preenche a URL da capa
                resultsContainer.style.display = 'none'; // Esconde a listinha
            });
            
            resultsContainer.appendChild(item);
        });
        
        resultsContainer.style.display = 'block'; // Mostra a listinha
    }

    // Esconde a lista de resultados se você clicar fora dela
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#add-movie')) {
            resultsContainer.style.display = 'none';
        }
    });
    // ================= FIM DA INTEGRAÇÃO TMDB =================

    // ===== NOVO: VARIÁVEIS DO MODAL =====
    const modal = document.getElementById('movie-detail-modal');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const modalPoster = document.getElementById('modal-poster-img');
    const modalTitle = document.getElementById('modal-title');
    const modalRating = document.getElementById('modal-rating');
    const modalReview = document.getElementById('modal-review');
    // ===================================

    // Chave para armazenar os filmes no localStorage
    const STORAGE_KEY = 'letterboxdCloneMovies';
    let moviesData = loadMoviesFromStorage();

    // --- Persistência de Dados (localStorage) ---

    function loadMoviesFromStorage() {
        const data = localStorage.getItem(STORAGE_KEY);
        // Retorna os dados parseados, ou a estrutura inicial
        return data ? JSON.parse(data) : {
            watched: [],
            watchlist: []
        };
    }

    function saveMoviesToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(moviesData));
    }

    // --- NOVO: Lógica do Modal de Detalhes ---
    
    function openDetailModal(movieId) {
        // 1. Encontrar o filme nos dados
        const movie = moviesData.watched.find(m => m.id === movieId);
        if (!movie) return; // Se não achar, não faz nada

        // 2. Preencher o modal com os dados do filme
        const finalPosterUrl = movie.poster.trim() === '' ? 'https://via.placeholder.com/300x450?text=Sem+Capa' : movie.poster;
        
        modalPoster.src = finalPosterUrl;
        modalPoster.alt = `Pôster de ${movie.title}`;
        modalTitle.textContent = movie.title;
        modalRating.innerHTML = `${createStarRating(movie.rating)} (${movie.rating})`;
        modalReview.textContent = movie.review || 'Sem comentário.';

        // 3. Mostrar o modal
        modal.classList.add('active');
    }

    function closeDetailModal() {
        modal.classList.remove('active');
    }
    
    // Eventos para fechar o modal
    modalCloseBtn.addEventListener('click', closeDetailModal);
    
    modal.addEventListener('click', (e) => {
        // Fecha o modal apenas se clicar no fundo (overlay)
        if (e.target === modal) {
            closeDetailModal();
        }
    });

    // --- Utilitários e Lógica de Formulário ---

    // Função para criar o HTML das estrelas
    function createStarRating(rating) {
        if (!rating) return '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHtml = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="fas fa-star" style="color: var(--text-secondary);"></i>';
        }

        return starsHtml;
    }

    // Alterna a visibilidade dos campos de nota e review
    function toggleWatchedFields() {
        watchedFields.style.display = itemTypeSelect.value === 'watched' ? 'block' : 'none';
        document.getElementById('movie-rating').required = itemTypeSelect.value === 'watched';
    }
    
    itemTypeSelect.addEventListener('change', toggleWatchedFields);

    // Adicionar Filme/Item (Função CRUD)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('movie-title').value;
        const posterUrl = document.getElementById('movie-poster-url').value;
        const itemType = itemTypeSelect.value;
        const newId = Date.now();

        if (itemType === 'watched') {
            const rating = document.getElementById('movie-rating').value;
            const review = document.getElementById('movie-review').value;

            if (!rating) {
                alert("Por favor, selecione uma nota para o filme assistido.");
                return;
            }

            moviesData.watched.unshift({ id: newId, title, poster: posterUrl, rating: parseFloat(rating), review, type: 'watched' });
        } else {
            moviesData.watchlist.unshift({ id: newId, title, poster: posterUrl, type: 'watchlist' });
        }

        saveMoviesToStorage();
        renderAll();
        form.reset();
        itemTypeSelect.value = 'watched';
        toggleWatchedFields();
    });

    // --- Funções de Renderização ---

    function renderWatchedGrid() {
        movieGrid.innerHTML = '';
        const watchedMovies = moviesData.watched;

        if (watchedMovies.length === 0) {
            movieGrid.innerHTML = '<p class="empty-message" style="grid-column: 1 / -1; color: var(--text-secondary);">Nenhum filme assistido na lista.</p>';
            return;
        }

        watchedMovies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            movieCard.dataset.id = movie.id;

            const finalPosterUrl = movie.poster.trim() === '' ? 'https://via.placeholder.com/200x300?text=Sem+Capa' : movie.poster;

            movieCard.innerHTML = `
                <img src="${finalPosterUrl}" alt="Pôster de ${movie.title}" class="movie-poster">
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <div class="movie-rating" data-rating="${movie.rating}">
                        ${createStarRating(movie.rating)} (${movie.rating})
                    </div>
                    <p class="movie-review">${movie.review || 'Sem comentário.'}</p>
                    
                    <div class="edit-form" style="display:none;">
                        <textarea class="edit-review" placeholder="Novo comentário">${movie.review || ''}</textarea>
                        <select class="edit-rating">
                        </select>
                        <button class="action-btn save-btn" data-id="${movie.id}">Salvar</button>
                    </div>
                </div>

                <div class="movie-actions">
                    <button class="action-btn edit-btn" data-id="${movie.id}">
                        <i class="fas fa-pen"></i> Editar
                    </button>
                    <button class="action-btn delete-btn" data-id="${movie.id}" data-type="watched">
                        <i class="fas fa-trash-alt"></i> Remover
                    </button>
                </div>
            `;
            
            // Preenche as opções de rating no formulário de edição
            const editRatingSelect = movieCard.querySelector('.edit-rating');
            editRatingSelect.innerHTML = document.getElementById('movie-rating').innerHTML;
            editRatingSelect.value = movie.rating;

            movieGrid.appendChild(movieCard);
        });
    }

    function renderWatchlist() {
        watchlistContainer.innerHTML = '';
        const watchlistItems = moviesData.watchlist;

        if (watchlistItems.length === 0) {
            watchlistContainer.innerHTML = '<p class="empty-message" id="empty-watchlist" style="color: var(--text-secondary);">Sua watchlist está vazia. Adicione um filme!</p>';
            return;
        }

        watchlistItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('watchlist-item');
            itemDiv.dataset.id = item.id;
            
            const finalPosterUrl = item.poster.trim() === '' ? 'https://via.placeholder.com/50x75?text=?' : item.poster;

            itemDiv.innerHTML = `
                <img src="${finalPosterUrl}" alt="Pôster de ${item.title}" class="watchlist-poster">
                <span class="watchlist-item-title">${item.title}</span>
                <button class="action-btn delete-btn" data-id="${item.id}" data-type="watchlist">
                    <i class="fas fa-trash-alt"></i> Remover
                </button>
                <button class="action-btn mark-watched-btn" data-id="${item.id}">
                    <i class="fas fa-check"></i> Marcar como Assistido
                </button>
            `;
            watchlistContainer.appendChild(itemDiv);
        });
    }
    
    function renderAll() {
        renderWatchedGrid();
        renderWatchlist();
    }


    // --- ATUALIZADO: Delegação de Eventos de Ação E Abertura de Modal ---
    document.addEventListener('click', (e) => {
        
        const actionBtn = e.target.closest('.action-btn');
        const movieCard = e.target.closest('.movie-card');

        // --- LÓGICA DOS BOTÕES DE AÇÃO (Editar, Deletar, etc.) ---
        if (actionBtn) {
            const id = parseInt(actionBtn.dataset.id);
            const type = actionBtn.dataset.type || 'watched';

            // Ação de REMOVER
            if (actionBtn.classList.contains('delete-btn')) {
                if (confirm(`Tem certeza que deseja remover "${actionBtn.closest('.movie-card')?.querySelector('h3')?.textContent || actionBtn.closest('.watchlist-item')?.querySelector('.watchlist-item-title')?.textContent}"?`)) {
                    moviesData[type] = moviesData[type].filter(item => item.id !== id);
                    saveMoviesToStorage();
                    renderAll();
                }
            }
            
            // Ação de EDITAR (Abrir Formulário)
            else if (actionBtn.classList.contains('edit-btn')) {
                const card = actionBtn.closest('.movie-card');
                const info = card.querySelector('.movie-info');
                const editForm = card.querySelector('.edit-form');
                const isEditing = editForm.style.display !== 'none';

                editForm.style.display = isEditing ? 'none' : 'block';
                actionBtn.innerHTML = isEditing ? '<i class="fas fa-pen"></i> Editar' : '<i class="fas fa-times"></i> Cancelar';
                info.querySelector('.movie-review').style.display = isEditing ? 'block' : 'none';
                info.querySelector('.movie-rating').style.display = isEditing ? 'block' : 'none';
            }

            // Ação de SALVAR EDIÇÃO
            else if (actionBtn.classList.contains('save-btn')) {
                const card = actionBtn.closest('.movie-card');
                const reviewTextarea = card.querySelector('.edit-review');
                const ratingSelect = card.querySelector('.edit-rating');

                const movieIndex = moviesData.watched.findIndex(m => m.id === id);
                if (movieIndex > -1) {
                    moviesData.watched[movieIndex].review = reviewTextarea.value;
                    moviesData.watched[movieIndex].rating = parseFloat(ratingSelect.value);
                    saveMoviesToStorage();
                    renderAll();
                }
            }

            // Ação de MARCAR COMO ASSISTIDO (mover de watchlist para watched)
            else if (actionBtn.classList.contains('mark-watched-btn')) {
                const itemIndex = moviesData.watchlist.findIndex(item => item.id === id);
                if (itemIndex > -1) {
                    const itemToMove = moviesData.watchlist.splice(itemIndex, 1)[0];
                    
                    itemToMove.type = 'watched';
                    itemToMove.rating = 3.0; // Pede uma nota inicial para ser editada
                    itemToMove.review = `Assistido após estar na Watchlist. Avalie e comente!`;
                    
                    moviesData.watched.unshift(itemToMove);
                    saveMoviesToStorage();
                    renderAll();
                    switchTab('watched'); // Troca para a aba de assistidos
                }
            }
            return; // Importante: Se clicou num botão de ação, não faz mais nada
        }

        // --- LÓGICA DE ABRIR O MODAL ---
        // Se o clique foi dentro de um card, MAS NÃO foi num botão de ação...
        if (movieCard) {
            // ...e também NÃO foi dentro do formulário de edição...
            const inEditForm = e.target.closest('.edit-form');
            if (!inEditForm) {
                // ...então abra o modal!
                const id = parseInt(movieCard.dataset.id);
                openDetailModal(id);
            }
        }
    });


    // --- Lógica de Abas ---
    tabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            switchTab(e.target.dataset.tab);
        }
    });

    function switchTab(targetTab) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`.tab-button[data-tab="${targetTab}"]`).classList.add('active');
        document.getElementById(`${targetTab}-list-section` || `${targetTab}-section`).classList.add('active');
    }

    renderAll();
    toggleWatchedFields(); // Configura o formulário inicial
    switchTab('watched'); // Começa na aba 'Assistidos'
});