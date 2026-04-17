// server/src/utils/helpers.js
// General helper functions

const crypto = require('crypto');

class Helpers {
    // Generate unique ID
    generateId(prefix = 'id', length = 16) {
        return `${prefix}_${crypto.randomBytes(length).toString('hex')}`;
    }

    // Generate hash from string
    generateHash(str, algorithm = 'md5') {
        return crypto.createHash(algorithm).update(str).digest('hex');
    }

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Sleep/delay function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Retry function with exponential backoff
    async retry(fn, options = {}) {
        const {
            maxAttempts = 3,
            initialDelay = 1000,
            backoffFactor = 2,
            shouldRetry = () => true
        } = options;
        
        let lastError;
        let delay = initialDelay;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxAttempts || !shouldRetry(error)) {
                    throw error;
                }
                
                await this.sleep(delay);
                delay *= backoffFactor;
            }
        }
        
        throw lastError;
    }

    // Chunk array into smaller arrays
    chunkArray(array, size) {
        const chunks = [];
        
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        
        return chunks;
    }

    // Debounce function
    debounce(fn, delay) {
        let timeout;
        
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Throttle function
    throttle(fn, limit) {
        let inThrottle;
        
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Format bytes to human readable
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Format duration
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes < 60) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        return `${hours}h ${remainingMinutes}m`;
    }

    // Parse JSON safely
    safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch {
            return defaultValue;
        }
    }

    // Remove undefined and null values from object
    cleanObject(obj) {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v != null)
        );
    }
}

module.exports = new Helpers();