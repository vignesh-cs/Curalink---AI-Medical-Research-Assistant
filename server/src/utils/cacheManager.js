// server/src/utils/cacheManager.js
// Cache management utility

const NodeCache = require('node-cache');
const logger = require('../config/logger');

class CacheManager {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 3600,
            checkperiod: 600,
            useClones: false
        });
        
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0
        };
    }

    // Get value from cache
    get(key) {
        const value = this.cache.get(key);
        
        if (value !== undefined) {
            this.stats.hits++;
            logger.debug(`Cache hit for key: ${key}`);
            return value;
        }
        
        this.stats.misses++;
        logger.debug(`Cache miss for key: ${key}`);
        return null;
    }

    // Set value in cache
    set(key, value, ttl = 3600) {
        const success = this.cache.set(key, value, ttl);
        
        if (success) {
            this.stats.sets++;
            logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
        }
        
        return success;
    }

    // Delete value from cache
    delete(key) {
        const deleted = this.cache.del(key);
        logger.debug(`Cache delete for key: ${key}, success: ${deleted}`);
        return deleted;
    }

    // Check if key exists
    has(key) {
        return this.cache.has(key);
    }

    // Get multiple keys
    getMultiple(keys) {
        const values = this.cache.mget(keys);
        const hits = Object.keys(values).length;
        
        this.stats.hits += hits;
        this.stats.misses += keys.length - hits;
        
        return values;
    }

    // Set multiple keys
    setMultiple(keyValuePairs, ttl = 3600) {
        const success = this.cache.mset(
            keyValuePairs.map(({ key, val }) => ({ key, val, ttl }))
        );
        
        this.stats.sets += keyValuePairs.length;
        
        return success;
    }

    // Flush entire cache
    flush() {
        this.cache.flushAll();
        logger.info('Cache flushed');
    }

    // Get cache statistics
    getStats() {
        const cacheStats = this.cache.getStats();
        
        return {
            ...this.stats,
            keys: cacheStats.keys,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            size: cacheStats.vsize
        };
    }

    // Get keys by pattern
    getKeysByPattern(pattern) {
        const allKeys = this.cache.keys();
        const regex = new RegExp(pattern);
        
        return allKeys.filter(key => regex.test(key));
    }

    // Delete keys by pattern
    deleteByPattern(pattern) {
        const keys = this.getKeysByPattern(pattern);
        const deleted = this.cache.del(keys);
        logger.info(`Deleted ${deleted} keys matching pattern: ${pattern}`);
        return deleted;
    }
}

module.exports = new CacheManager();