// Lessons Module
// Handles lesson creation, management, and CRUD operations

import { saveLessons, loadLessons } from './storage.js';

// Module state
let lessons = [];

/**
 * Validate and normalize lesson structure
 * @param {Object} lesson - Raw lesson object
 * @returns {Object|null} Normalized lesson or null if invalid
 */
function normalizeLesson(lesson) {
    if (!lesson || typeof lesson !== 'object') return null;

    const lessonName = typeof lesson.name === 'string' ? lesson.name.trim() : '';
    if (!lessonName) return null;

    if (!Array.isArray(lesson.exercises) || lesson.exercises.length === 0) return null;

    const normalizedExercises = lesson.exercises
        .map(ex => {
            if (!ex || typeof ex !== 'object') return null;

            const chinese = typeof ex.chinese === 'string' ? ex.chinese.trim() : '';
            const pinyin = typeof ex.pinyin === 'string' ? ex.pinyin.trim() : '';
            const english = typeof ex.english === 'string' ? ex.english.trim() : '';

            if (!chinese || !pinyin || !english) return null;

            return {
                chinese,
                pinyin,
                english,
                audioUrl: ex.audioUrl || null,
                ratings: Array.isArray(ex.ratings) ? ex.ratings : []
            };
        })
        .filter(Boolean);

    if (normalizedExercises.length === 0) return null;

    return {
        id: typeof lesson.id === 'string' && lesson.id.trim() ? lesson.id : `lesson-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: lessonName,
        date: lesson.date || new Date().toISOString(),
        exercises: normalizedExercises
    };
}

/**
 * Initialize lessons module
 * @returns {Array} Array of lessons
 */
export function initializeLessons() {
    lessons = loadLessons();
    return lessons;
}

/**
 * Replace in-memory lessons and persist to localStorage
 * @param {Array} nextLessons - Normalized lessons array
 */
function replaceLessons(nextLessons) {
    lessons = nextLessons;
    saveLessons(lessons);
}

/**
 * Create a new lesson
 * @param {string} name - Lesson name
 * @param {Array} exercises - Array of exercise objects
 * @returns {Object} Created lesson object
 */
export function createLesson(name, exercises) {
    const newLesson = {
        id: 'lesson-' + Date.now(),
        name: name.trim(),
        date: new Date().toISOString(),
        exercises: exercises.map(ex => ({
            chinese: ex.chinese,
            pinyin: ex.pinyin,
            english: ex.english,
            audioUrl: ex.audioUrl || null,
            ratings: []
        }))
    };
    
    lessons.push(newLesson);
    saveLessons(lessons);
    return newLesson;
}

/**
 * Get all lessons
 * @returns {Array} Array of lesson objects
 */
export function getLessons() {
    return [...lessons];
}

/**
 * Get a specific lesson by ID
 * @param {string} lessonId - Lesson ID
 * @returns {Object|null} Lesson object or null if not found
 */
export function getLesson(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson ? { ...lesson } : null;
}

/**
 * Update a lesson
 * @param {string} lessonId - Lesson ID
 * @param {Object} updates - Updates to apply
 * @returns {boolean} True if updated successfully
 */
export function updateLesson(lessonId, updates) {
    const index = lessons.findIndex(l => l.id === lessonId);
    if (index === -1) return false;
    
    lessons[index] = {
        ...lessons[index],
        ...updates,
        id: lessons[index].id, // Preserve ID
        date: lessons[index].date // Preserve creation date
    };
    
    saveLessons(lessons);
    return true;
}

/**
 * Delete a lesson
 * @param {string} lessonId - Lesson ID
 * @returns {boolean} True if deleted successfully
 */
export function deleteLesson(lessonId) {
    const initialLength = lessons.length;
    lessons = lessons.filter(l => l.id !== lessonId);
    
    if (lessons.length < initialLength) {
        saveLessons(lessons);
        return true;
    }
    
    return false;
}

/**
 * Add rating to an exercise
 * @param {string} lessonId - Lesson ID
 * @param {number} exerciseIndex - Exercise index
 * @param {Object} rating - Rating object
 * @returns {boolean} True if added successfully
 */
export function addExerciseRating(lessonId, exerciseIndex, rating) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.exercises[exerciseIndex]) return false;
    
    if (!lesson.exercises[exerciseIndex].ratings) {
        lesson.exercises[exerciseIndex].ratings = [];
    }
    
    lesson.exercises[exerciseIndex].ratings.push({
        ...rating,
        date: new Date().toISOString()
    });
    
    saveLessons(lessons);
    return true;
}

/**
 * Get lesson statistics
 * @param {string} lessonId - Lesson ID
 * @returns {Object|null} Statistics object
 */
export function getLessonStats(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return null;
    
    const totalExercises = lesson.exercises.length;
    let totalRatings = 0;
    let sumScore = 0;
    
    lesson.exercises.forEach(ex => {
        if (ex.ratings && ex.ratings.length > 0) {
            totalRatings += ex.ratings.length;
            ex.ratings.forEach(r => {
                sumScore += (r.stars / 5) * 100;
            });
        }
    });
    
    return {
        lessonId: lesson.id,
        lessonName: lesson.name,
        totalExercises,
        totalRatings,
        avgScore: totalRatings > 0 ? Math.round(sumScore / totalRatings) : 0,
        completionRate: totalRatings > 0 ? Math.round((totalRatings / totalExercises) * 100) : 0
    };
}

/**
 * Search lessons by name
 * @param {string} query - Search query
 * @returns {Array} Array of matching lessons
 */
export function searchLessons(query) {
    const lowerQuery = query.toLowerCase();
    return lessons.filter(lesson => 
        lesson.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get lessons sorted by date
 * @param {boolean} ascending - Sort order (true for oldest first)
 * @returns {Array} Sorted array of lessons
 */
export function getLessonsByDate(ascending = false) {
    const sorted = [...lessons].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return ascending ? dateA - dateB : dateB - dateA;
    });
    return sorted;
}

/**
 * Get total number of lessons
 * @returns {number} Number of lessons
 */
export function getLessonCount() {
    return lessons.length;
}

/**
 * Check if a lesson name already exists
 * @param {string} name - Lesson name to check
 * @returns {boolean} True if exists
 */
export function lessonNameExists(name) {
    return lessons.some(l => l.name.toLowerCase() === name.toLowerCase());
}

/**
 * Duplicate a lesson with a new name
 * @param {string} lessonId - Lesson ID to duplicate
 * @param {string} newName - Name for the duplicated lesson
 * @returns {Object|null} New lesson object or null if failed
 */
export function duplicateLesson(lessonId, newName) {
    const original = lessons.find(l => l.id === lessonId);
    if (!original) return null;
    
    const duplicate = {
        id: 'lesson-' + Date.now(),
        name: newName,
        date: new Date().toISOString(),
        exercises: original.exercises.map(ex => ({
            ...ex,
            ratings: [] // Don't copy ratings
        }))
    };
    
    lessons.push(duplicate);
    saveLessons(lessons);
    return duplicate;
}

/**
 * Export lesson as JSON
 * @param {string} lessonId - Lesson ID
 * @returns {string|null} JSON string or null if not found
 */
export function exportLesson(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return null;
    return JSON.stringify(lesson, null, 2);
}

/**
 * Export all lessons as JSON
 * @returns {string} JSON string of all lessons
 */
export function exportAllLessons() {
    return JSON.stringify(lessons, null, 2);
}

/**
 * Import lesson from JSON
 * @param {string} jsonData - JSON string of lesson
 * @returns {Object|null} Imported lesson or null if failed
 */
export function importLesson(jsonData) {
    try {
        const lesson = JSON.parse(jsonData);
        lesson.id = 'lesson-' + Date.now(); // Generate new ID
        lesson.date = new Date().toISOString(); // Update date
        
        lessons.push(lesson);
        saveLessons(lessons);
        return lesson;
    } catch (error) {
        console.error('Failed to import lesson:', error);
        return null;
    }
}

/**
 * Import multiple lessons from JSON string or array
 * @param {string|Array} sourceData - JSON string or lesson array
 * @param {Object} options - Import options
 * @param {string} options.mode - 'merge' (default) or 'replace'
 * @returns {Object} Import result summary
 */
export function importLessons(sourceData, options = {}) {
    const mode = options.mode || 'merge';

    try {
        const parsed = typeof sourceData === 'string' ? JSON.parse(sourceData) : sourceData;
        const incomingArray = Array.isArray(parsed) ? parsed : [parsed];
        const normalizedIncoming = incomingArray.map(normalizeLesson).filter(Boolean);

        if (normalizedIncoming.length === 0) {
            return {
                success: false,
                importedCount: 0,
                skippedCount: incomingArray.length,
                totalCount: lessons.length,
                message: 'No valid lessons found in import file.'
            };
        }

        if (mode === 'replace') {
            replaceLessons(normalizedIncoming);
            return {
                success: true,
                importedCount: normalizedIncoming.length,
                skippedCount: incomingArray.length - normalizedIncoming.length,
                totalCount: lessons.length,
                message: `Replaced lessons with ${normalizedIncoming.length} imported lesson(s).`
            };
        }

        // Merge mode: keep existing, upsert by lesson id.
        const mergedById = new Map(lessons.map(lesson => [lesson.id, lesson]));
        normalizedIncoming.forEach(lesson => {
            mergedById.set(lesson.id, lesson);
        });

        const beforeCount = lessons.length;
        const mergedLessons = Array.from(mergedById.values());
        replaceLessons(mergedLessons);

        const importedCount = mergedLessons.length - beforeCount >= 0
            ? mergedLessons.length - beforeCount
            : normalizedIncoming.length;

        return {
            success: true,
            importedCount,
            skippedCount: incomingArray.length - normalizedIncoming.length,
            totalCount: lessons.length,
            message: `Merged ${normalizedIncoming.length} lesson(s).`
        };
    } catch (error) {
        console.error('Failed to import lessons:', error);
        return {
            success: false,
            importedCount: 0,
            skippedCount: 0,
            totalCount: lessons.length,
            message: error.message || 'Import failed.'
        };
    }
}
