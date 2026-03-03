/**
 * config.js - Global Namespace and Constants
 * 
 * Part of LifePlan Mobile V6 Refactoring.
 * Strictly adheres to non-ES6 module (global namespace) approach.
 */

window.LifePlanApp = {
    // Current App Version (Sync with PRO/LITE/PREMIUM)
    APP_VERSION: localStorage.getItem('DEBUG_APP_VERSION') || 'PRO',

    // Shared State & Data Storage
    state: {
        lastSimulationData: null,
        chartInstance: null,
        fullscreenChartInstance: null,
        lastHudIndex: -1,
        isDirty: false
    },

    // --- Education Cost Constants ---
    EDUCATION_RISK_RATE: 1.2,
    EDUCATION_BASE_COSTS: {
        preschool: 300000,
        elementary: 350000,
        elementary_private: 1600000,
        juniorHigh: 540000,
        juniorHigh_private: 1400000,
        highSchool_public: 520000,
        highSchool_private: 1050000,
        university_public: 1100000,
        university_private_arts: 1500000,
        university_private_science: 1800000,
        university_medical: 4500000
    },

    // --- Pension Logic Constants (2024 Standards) ---
    PENSION_BASIC_MAX: 81.6,
    PENSION_KOSEI_RATE: 0.005481,
    PENSION_START_AGE: 65
};

console.log('LifePlanApp config.js loaded');
