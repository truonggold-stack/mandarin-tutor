// UI Module
// Handles all DOM manipulation and UI updates

/**
 * Switch between tabs
 * @param {string} tabName - Name of tab to switch to
 */
export function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

/**
 * Display translation result
 * @param {Object} translation - Translation object
 */
export function displayTranslationResult(translation) {
    document.getElementById('result-chinese').textContent = translation.chinese;
    document.getElementById('result-pinyin').textContent = translation.pinyin;
    document.getElementById('result-english').textContent = translation.english;
    document.getElementById('translation-result').style.display = 'block';
}

/**
 * Display saved translations
 * @param {Array} translations - Array of translation objects
 */
export function displaySavedTranslations(translations) {
    const listDiv = document.getElementById('translations-list');
    
    if (translations.length === 0) {
        listDiv.innerHTML = '<p class="empty-state">No translations saved yet. Start translating!</p>';
        return;
    }
    
    listDiv.innerHTML = translations.map((t, index) => `
        <div class="translation-item">
            <div class="translation-content">
                <div class="chinese-lg">${t.chinese}</div>
                <div class="pinyin-sm">${t.pinyin}</div>
                <div class="english-sm">${t.english}</div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn-icon" onclick="window.speakChineseGlobal('${t.chinese}')">🔊</button>
                <button class="btn-icon btn-remove" onclick="window.deleteTranslationGlobal(${index})" title="Delete translation">🗑️</button>
            </div>
        </div>
    `).join('');
}

/**
 * Display lesson list
 * @param {Array} lessons - Array of lesson objects
 */
export function displayLessonList(lessons) {
    const lessonListDiv = document.getElementById('lesson-list');
    if (!lessonListDiv) return;
    
    if (lessons.length === 0) {
        lessonListDiv.innerHTML = '<p class="empty-state">No lessons yet. Create one from translations or upload audio!</p>';
        return;
    }
    
    lessonListDiv.innerHTML = lessons.map(lesson => `
        <div class="lesson-list-item">
            <div class="lesson-info">
                <h4>${lesson.name}</h4>
                <p>${lesson.exercises.length} exercises • Created ${new Date(lesson.date).toLocaleDateString()}</p>
            </div>
            <div class="lesson-actions">
                <button class="btn-secondary btn-sm" onclick="window.loadLessonInPracticeGlobal('${lesson.id}')">Practice</button>
                <button class="btn-remove" onclick="window.deleteLessonGlobal('${lesson.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

/**
 * Populate lesson selector dropdown
 * @param {Array} lessons - Array of lesson objects
 */
export function populateLessonSelector(lessons) {
    const select = document.getElementById('lesson-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a lesson...</option>';
    
    lessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.id;
        option.textContent = lesson.name;
        select.appendChild(option);
    });
}

/**
 * Display exercise in practice mode
 * @param {Object} exercise - Exercise object
 * @param {number} index - Current index
 * @param {number} total - Total exercises
 */
export function displayExercise(exercise, index, total) {
    document.getElementById('chinese-text').textContent = exercise.chinese;
    document.getElementById('pinyin-text').textContent = exercise.pinyin;
    document.getElementById('english-text').textContent = exercise.english;
    document.getElementById('exercise-counter').textContent = `${index + 1} / ${total}`;
    document.getElementById('play-recording').style.display = 'none';
}

/**
 * Show/hide exercise container
 * @param {boolean} show - Whether to show
 */
export function toggleExerciseContainer(show) {
    const container = document.getElementById('exercise-container');
    if (container) {
        container.style.display = show ? 'block' : 'none';
    }
}

/**
 * Update progress display
 * @param {Object} progressData - Progress data object
 */
export function updateProgressDisplay(progressData) {
    document.getElementById('total-exercises').textContent = progressData.totalExercises;
    document.getElementById('avg-score').textContent = 
        progressData.totalExercises > 0 
            ? Math.round(progressData.totalScore / progressData.totalExercises) + '%' 
            : '0%';
    document.getElementById('lessons-completed').textContent = progressData.lessonsCompleted;
    document.getElementById('practice-time').textContent = progressData.practiceTime;
    
    // Display game history
    displayGameHistory(progressData.gameHistory || []);
}

/**
 * Display game history in progress tab
 * @param {Array} gameHistory - Array of game results
 */
export function displayGameHistory(gameHistory) {
    const historyContainer = document.getElementById('game-history-list');
    
    if (!historyContainer) return;
    
    if (!gameHistory || gameHistory.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">No games played yet!</p>';
        return;
    }
    
    historyContainer.innerHTML = gameHistory
        .slice()
        .reverse()
        .map((game, index) => `
            <div class="game-history-item">
                <div>
                    <div style="font-weight: 600; color: #333;">${game.firstTryMatches}/${game.totalPairs} Correct (First Try)</div>
                    <div class="game-date">${new Date(game.date).toLocaleDateString()} - ${new Date(game.date).toLocaleTimeString()}</div>
                </div>
                <div>
                    <span class="game-score">${game.score}%</span>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 5px;">⏱️ ${game.time}</div>
                </div>
            </div>
        `).join('');
}

/**
 * Update game stats display
 * @param {Object} stats - Game statistics
 */
export function updateGameStats(stats) {
    document.getElementById('move-count').textContent = stats.moveCount || 0;
    document.getElementById('match-count').textContent = 
        `${stats.matchedPairs || 0} / ${stats.totalPairs || 0}`;
    document.getElementById('game-time').textContent = stats.formattedTime || '0:00';
}

/**
 * Show game result
 * @param {Object} result - Game result object
 */
export function showGameResult(result) {
    document.getElementById('final-time').textContent = result.formattedTime;
    document.getElementById('final-moves').textContent = result.moveCount;
    document.getElementById('game-result').style.display = 'block';
}

/**
 * Hide game result
 */
export function hideGameResult() {
    document.getElementById('game-result').style.display = 'none';
}

/**
 * Show message to user
 * @param {string} type - 'success', 'error', or 'info'
 * @param {string} message - Message text
 */
export function showMessage(type, message) {
    alert(message); // Simple implementation, can be enhanced
}

/**
 * Render game board
 * @param {Array} chinesePairs - Chinese cards
 * @param {Array} imagePairs - Image cards
 */
export function renderGameBoard(chinesePairs, imagePairs) {
    const gameBoard = document.getElementById('game-board');
    
    gameBoard.innerHTML = `
        <div class="game-columns">
            <div class="game-column" id="chinese-column">
                <h3>Chinese 中文</h3>
                <div class="cards-container" id="chinese-cards"></div>
            </div>
            <div class="game-column" id="image-column">
                <h3>Match the Picture!</h3>
                <div class="cards-container" id="image-cards"></div>
            </div>
        </div>
    `;
    
    const chineseContainer = document.getElementById('chinese-cards');
    const imageContainer = document.getElementById('image-cards');
    
    // Render Chinese cards
    chinesePairs.forEach(pair => {
        const card = document.createElement('div');
        card.className = 'drag-card draggable';
        card.draggable = true;
        card.dataset.pairId = pair.id;
        card.innerHTML = `
            <div class="card-content">
                <div class="card-chinese">${pair.chinese}</div>
                <div class="card-pinyin">${pair.pinyin}</div>
            </div>
        `;
        chineseContainer.appendChild(card);
    });
    
    // Render image cards
    imagePairs.forEach(pair => {
        const card = document.createElement('div');
        card.className = 'drag-card drop-target image-card';
        card.dataset.pairId = pair.id;
        card.innerHTML = `
            <div class="card-content">
                <div class="card-emoji">${pair.emoji}</div>
                <div class="card-label">${pair.english}</div>
            </div>
        `;
        imageContainer.appendChild(card);
    });
}

/**
 * Clear input field
 * @param {string} elementId - ID of input element
 */
export function clearInput(elementId) {
    const input = document.getElementById(elementId);
    if (input) {
        input.value = '';
    }
}

/**
 * Get input value
 * @param {string} elementId - ID of input element
 * @returns {string} Input value
 */
export function getInputValue(elementId) {
    const input = document.getElementById(elementId);
    return input ? input.value : '';
}

/**
 * Set button text
 * @param {string} elementId - ID of button element
 * @param {string} text - Button text
 */
export function setButtonText(elementId, text) {
    const button = document.getElementById(elementId);
    if (button) {
        button.textContent = text;
    }
}

/**
 * Toggle element visibility
 * @param {string} elementId - ID of element
 * @param {boolean} show - Whether to show
 */
export function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * Display saved games list
 * @param {Array} games - Array of game objects
 */
export function displaySavedGames(games) {
    const container = document.getElementById('saved-games-list');
    if (!container) return;

    if (!games || games.length === 0) {
        container.innerHTML = '<p class="empty-state">No saved games yet. Create a game from your translations on the Home tab!</p>';
        return;
    }

    container.innerHTML = games.map((game, index) => `
        <div class="saved-game-card" data-game-id="${game.id}">
            <div class="game-card-header">
                <h4>${game.name}</h4>
                <span class="game-date">${new Date(game.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="game-card-info">
                <span class="game-pair-count">${game.pairs.length} pairs</span>
                ${game.bestTime ? `<span class="game-best-time">Best: ${game.bestTime}</span>` : ''}
            </div>
            <div class="game-card-actions">
                <button class="btn-primary btn-small" onclick="window.playGame(${index})">
                    ▶️ Play
                </button>
                <button class="btn-secondary btn-small" onclick="window.deleteGame(${index})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}
