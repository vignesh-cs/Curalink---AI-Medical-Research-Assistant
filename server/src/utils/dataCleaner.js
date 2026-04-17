// server/src/utils/dataCleaner.js
// Centralized data cleaning utility

class DataCleaner {
    // Convert any value to safe string
    safeString(value, defaultValue = '') {
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'string') return value.trim() || defaultValue;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) {
            const cleaned = value.map(v => this.safeString(v, '')).filter(v => v);
            return cleaned.length > 0 ? cleaned.join(', ') : defaultValue;
        }
        if (typeof value === 'object') {
            // Handle PubMed-style objects
            if (value._) return this.safeString(value._, defaultValue);
            if (value['#text']) return this.safeString(value['#text'], defaultValue);
            if (value.i && Array.isArray(value.i)) {
                return value.i.join(' ') || defaultValue;
            }
            // Try to stringify meaningfully
            try {
                return JSON.stringify(value);
            } catch {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    // Clean publication object
    cleanPublication(pub) {
        if (!pub) return null;
        
        return {
            id: pub.id || `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: this.safeString(pub.title, 'No title available'),
            authors: Array.isArray(pub.authors) && pub.authors.length > 0 
                ? pub.authors.map(a => this.safeString(a, 'Unknown')).filter(a => a)
                : ['Unknown Authors'],
            abstract: this.safeString(pub.abstract, 'No abstract available'),
            journal: this.safeString(pub.journal, 'Unknown Journal'),
            year: pub.year || null,
            doi: this.safeString(pub.doi, ''),
            url: this.safeString(pub.url, '#'),
            source: this.safeString(pub.source, 'unknown'),
            citedByCount: pub.citedByCount || 0,
            rankingScore: pub.rankingScore || 0
        };
    }

    // Clean clinical trial object
    cleanTrial(trial) {
        if (!trial) return null;
        
        return {
            nctId: this.safeString(trial.nctId, `NCT${Date.now()}`),
            title: this.safeString(trial.title, 'No title available'),
            status: this.safeString(trial.status, 'Unknown'),
            phase: this.safeString(trial.phase, 'Not Specified'),
            conditions: Array.isArray(trial.conditions) ? trial.conditions : [],
            briefSummary: this.safeString(trial.briefSummary, 'No summary available'),
            locations: Array.isArray(trial.locations) ? trial.locations : [],
            url: this.safeString(trial.url, '#'),
            rankingScore: trial.rankingScore || 0
        };
    }

    // Batch clean publications
    cleanPublications(publications) {
        if (!Array.isArray(publications)) return [];
        return publications
            .map(p => this.cleanPublication(p))
            .filter(p => p !== null);
    }

    // Batch clean trials
    cleanTrials(trials) {
        if (!Array.isArray(trials)) return [];
        return trials
            .map(t => this.cleanTrial(t))
            .filter(t => t !== null);
    }

    // Normalize query for caching
    normalizeQuery(query) {
        return this.safeString(query)
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}

module.exports = new DataCleaner();