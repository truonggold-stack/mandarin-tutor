// Main Module
// Application orchestration and initialization

import { sampleLessons, apiEndpoints, getApiUrl } from './config.js';
import { initializeAudio, speakChinese, speakEnglish } from './audio.js';
import { initializeTranslation, translateWord, addTranslation, getTranslations, clearTranslations, deleteTranslation } from './translation.js';
import { initializeLessons, createLesson, getLessons, getLesson, deleteLesson, exportAllLessons, importLessons } from './lessons.js';
import { initializePractice, loadLesson as loadPracticeLesson, getCurrentExercise, nextExercise, previousExercise, playReference, startPracticeRecording, stopPracticeRecording, isPracticeRecording, assessPronunciationWithAzure, generatePronunciationScore, savePronunciationRating, getCurrentLessonInfo } from './practice.js';
import { startNewGame, startCustomGame, getGameState, shuffleArray, handleDrop, handleDragStart, playPairAudio, endGame, isGameActive } from './game.js';
import { switchTab, displayTranslationResult, displaySavedTranslations, displayLessonList, populateLessonSelector, populateGameLessonSelector, displayExercise, toggleExerciseContainer, updateProgressDisplay, displaySavedGames, renderGameBoard, renderBalloonBoard, updateGameStats, hideGameResult, showGameResult } from './ui.js';
import { saveGames, loadGames, saveProgress, loadProgress, saveGameResult } from './storage.js';

const SHARED_LESSONS_URL = '/data/shared-lessons.json';
const SHARED_LESSONS_LAST_SYNC_KEY = 'sharedLessonsLastSyncAt';
const MAX_BALLOON_OPTIONS = 5;

let activeMatchPollingInterval = null;
let balloonGameState = null;

/**
 * Initialize the application
 */
export async function initializeApp() {
    console.log('🚀 Initializing Mandarin Tutor...');

    configureLocalPublishControls();
    renderLastSharedSyncTime();
    
    // Clear saved translations from previous session
    clearTranslations();
    
    // Initialize all modules
    initializeAudio();
    const translations = initializeTranslation();
    let lessons = initializeLessons();
    const progress = loadProgress();
    
    // Load and display saved games
    const savedGames = loadGames();
    displaySavedGames(savedGames);
    
    // Load sample lesson if no lessons exist
    if (lessons.length === 0) {
        sampleLessons.forEach(lesson => {
            createLesson(lesson.name, lesson.exercises);
        });
        lessons = getLessons();
    }

    // Merge shared lessons file if present (used for GitHub -> Netlify sync)
    const syncResult = await loadSharedLessonsFromRepo();
    if (syncResult.updated) {
        lessons = getLessons();
    }
    
    // Initialize UI
    displaySavedTranslations(translations);
    displayLessonList(lessons);
    populateLessonSelector(lessons);
    populateGameLessonSelector(lessons);
    updateProgressDisplay(progress);
    
    // Setup event listeners
    setupEventListeners();
    
    // Expose global functions for inline event handlers
    setupGlobalFunctions();
    
    console.log('Mandarin Tutor initialized successfully!');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
            if (btn.dataset.tab === 'translate') {
                displayLessonList(getLessons());
            }
            if (btn.dataset.tab === 'progress') {
                const progress = loadProgress();
                updateProgressDisplay(progress);
            }
        });
    });
    
    // Translation
    const translateBtn = document.getElementById('translate-btn');
    const englishInput = document.getElementById('english-input');
    
    if (translateBtn) {
        translateBtn.addEventListener('click', handleTranslation);
    }
    
    if (englishInput) {
        englishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleTranslation();
        });
    }
    
    // Practice
    const lessonSelect = document.getElementById('lesson-select');
    if (lessonSelect) {
        lessonSelect.addEventListener('change', handleLessonSelect);
    }
    
    const playRefBtn = document.getElementById('play-reference');
    if (playRefBtn) {
        playRefBtn.addEventListener('click', playReference);
    }
    
    // Record button
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
        recordBtn.addEventListener('click', handleRecording);
    }
    
    const prevBtn = document.getElementById('prev-exercise');
    const nextBtn = document.getElementById('next-exercise');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (previousExercise()) {
                const exercise = getCurrentExercise();
                const lessons = getLessons();
                displayExercise(exercise, getCurrentExercise(), lessons.length);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (nextExercise()) {
                const exercise = getCurrentExercise();
                const lessons = getLessons();
                displayExercise(exercise, getCurrentExercise(), lessons.length);
            }
        });
    }
    
    // Game
    const newGameBtn = document.getElementById('new-game-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const publishLessonsBtn = document.getElementById('publish-lessons-btn');
    const exportLessonsBtn = document.getElementById('export-lessons-btn');
    const importLessonsBtn = document.getElementById('import-lessons-btn');
    const importLessonsFile = document.getElementById('import-lessons-file');
    const gamePhraseSource = document.getElementById('game-phrase-source');
    const gameLessonSelect = document.getElementById('game-lesson-select');

    if (gamePhraseSource && gameLessonSelect) {
        gamePhraseSource.addEventListener('change', () => {
            const useLesson = gamePhraseSource.value === 'lesson';
            gameLessonSelect.disabled = !useLesson;
        });
    }
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            const difficulty = document.getElementById('difficulty-select').value;
            startSelectedGame(difficulty);
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            const difficulty = document.getElementById('difficulty-select').value;
            startSelectedGame(difficulty);
        });
    }

    if (publishLessonsBtn) {
        publishLessonsBtn.addEventListener('click', async () => {
            await publishLessonsToSharedFile();
        });
    }

    if (exportLessonsBtn) {
        exportLessonsBtn.addEventListener('click', () => {
            exportLessonsToFile();
        });
    }

    if (importLessonsBtn && importLessonsFile) {
        importLessonsBtn.addEventListener('click', () => {
            importLessonsFile.click();
        });

        importLessonsFile.addEventListener('change', async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const result = importLessons(text, { mode: 'merge' });

                if (!result.success) {
                    showLessonSyncStatus(`Import failed: ${result.message}`, 'error');
                    return;
                }

                const lessons = getLessons();
                displayLessonList(lessons);
                populateLessonSelector(lessons);
                populateGameLessonSelector(lessons);
                showLessonSyncStatus(
                    `Imported successfully. Total lessons: ${result.totalCount}.`,
                    'success'
                );
            } catch (error) {
                console.error('Failed to import lesson file:', error);
                showLessonSyncStatus(`Import failed: ${error.message}`, 'error');
            } finally {
                importLessonsFile.value = '';
            }
        });
    }
}

/**
 * Start either matching or balloon game based on selected mode.
 * @param {string} difficulty - Selected game difficulty
 */
function startSelectedGame(difficulty) {
    const phraseSourceEl = document.getElementById('game-phrase-source');
    const lessonSelectEl = document.getElementById('game-lesson-select');
    const modeSelect = document.getElementById('game-mode-select');
    const phraseSource = phraseSourceEl ? phraseSourceEl.value : 'random';
    const selectedLessonId = lessonSelectEl ? lessonSelectEl.value : '';
    const selectedMode = modeSelect ? modeSelect.value : 'matching';

    if (phraseSource === 'lesson') {
        const lesson = getLesson(selectedLessonId);
        if (!lesson) {
            alert('Please select a lesson phrase set first.');
            return;
        }

        const lessonPairs = mapLessonExercisesToPairs(lesson.exercises || []);
        if (lessonPairs.length < 2) {
            alert('This lesson needs at least 2 phrases for game practice.');
            return;
        }

        if (selectedMode === 'balloon') {
            initializeCustomBalloonGame(lessonPairs);
            return;
        }

        initializeCustomMatchingGame(lessonPairs);
        return;
    }

    if (selectedMode === 'balloon') {
        initializeBalloonGame(difficulty);
        return;
    }

    initializeNewGame(difficulty);
}

/**
 * Convert lesson exercises into game pair format.
 * @param {Array} exercises - Lesson exercise list
 * @returns {Array} Normalized game pairs
 */
function mapLessonExercisesToPairs(exercises) {
    return exercises
        .filter(exercise => exercise && exercise.english && exercise.chinese)
        .map((exercise, index) => ({
            id: index,
            english: String(exercise.english).trim(),
            chinese: String(exercise.chinese).trim(),
            pinyin: exercise.pinyin ? String(exercise.pinyin).trim() : '',
            emoji: '🎈'
        }));
}

/**
 * Render and start matching mode for a fixed phrase set.
 * @param {Array} pairs - Pair set to practice
 */
function initializeCustomMatchingGame(pairs) {
    stopBalloonGame();
    stopMatchPolling();
    hideGameResult();

    const gamePairs = startCustomGame(pairs);
    const chinesePairs = shuffleArray([...gamePairs]);
    const imagePairs = shuffleArray([...gamePairs]);

    renderGameBoard(chinesePairs, imagePairs);
    setupDragAndDrop();

    updateGameStats({
        moveCount: 0,
        matchedPairs: 0,
        totalPairs: gamePairs.length,
        formattedTime: '0:00'
    });

    startMatchingProgressPolling();
}

/**
 * Poll and finalize matching games.
 */
function startMatchingProgressPolling() {
    activeMatchPollingInterval = setInterval(() => {
        if (!isGameActive()) return;

        const state = getGameState();

        updateGameStats({
            moveCount: state.moveCount,
            matchedPairs: state.matchedPairs,
            totalPairs: state.pairs.length,
            formattedTime: state.formattedTime
        });

        if (!state.isComplete) return;

        const result = endGame();
        showGameScoreModal(result);
        saveGameResult(result);
        triggerConfetti();
        showGameResult({
            time: result.formattedTime,
            moves: result.moveCount
        });
        stopMatchPolling();
    }, 100);
}

/**
 * Show local-only publish controls when running the local development server.
 */
function configureLocalPublishControls() {
    const publishLessonsBtn = document.getElementById('publish-lessons-btn');
    if (!publishLessonsBtn) return;

    const isLocalhost = window.location.hostname === 'localhost';
    publishLessonsBtn.style.display = isLocalhost ? 'inline-flex' : 'none';
}

/**
 * Persist current lessons into data/shared-lessons.json via local API.
 */
async function publishLessonsToSharedFile() {
    const publishLessonsBtn = document.getElementById('publish-lessons-btn');
    const lessons = getLessons();

    if (!lessons.length) {
        showLessonSyncStatus('No lessons available to publish yet.', 'error');
        return;
    }

    const originalText = publishLessonsBtn ? publishLessonsBtn.textContent : '';
    if (publishLessonsBtn) {
        publishLessonsBtn.disabled = true;
        publishLessonsBtn.textContent = '🚀 Publishing...';
    }

    try {
        const response = await fetch(getApiUrl(apiEndpoints.saveSharedLessons), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lessons })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Publish failed');
        }

        showLessonSyncStatus(
            `Published ${result.lessonCount} lessons to data/shared-lessons.json. Now run git add/commit/push.`,
            'success'
        );
    } catch (error) {
        console.error('Failed to publish lessons locally:', error);
        showLessonSyncStatus(`Publish failed: ${error.message}`, 'error');
    } finally {
        if (publishLessonsBtn) {
            publishLessonsBtn.disabled = false;
            publishLessonsBtn.textContent = originalText;
        }
    }
}

/**
 * Load shared lessons from repository file and merge into local lessons.
 * This enables GitHub-pushed data to auto-load on Netlify deploys.
 */
async function loadSharedLessonsFromRepo() {
    try {
        const response = await fetch(`${SHARED_LESSONS_URL}?t=${Date.now()}`, { cache: 'no-store' });

        if (!response.ok) {
            // File may not exist yet, which is fine.
            return { updated: false };
        }

        const sharedData = await response.json();
        const result = importLessons(sharedData, { mode: 'merge' });

        if (result.success) {
            setLastSharedSyncTime(new Date().toISOString());
            showLessonSyncStatus(
                `Synced from GitHub shared file. Total lessons: ${result.totalCount}.`,
                'info'
            );
            return { updated: true };
        }

        showLessonSyncStatus(`Shared sync skipped: ${result.message}`, 'error');
        return { updated: false };
    } catch (error) {
        console.warn('Shared lesson sync unavailable:', error);
        return { updated: false };
    }
}

/**
 * Export current lessons to a JSON file intended for GitHub sync.
 */
function exportLessonsToFile() {
    try {
        const json = exportAllLessons();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'shared-lessons.json';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        showLessonSyncStatus(
            'Exported shared-lessons.json. Commit it to data/shared-lessons.json in GitHub.',
            'success'
        );
    } catch (error) {
        console.error('Failed to export lessons:', error);
        showLessonSyncStatus(`Export failed: ${error.message}`, 'error');
    }
}

/**
 * Show status for lesson sync/import/export actions.
 * @param {string} message - Status message
 * @param {string} type - success, error, or info
 */
function showLessonSyncStatus(message, type = 'info') {
    const statusEl = document.getElementById('lesson-sync-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.remove('success', 'error', 'info');
    statusEl.classList.add(type);
    statusEl.style.display = 'block';
}

/**
 * Save last shared lessons sync timestamp and update UI.
 * @param {string} isoTimestamp - ISO timestamp string
 */
function setLastSharedSyncTime(isoTimestamp) {
    try {
        localStorage.setItem(SHARED_LESSONS_LAST_SYNC_KEY, isoTimestamp);
    } catch (error) {
        console.warn('Unable to save shared sync timestamp:', error);
    }
    renderLastSharedSyncTime();
}

/**
 * Render last shared lessons sync time if available.
 */
function renderLastSharedSyncTime() {
    const lastSyncEl = document.getElementById('lesson-sync-last');
    if (!lastSyncEl) return;

    let timestamp = null;
    try {
        timestamp = localStorage.getItem(SHARED_LESSONS_LAST_SYNC_KEY);
    } catch (error) {
        console.warn('Unable to read shared sync timestamp:', error);
    }

    if (!timestamp) {
        lastSyncEl.style.display = 'none';
        return;
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        lastSyncEl.style.display = 'none';
        return;
    }

    lastSyncEl.textContent = `Last synced from GitHub: ${date.toLocaleString()}`;
    lastSyncEl.style.display = 'block';
}

/**
 * Initialize a new game with rendering and event handlers
 * @param {string} difficulty - Game difficulty level
 */
function initializeNewGame(difficulty) {
    stopBalloonGame();
    stopMatchPolling();

    // Hide any previous game result
    hideGameResult();
    
    // Start new game
    const pairs = startNewGame(difficulty);
    
    // Shuffle pairs for display
    const chinesePairs = shuffleArray([...pairs]);
    const imagePairs = shuffleArray([...pairs]);
    
    // Render game board
    renderGameBoard(chinesePairs, imagePairs);
    
    // Set up drag and drop event listeners
    setupDragAndDrop();
    
    // Initialize stats display
    updateGameStats({
        moveCount: 0,
        matchedPairs: 0,
        totalPairs: pairs.length,
        formattedTime: '0:00'
    });
    
    // Set up game completion monitoring AFTER the game starts
    startMatchingProgressPolling();
}

/**
 * Stop active polling for matching game completion.
 */
function stopMatchPolling() {
    if (activeMatchPollingInterval) {
        clearInterval(activeMatchPollingInterval);
        activeMatchPollingInterval = null;
    }
}

/**
 * Initialize balloon shooter game mode.
 * @param {string} difficulty - Game difficulty level
 */
function initializeBalloonGame(difficulty) {
    stopBalloonGame();
    stopMatchPolling();
    hideGameResult();

    const pairs = startNewGame(difficulty);
    const displayLanguageSelect = document.getElementById('balloon-display-language');

    const displayLanguage = displayLanguageSelect ? displayLanguageSelect.value : 'english';
    const promptLanguage = getOppositeLanguage(displayLanguage);

    balloonGameState = {
        pairs,
        remainingPairIds: pairs.map(pair => pair.id),
        currentPairId: null,
        options: [],
        attemptsByPair: new Map(),
        firstTryMatches: 0,
        moveCount: 0,
        matchedPairs: 0,
        gameStartTime: Date.now(),
        displayLanguage,
        promptLanguage,
        isShotLocked: false,
        isAiming: false,
        aimPointerId: null,
        activeArrow: null,
        targets: [],
        animationFrameId: null,
        stageWidth: 0,
        stageHeight: 0,
        ticker: null
    };

    updateGameStats({
        moveCount: 0,
        matchedPairs: 0,
        totalPairs: pairs.length,
        formattedTime: '0:00'
    });

    renderNextBalloonRound();
    balloonGameState.ticker = setInterval(updateBalloonStats, 250);
}

/**
 * Initialize balloon shooter mode using a saved/custom pair set.
 * @param {Array} pairs - Pair objects to play with
 */
function initializeCustomBalloonGame(pairs) {
    stopBalloonGame();
    stopMatchPolling();
    hideGameResult();

    const displayLanguageSelect = document.getElementById('balloon-display-language');

    const displayLanguage = displayLanguageSelect ? displayLanguageSelect.value : 'english';
    const promptLanguage = getOppositeLanguage(displayLanguage);

    balloonGameState = {
        pairs,
        remainingPairIds: pairs.map(pair => pair.id),
        currentPairId: null,
        options: [],
        attemptsByPair: new Map(),
        firstTryMatches: 0,
        moveCount: 0,
        matchedPairs: 0,
        gameStartTime: Date.now(),
        displayLanguage,
        promptLanguage,
        isShotLocked: false,
        isAiming: false,
        aimPointerId: null,
        activeArrow: null,
        targets: [],
        animationFrameId: null,
        stageWidth: 0,
        stageHeight: 0,
        ticker: null
    };

    updateGameStats({
        moveCount: 0,
        matchedPairs: 0,
        totalPairs: pairs.length,
        formattedTime: '0:00'
    });

    renderNextBalloonRound();
    balloonGameState.ticker = setInterval(updateBalloonStats, 250);
}

/**
 * Stop active balloon game timer and state.
 */
function stopBalloonGame() {
    if (!balloonGameState) return;
    if (balloonGameState.ticker) {
        clearInterval(balloonGameState.ticker);
    }
    if (balloonGameState.animationFrameId) {
        cancelAnimationFrame(balloonGameState.animationFrameId);
    }
    balloonGameState = null;
}

/**
 * Format elapsed time in MM:SS.
 * @param {number} elapsedSeconds - Elapsed seconds
 * @returns {string} Formatted time
 */
function formatElapsed(elapsedSeconds) {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Return the opposite language for cross-language listening rounds.
 * @param {string} displayLanguage - Current balloon display language
 * @returns {string} Opposite language for spoken prompt
 */
function getOppositeLanguage(displayLanguage) {
    return displayLanguage === 'mandarin' ? 'english' : 'mandarin';
}

/**
 * Update game stats while balloon game is active.
 */
function updateBalloonStats() {
    if (!balloonGameState) return;
    const elapsedSeconds = Math.floor((Date.now() - balloonGameState.gameStartTime) / 1000);
    updateGameStats({
        moveCount: balloonGameState.moveCount,
        matchedPairs: balloonGameState.matchedPairs,
        totalPairs: balloonGameState.pairs.length,
        formattedTime: formatElapsed(elapsedSeconds)
    });
}

/**
 * Build and render the next balloon question round.
 */
function renderNextBalloonRound() {
    if (!balloonGameState) return;

    if (balloonGameState.remainingPairIds.length === 0) {
        finishBalloonGame();
        return;
    }

    const remaining = [...balloonGameState.remainingPairIds];
    const currentPairId = remaining[Math.floor(Math.random() * remaining.length)];
    const currentPair = balloonGameState.pairs.find(pair => pair.id === currentPairId);

    const distractors = shuffleArray(
        balloonGameState.pairs.filter(pair => pair.id !== currentPairId)
    ).slice(0, Math.max(0, Math.min(MAX_BALLOON_OPTIONS - 1, balloonGameState.pairs.length - 1)));

    const options = shuffleArray([currentPair, ...distractors]);

    balloonGameState.currentPairId = currentPairId;
    balloonGameState.options = options;
    balloonGameState.attemptsByPair.set(currentPairId, 0);

    renderBalloonBoard({
        options,
        displayLanguage: balloonGameState.displayLanguage,
        roundNumber: balloonGameState.matchedPairs + 1,
        totalRounds: balloonGameState.pairs.length
    });

    setupBalloonInteractions();
    speakBalloonPrompt();
}

/**
 * Speak current round prompt.
 */
function speakBalloonPrompt() {
    if (!balloonGameState) return;
    const currentPair = balloonGameState.pairs.find(pair => pair.id === balloonGameState.currentPairId);
    if (!currentPair) return;

    if (balloonGameState.promptLanguage === 'mandarin') {
        speakChinese(currentPair.chinese);
        return;
    }

    speakEnglish(currentPair.english);
}

/**
 * Wire click handlers for balloon targets.
 */
function setupBalloonInteractions() {
    const listenBtn = document.getElementById('balloon-listen-btn');
    if (listenBtn) {
        listenBtn.addEventListener('click', speakBalloonPrompt);
    }

    initializeBalloonTargets();
    bindShooterControls();
    startBalloonAnimationLoop();
}

/**
 * Initialize moving target positions for the current round.
 */
function initializeBalloonTargets() {
    if (!balloonGameState) return;
    const stage = document.getElementById('balloon-stage');
    if (!stage) return;

    balloonGameState.stageWidth = stage.clientWidth;
    balloonGameState.stageHeight = stage.clientHeight;
    balloonGameState.targets = [];

    const balloons = Array.from(stage.querySelectorAll('.balloon'));
    const spacing = balloonGameState.stageWidth / (balloons.length + 1);
    const minY = 80;
    const maxY = Math.max(120, balloonGameState.stageHeight - 210);

    balloons.forEach((el, index) => {
        const baseX = spacing * (index + 1);
        const jitterX = (Math.random() - 0.5) * 36;
        const x = Math.max(64, Math.min(balloonGameState.stageWidth - 64, baseX + jitterX));
        const y = minY + Math.random() * (maxY - minY);
        const vx = (Math.random() - 0.5) * 0.07;
        const vy = (Math.random() - 0.5) * 0.03;

        const target = {
            el,
            pairId: Number(el.dataset.pairId),
            x,
            y,
            vx,
            vy,
            radius: 54,
            wobbleSeed: Math.random() * Math.PI * 2,
            wobbleTime: 0
        };

        balloonGameState.targets.push(target);
        renderBalloonTarget(target);
    });
}

/**
 * Position one balloon target element.
 * @param {Object} target - Moving target object
 */
function renderBalloonTarget(target) {
    target.el.style.transform = `translate(${target.x - 60}px, ${target.y - 60}px)`;
}

/**
 * Bind hold/aim/release shooter controls.
 */
function bindShooterControls() {
    if (!balloonGameState) return;

    const stage = document.getElementById('balloon-stage');
    const aimGuide = document.getElementById('aim-guide');
    const bow = document.getElementById('bow-weapon');
    if (!stage || !aimGuide || !bow) return;

    const bowOrigin = () => ({
        x: balloonGameState.stageWidth / 2,
        y: balloonGameState.stageHeight - 36
    });

    const updateAimGuide = (x, y) => {
        const origin = bowOrigin();
        const dx = x - origin.x;
        const dy = y - origin.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const length = Math.max(35, Math.min(230, Math.sqrt((dx * dx) + (dy * dy))));

        aimGuide.style.left = `${origin.x}px`;
        aimGuide.style.top = `${origin.y}px`;
        aimGuide.style.width = `${length}px`;
        aimGuide.style.transform = `rotate(${angle}deg)`;
        bow.style.transform = `rotate(${Math.max(-85, Math.min(-8, angle))}deg)`;
    };

    const onPointerDown = (event) => {
        if (!balloonGameState || balloonGameState.isShotLocked) return;

        balloonGameState.isAiming = true;
        balloonGameState.aimPointerId = event.pointerId;
        stage.setPointerCapture(event.pointerId);
        aimGuide.classList.add('active');

        const rect = stage.getBoundingClientRect();
        updateAimGuide(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onPointerMove = (event) => {
        if (!balloonGameState || !balloonGameState.isAiming) return;
        if (balloonGameState.aimPointerId !== event.pointerId) return;

        const rect = stage.getBoundingClientRect();
        updateAimGuide(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onPointerUp = (event) => {
        if (!balloonGameState || !balloonGameState.isAiming) return;
        if (balloonGameState.aimPointerId !== event.pointerId) return;

        const rect = stage.getBoundingClientRect();
        const releaseX = event.clientX - rect.left;
        const releaseY = event.clientY - rect.top;
        fireArrow(releaseX, releaseY);

        balloonGameState.isAiming = false;
        balloonGameState.aimPointerId = null;
        aimGuide.classList.remove('active');
        bow.style.transform = 'rotate(-28deg)';
        stage.releasePointerCapture(event.pointerId);
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
}

/**
 * Launch one arrow using release direction.
 * @param {number} releaseX - Release x position in stage coords
 * @param {number} releaseY - Release y position in stage coords
 */
function fireArrow(releaseX, releaseY) {
    if (!balloonGameState || balloonGameState.isShotLocked) return;

    const originX = balloonGameState.stageWidth / 2;
    const originY = balloonGameState.stageHeight - 36;
    const dx = releaseX - originX;
    const dy = releaseY - originY;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    const clampedDistance = Math.max(45, Math.min(240, distance));
    const angle = Math.atan2(dy, dx);
    const speed = 0.7 + (clampedDistance / 260);

    balloonGameState.isShotLocked = true;
    balloonGameState.activeArrow = {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle
    };
}

/**
 * Start per-frame updates for targets and active arrow.
 */
function startBalloonAnimationLoop() {
    if (!balloonGameState) return;

    if (balloonGameState.animationFrameId) {
        cancelAnimationFrame(balloonGameState.animationFrameId);
    }

    let previousTime = performance.now();
    const tick = (now) => {
        if (!balloonGameState) return;

        const deltaMs = Math.min(34, now - previousTime);
        previousTime = now;

        updateMovingTargets(deltaMs);
        updateArrowPhysics(deltaMs);

        balloonGameState.animationFrameId = requestAnimationFrame(tick);
    };

    balloonGameState.animationFrameId = requestAnimationFrame(tick);
}

/**
 * Animate floating target movement.
 * @param {number} deltaMs - Frame delta in ms
 */
function updateMovingTargets(deltaMs) {
    if (!balloonGameState) return;

    const minX = 64;
    const maxX = balloonGameState.stageWidth - 64;
    const minY = 70;
    const maxY = Math.max(120, balloonGameState.stageHeight - 220);

    balloonGameState.targets.forEach(target => {
        target.wobbleTime += deltaMs;
        target.x += target.vx * deltaMs;
        target.y += (target.vy * deltaMs) + (Math.sin((target.wobbleTime / 260) + target.wobbleSeed) * 0.6);

        if (target.x < minX || target.x > maxX) {
            target.vx *= -1;
            target.x = Math.max(minX, Math.min(maxX, target.x));
        }

        if (target.y < minY || target.y > maxY) {
            target.vy *= -1;
            target.y = Math.max(minY, Math.min(maxY, target.y));
        }

        renderBalloonTarget(target);
    });
}

/**
 * Move arrow and resolve hit/miss events.
 * @param {number} deltaMs - Frame delta in ms
 */
function updateArrowPhysics(deltaMs) {
    if (!balloonGameState || !balloonGameState.activeArrow) {
        renderArrow(null);
        return;
    }

    const arrow = document.getElementById('flying-arrow');
    if (!arrow) return;

    const gravity = 0.0018;
    const arrowState = balloonGameState.activeArrow;
    arrowState.x += arrowState.vx * deltaMs;
    arrowState.y += arrowState.vy * deltaMs;
    arrowState.vy += gravity * deltaMs;
    arrowState.angle = Math.atan2(arrowState.vy, arrowState.vx);

    renderArrow(arrowState);

    const hitTarget = balloonGameState.targets.find(target => {
        const dx = target.x - arrowState.x;
        const dy = target.y - arrowState.y;
        return Math.sqrt((dx * dx) + (dy * dy)) <= target.radius;
    });

    if (hitTarget) {
        balloonGameState.activeArrow = null;
        processBalloonShotResult(hitTarget.pairId, hitTarget.el);
        return;
    }

    const outOfBounds = (
        arrowState.x < -40 ||
        arrowState.x > balloonGameState.stageWidth + 40 ||
        arrowState.y < -40 ||
        arrowState.y > balloonGameState.stageHeight + 40
    );

    if (outOfBounds) {
        balloonGameState.activeArrow = null;
        processBalloonShotResult(null, null);
    }
}

/**
 * Draw arrow element at current physics position.
 * @param {Object|null} arrowState - Active arrow state
 */
function renderArrow(arrowState) {
    const arrow = document.getElementById('flying-arrow');
    if (!arrow) return;

    if (!arrowState) {
        arrow.style.transform = 'translate(-9999px, -9999px) rotate(-30deg)';
        return;
    }

    const angleDeg = arrowState.angle * (180 / Math.PI);
    arrow.style.transform = `translate(${arrowState.x}px, ${arrowState.y}px) rotate(${angleDeg}deg)`;
}

/**
 * Resolve shot outcome for hit or miss with no penalties.
 * @param {number|null} selectedPairId - Hit pair id, or null for miss
 * @param {HTMLElement|null} balloonEl - Hit balloon element
 */
function processBalloonShotResult(selectedPairId, balloonEl) {
    if (!balloonGameState) return;

    const currentPairId = balloonGameState.currentPairId;
    const currentAttempts = balloonGameState.attemptsByPair.get(currentPairId) || 0;
    balloonGameState.attemptsByPair.set(currentPairId, currentAttempts + 1);
    balloonGameState.moveCount += 1;

    const isCorrect = selectedPairId === currentPairId;

    if (!isCorrect) {
        if (balloonEl) {
            balloonEl.classList.add('miss');
            setTimeout(() => balloonEl.classList.remove('miss'), 350);
        }

        speakBalloonPrompt();
        updateBalloonStats();
        balloonGameState.isShotLocked = false;
        return;
    }

    if (currentAttempts === 0) {
        balloonGameState.firstTryMatches += 1;
    }

    if (balloonEl) {
        balloonEl.classList.add('popped');
    }

    balloonGameState.matchedPairs += 1;
    balloonGameState.remainingPairIds = balloonGameState.remainingPairIds.filter(id => id !== currentPairId);
    updateBalloonStats();

    setTimeout(() => {
        renderNextBalloonRound();
        if (balloonGameState) {
            balloonGameState.isShotLocked = false;
        }
    }, 320);
}

/**
 * Complete balloon game and save result.
 */
function finishBalloonGame() {
    if (!balloonGameState) return;

    const elapsedSeconds = Math.floor((Date.now() - balloonGameState.gameStartTime) / 1000);
    const totalPairs = balloonGameState.pairs.length;
    const accuracy = balloonGameState.moveCount > 0
        ? Math.round((balloonGameState.matchedPairs / balloonGameState.moveCount) * 100)
        : 0;
    const firstTryAccuracy = totalPairs > 0
        ? Math.round((balloonGameState.firstTryMatches / totalPairs) * 100)
        : 0;
    const timeBonus = Math.max(0, 100 - elapsedSeconds);
    const score = Math.round((accuracy * 0.7) + (timeBonus * 0.3));

    const result = {
        totalPairs,
        matchedPairs: balloonGameState.matchedPairs,
        remainingPairs: 0,
        moveCount: balloonGameState.moveCount,
        firstTryMatches: balloonGameState.firstTryMatches,
        firstTryAccuracy,
        elapsedTime: elapsedSeconds,
        formattedTime: formatElapsed(elapsedSeconds),
        accuracy,
        score,
        completed: true
    };

    stopBalloonGame();

    showGameScoreModal(result);
    saveGameResult(result);
    triggerConfetti();
    showGameResult({
        time: result.formattedTime,
        moves: result.moveCount
    });
}

/**
 * Set up drag and drop event handlers
 */
function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable');
    const dropTargets = document.querySelectorAll('.drop-target');
    
    let draggedPairId = null;
    
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            draggedPairId = parseInt(draggable.dataset.pairId);
            handleDragStart(draggedPairId);
            draggable.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedPairId);
        });
        
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            draggedPairId = null;
        });
        
        // Add click to play audio
        draggable.addEventListener('click', () => {
            const pairId = parseInt(draggable.dataset.pairId);
            playPairAudio(pairId);
        });
    });
    
    dropTargets.forEach(target => {
        target.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            target.classList.add('drag-over');
        });
        
        target.addEventListener('dragleave', () => {
            target.classList.remove('drag-over');
        });
        
        // Add click to play English audio
        target.addEventListener('click', () => {
            // Get the English text from the card
            const labelElement = target.querySelector('.card-label');
            if (labelElement) {
                const englishText = labelElement.textContent;
                speakEnglish(englishText);
            }
        });
        
        target.addEventListener('drop', (e) => {
            e.preventDefault();
            target.classList.remove('drag-over');
            
            const dropTargetId = parseInt(target.dataset.pairId);
            
            console.log('📥 Drop event: draggedPairId=' + draggedPairId + ', dropTargetId=' + dropTargetId);
            
            // Always call handleDrop to track attempts (both correct and incorrect)
            const result = handleDrop(dropTargetId);
            
            // Check if this is a match
            const isMatch = result.matched;
            
            if (isMatch) {
                // Mark cards as matched
                const draggedCard = document.querySelector(`.draggable[data-pair-id="${draggedPairId}"]`);
                if (draggedCard) {
                    draggedCard.classList.add('matched');
                    draggedCard.draggable = false;
                }
                target.classList.add('matched');
                
                // Play audio
                playPairAudio(draggedPairId);
                
                // Check if game is complete after this match
                if (result.isComplete) {
                    console.log('🎉 GAME COMPLETE DETECTED IN DROP HANDLER!');
                    const gameResult = endGame();
                    console.log('📊 Game result object:', gameResult);
                    
                    // Show game score modal with confetti
                    showGameScoreModal(gameResult);
                    console.log('✅ Score modal shown');
                    
                    // Save game result to progress
                    const saved = saveGameResult(gameResult);
                    console.log('💾 Game result saved:', saved);
                    
                    // Trigger confetti
                    triggerConfetti();
                    console.log('🎊 Confetti triggered');
                    
                    showGameResult({
                        time: gameResult.formattedTime,
                        moves: gameResult.moveCount
                    });
                }
            }
            
            // Update stats display
            const state = getGameState();
            updateGameStats({
                moveCount: state.moveCount,
                matchedPairs: state.matchedPairs,
                totalPairs: state.pairs.length,
                formattedTime: state.formattedTime
            });
        });
    });
}

/**
 * Show game score modal with confetti
 * @param {Object} gameResult - Game result object
 */
function showGameScoreModal(gameResult) {
    const modal = document.getElementById('game-score-modal');
    const percentageEl = document.getElementById('score-percentage');
    const firstTryEl = document.getElementById('first-try-matches');
    const timeEl = document.getElementById('game-completion-time');
    
    console.log('📱 showGameScoreModal called');
    console.log('   gameResult:', gameResult);
    console.log('   modal element:', modal);
    console.log('   modal id:', modal?.id);
    console.log('   modal current display:', modal?.style.display);
    
    if (!modal) {
        console.error('❌ MODAL NOT FOUND! Searched for id="game-score-modal"');
        return;
    }
    
    // Calculate first-try accuracy percentage
    const accuracy = gameResult.firstTryAccuracy || 0;
    
    // Update modal content
    if (percentageEl) {
        percentageEl.textContent = accuracy + '%';
        console.log('   Updated percentage to:', accuracy + '%');
    } else {
        console.error('❌ percentageEl not found');
    }
    
    if (firstTryEl) {
        firstTryEl.textContent = gameResult.firstTryMatches + ' / ' + gameResult.totalPairs;
        console.log('   Updated firstTry to:', gameResult.firstTryMatches + ' / ' + gameResult.totalPairs);
    } else {
        console.error('❌ firstTryEl not found');
    }
    
    if (timeEl) {
        timeEl.textContent = gameResult.formattedTime;
        console.log('   Updated time to:', gameResult.formattedTime);
    } else {
        console.error('❌ timeEl not found');
    }
    
    // Show modal
    console.log('📱 Setting modal.style.display to "flex"');
    modal.style.display = 'flex';
    console.log('   Modal display is now:', modal.style.display);
    console.log('   Computed style:', window.getComputedStyle(modal).display);
}

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
    if (typeof confetti === 'undefined') {
        console.warn('Confetti library not loaded');
        return;
    }
    
    // Multiple bursts for more impressive effect
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
    
    // Delayed second burst
    setTimeout(() => {
        confetti({
            particleCount: 50,
            spread: 90,
            origin: { y: 0.6 }
        });
    }, 150);
}

/**
 * Handle translation request
 */
async function handleTranslation() {
    const input = document.getElementById('english-input').value.trim().toLowerCase();
    const translateBtn = document.getElementById('translate-btn');
    
    if (!input) {
        alert('Please enter an English phrase');
        return;
    }
    
    // Show loading state
    const originalBtnText = translateBtn ? translateBtn.textContent : '';
    if (translateBtn) {
        translateBtn.disabled = true;
        translateBtn.textContent = '🔄 Translating...';
    }
    
    try {
        const translation = await translateWord(input);
        
        if (translation) {
            displayTranslationResult(translation);
            
            // Setup button handlers
            document.getElementById('play-translation').onclick = () => speakChinese(translation.chinese);
            document.getElementById('add-to-exercises').onclick = () => {
                if (addTranslation(translation)) {
                    displaySavedTranslations(getTranslations());
                    alert('Added to saved translations!');
                } else {
                    alert('This translation is already saved.');
                }
            };
        } else {
            alert('Translation not found. Please try another phrase.');
        }
    } catch (error) {
        console.error('Translation error:', error);
        alert('Error translating. Please try again.');
    } finally {
        // Restore button state
        if (translateBtn) {
            translateBtn.disabled = false;
            translateBtn.textContent = originalBtnText;
        }
    }
}

/**
 * Handle lesson selection
 */
function handleLessonSelect(e) {
    const lessonId = e.target.value;
    const lesson = getLesson(lessonId);
    
    if (lesson) {
        loadPracticeLesson(lesson);
        const exercise = getCurrentExercise();
        if (exercise) {
            displayExercise(exercise, 0, lesson.exercises.length);
            toggleExerciseContainer(true);
        }
    }
}

/**
 * Handle recording button click
 */
let recordedAudioBlob = null;

async function handleRecording() {
    const recordBtn = document.getElementById('record-btn');
    const playRecordingBtn = document.getElementById('play-recording');
    
    if (!recordBtn) return;
    
    if (isPracticeRecording()) {
        // Stop recording
        stopPracticeRecording();
        recordBtn.textContent = '🎤 Record Your Voice';
        recordBtn.classList.remove('recording');
    } else {
        // Start recording
        const exercise = getCurrentExercise();
        if (!exercise) {
            alert('Please select a lesson first');
            return;
        }
        
        recordBtn.textContent = '⏹️ Stop Recording';
        recordBtn.classList.add('recording');
        
        const started = await startPracticeRecording((audioUrl, audioBlob) => {
            // Recording stopped callback
            recordBtn.textContent = '🎤 Record Your Voice';
            recordBtn.classList.remove('recording');
            
            // Store the blob for Azure assessment
            recordedAudioBlob = audioBlob;
            
            // Show play button
            if (playRecordingBtn) {
                playRecordingBtn.style.display = 'inline-block';
                playRecordingBtn.onclick = () => {
                    const audio = new Audio(audioUrl);
                    audio.play();
                };
            }
            
            // Perform Azure pronunciation assessment
            assessPronunciation(audioBlob, exercise.chinese);
        });
        
        if (!started) {
            recordBtn.textContent = '🎤 Record Your Voice';
            recordBtn.classList.remove('recording');
            alert('Failed to start recording. Please check microphone permissions.');
        }
    }
}

/**
 * Assess pronunciation using Azure or fallback
 */
async function assessPronunciation(audioBlob, referenceText) {
    try {
        // Show loading state
        const ratingDiv = document.getElementById('pronunciation-rating');
        if (ratingDiv) {
            ratingDiv.style.display = 'block';
            ratingDiv.innerHTML = '<div class="status warning">🔄 Analyzing pronunciation...</div>';
        }
        
        console.log('🎯 Starting pronunciation assessment for text:', referenceText);
        
        // Try Azure assessment first
        let result;
        try {
            result = await assessPronunciationWithAzure(audioBlob, referenceText);
            
            // Check if it's a fallback score (no azureData)
            if (result.azureData) {
                console.log('✅ Using Azure assessment scores');
            } else {
                console.warn('⚠️ No Azure data in response - using fallback scoring');
            }
            
            console.log('📊 Assessment result:', result);
        } catch (error) {
            console.warn('⚠️ Azure assessment threw error, using fallback:', error);
            result = generatePronunciationScore();
        }
        
        // Display results
        displayPronunciationResults(result);
        
    } catch (error) {
        console.error('❌ Pronunciation assessment error:', error);
        alert('Error assessing pronunciation. Please try again.');
    }
}

/**
 * Display pronunciation assessment results
 */
function displayPronunciationResults(result) {
    const ratingDiv = document.getElementById('pronunciation-rating');
    if (!ratingDiv) return;
    
    // Build stars HTML
    const starsHtml = '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars);
    
    // Display results
    ratingDiv.innerHTML = `
        <h3>📊 Pronunciation Assessment</h3>
        <div class="assessment-results">
            <div class="stars-result">${starsHtml}</div>
            <div class="scores-grid">
                <div class="score-item">
                    <label>Tone Accuracy:</label>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.toneScore}%"></div>
                    </div>
                    <span class="score-value">${result.toneScore}%</span>
                </div>
                <div class="score-item">
                    <label>Clarity:</label>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.clarityScore}%"></div>
                    </div>
                    <span class="score-value">${result.clarityScore}%</span>
                </div>
            </div>
            <div class="feedback-text">${result.feedback}</div>
            ${result.azureData ? `
                <div class="azure-details" style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 5px; font-size: 12px;">
                    <strong>Azure Speech SDK Results:</strong><br>
                    Recognized: ${result.azureData.recognizedText}<br>
                    Overall: ${result.azureData.overallScore}%
                </div>
            ` : ''}
            <div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px; color: #2e7d32; font-size: 0.9rem;">
                ✅ Score saved automatically
            </div>
        </div>
    `;
    
    ratingDiv.style.display = 'block';
    
    // Automatically save the assessment
    const rating = {
        stars: result.stars,
        tone: result.toneScore,
        clarity: result.clarityScore,
        notes: result.feedback
    };
    
    // Save to lesson ratings (existing functionality)
    savePronunciationRating(rating);
    
    // Also save to pronunciation progress tracking
    const lessonInfo = getCurrentLessonInfo();
    if (lessonInfo) {
        import('./storage.js').then(({ savePronunciationScore }) => {
            savePronunciationScore({
                lessonId: lessonInfo.lessonId,
                lessonName: lessonInfo.lessonName,
                task: lessonInfo.task,
                score: Math.round((result.stars / 5) * 100),
                stars: result.stars,
                toneScore: result.toneScore,
                clarityScore: result.clarityScore
            });
        });
    }
}

/**
 * Setup global functions for inline event handlers
 * (Used by UI module for dynamically generated content)
 */
function setupGlobalFunctions() {
    // Global function for speaking Chinese (used in UI)
    window.speakChineseGlobal = (text) => {
        speakChinese(text);
    };
    
    // Global function for loading lesson in practice
    window.loadLessonInPracticeGlobal = (lessonId) => {
        switchTab('practice');
        const select = document.getElementById('lesson-select');
        if (select) {
            select.value = lessonId;
            const event = new Event('change');
            select.dispatchEvent(event);
        }
    };
    
    // Global function for deleting lesson
    window.deleteLessonGlobal = (lessonId) => {
        if (confirm('Are you sure you want to delete this lesson? This cannot be undone.')) {
            if (deleteLesson(lessonId)) {
                const lessons = getLessons();
                displayLessonList(lessons);
                populateLessonSelector(lessons);
                populateGameLessonSelector(lessons);
                alert('Lesson deleted successfully!');
            }
        }
    };
    
    // Global function for deleting translation
    window.deleteTranslationGlobal = (index) => {
        if (deleteTranslation(index)) {
            const translations = getTranslations();
            displaySavedTranslations(translations);
        }
    };
    
    // Global function for creating lesson from translations
    window.createLessonFromTranslations = () => {
        const translations = getTranslations();
        
        if (translations.length === 0) {
            alert('Please add some translations first!');
            return;
        }
        
        const lessonName = prompt('Enter a name for your new lesson:');
        if (!lessonName || !lessonName.trim()) {
            return;
        }
        
        const exercises = translations.map(t => ({
            chinese: t.chinese,
            pinyin: t.pinyin,
            english: t.english,
            audioUrl: null
        }));
        
        createLesson(lessonName.trim(), exercises);
        
        const lessons = getLessons();
        populateLessonSelector(lessons);
        displayLessonList(lessons);
        populateGameLessonSelector(lessons);
        
        alert(`✅ Lesson "${lessonName}" created with ${translations.length} exercises!`);
        
        if (confirm('Lesson created! Would you like to clear your saved translations to start fresh?')) {
            clearTranslations();
            displaySavedTranslations([]);
        }
    };
    
    // Global function for creating game from translations
    window.createGameFromTranslations = () => {
        const translations = getTranslations();
        
        if (translations.length === 0) {
            alert('Please add some translations first!');
            return;
        }
        
        if (translations.length < 3) {
            alert('You need at least 3 translations to create a matching game!');
            return;
        }
        
        // Prompt for game name
        const gameName = prompt('Enter a name for your game:');
        if (!gameName || !gameName.trim()) {
            return;
        }
        
        // Create game object
        const newGame = {
            id: Date.now(),
            name: gameName.trim(),
            createdAt: new Date().toISOString(),
            pairs: translations.map(t => ({
                english: t.english,
                chinese: t.chinese,
                pinyin: t.pinyin,
                emoji: t.emoji || '📝'
            })),
            bestTime: null,
            playCount: 0
        };
        
        // Save to storage
        const games = loadGames();
        games.push(newGame);
        saveGames(games);
        
        // Update display
        displaySavedGames(games);
        
        // Switch to game tab and start the game
        switchTab('game');
        startCustomGame(translations);
        
        alert(`🎮 Game "${gameName}" saved with ${translations.length} pairs!`);
    };
    
    // Global function to play a saved game
    window.playGame = (index) => {
        const games = loadGames();
        if (!games[index]) return;
        
        const game = games[index];
        
        // Update play count
        game.playCount = (game.playCount || 0) + 1;
        games[index] = game;
        saveGames(games);
        
        // Hide any previous game result
        hideGameResult();

        const modeSelect = document.getElementById('game-mode-select');
        const selectedMode = modeSelect ? modeSelect.value : 'matching';

        if (selectedMode === 'balloon') {
            const normalizedPairs = game.pairs.map((pair, idx) => ({
                id: idx,
                english: pair.english,
                chinese: pair.chinese,
                pinyin: pair.pinyin,
                emoji: pair.emoji || '📝'
            }));
            initializeCustomBalloonGame(normalizedPairs);
        } else {
            const normalizedPairs = game.pairs.map((pair, idx) => ({
                id: idx,
                english: pair.english,
                chinese: pair.chinese,
                pinyin: pair.pinyin,
                emoji: pair.emoji || '📝'
            }));
            initializeCustomMatchingGame(normalizedPairs);
        }
        
        // Scroll to game board
        document.getElementById('game-board').scrollIntoView({ behavior: 'smooth' });
    };
    
    // Global function to delete a saved game
    window.deleteGame = (index) => {
        const games = loadGames();
        if (!games[index]) return;
        
        if (confirm(`Are you sure you want to delete "${games[index].name}"?`)) {
            games.splice(index, 1);
            saveGames(games);
            displaySavedGames(games);
            alert('Game deleted!');
        }
    };
}

/**
 * Application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
