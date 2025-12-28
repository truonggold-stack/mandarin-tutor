// Storage Module
// Handles all localStorage operations for data persistence

const STORAGE_KEYS = {
    LESSONS: 'mandarinLessons',
    TRANSLATIONS: 'savedTranslations',
    PROGRESS: 'progressData',
    GAMES: 'savedGames'
};

/**
 * Save lessons to localStorage
 * @param {Array} lessons - Array of lesson objects
 */
export function saveLessons(lessons) {
    try {
        localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
        return true;
    } catch (error) {
        console.error('Failed to save lessons:', error);
        return false;
    }
}

/**
 * Load lessons from localStorage
 * @returns {Array} Array of lesson objects
 */
export function loadLessons() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.LESSONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load lessons:', error);
        return [];
    }
}

/**
 * Save translations to localStorage
 * @param {Array} translations - Array of translation objects
 */
export function saveTranslations(translations) {
    try {
        localStorage.setItem(STORAGE_KEYS.TRANSLATIONS, JSON.stringify(translations));
        return true;
    } catch (error) {
        console.error('Failed to save translations:', error);
        return false;
    }
}

/**
 * Load translations from localStorage
 * @returns {Array} Array of translation objects
 */
export function loadTranslations() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load translations:', error);
        return [];
    }
}

/**
 * Save progress data to localStorage
 * @param {Object} progressData - Progress data object
 */
export function saveProgress(progressData) {
    try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData));
        return true;
    } catch (error) {
        console.error('Failed to save progress:', error);
        return false;
    }
}

/**
 * Load progress data from localStorage
 * @returns {Object} Progress data object
 */
export function loadProgress() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        return data ? JSON.parse(data) : {
            totalExercises: 0,
            totalScore: 0,
            lessonsCompleted: 0,
            practiceTime: 0,
            gamesPlayed: 0,
            totalGameScore: 0,
            history: [],
            gameHistory: []
        };
    } catch (error) {
        console.error('Failed to load progress:', error);
        return {
            totalExercises: 0,
            totalScore: 0,
            lessonsCompleted: 0,
            practiceTime: 0,
            gamesPlayed: 0,
            totalGameScore: 0,
            history: [],
            gameHistory: []
        };
    }
}

/**
 * Save game result to progress
 * @param {Object} gameResult - Game result with score, time, etc.
 */
export function saveGameResult(gameResult) {
    try {
        const progress = loadProgress();
        
        // Add to game history
        progress.gameHistory = progress.gameHistory || [];
        progress.gameHistory.push({
            date: new Date().toISOString(),
            score: gameResult.firstTryAccuracy,
            firstTryMatches: gameResult.firstTryMatches,
            totalPairs: gameResult.totalPairs,
            time: gameResult.formattedTime,
            elapsedSeconds: gameResult.elapsedTime
        });
        
        // Update totals
        progress.gamesPlayed = (progress.gamesPlayed || 0) + 1;
        progress.totalGameScore = (progress.totalGameScore || 0) + gameResult.firstTryAccuracy;
        
        saveProgress(progress);
        return true;
    } catch (error) {
        console.error('Failed to save game result:', error);
        return false;
    }
}

/**
 * Clear all stored data
 */
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.LESSONS);
        localStorage.removeItem(STORAGE_KEYS.TRANSLATIONS);
        localStorage.removeItem(STORAGE_KEYS.PROGRESS);
        return true;
    } catch (error) {
        console.error('Failed to clear data:', error);
        return false;
    }
}

/**
 * Get storage usage information
 * @returns {Object} Storage info with used and available space
 */
export function getStorageInfo() {
    try {
        const lessons = localStorage.getItem(STORAGE_KEYS.LESSONS) || '';
        const translations = localStorage.getItem(STORAGE_KEYS.TRANSLATIONS) || '';
        const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS) || '';
        
        const totalSize = lessons.length + translations.length + progress.length;
        
        return {
            lessonsSize: lessons.length,
            translationsSize: translations.length,
            progressSize: progress.length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2)
        };
    } catch (error) {
        console.error('Failed to get storage info:', error);
        return null;
    }
}

/**
 * Save games to localStorage
 * @param {Array} games - Array of game objects
 */
export function saveGames(games) {
    try {
        localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
        return true;
    } catch (error) {
        console.error('Failed to save games:', error);
        return false;
    }
}

/**
 * Load games from localStorage
 * @returns {Array} Array of game objects
 */
export function loadGames() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.GAMES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load games:', error);
        return [];
    }
}

