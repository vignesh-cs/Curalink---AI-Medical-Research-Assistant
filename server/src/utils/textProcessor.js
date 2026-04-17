// server/src/utils/textProcessor.js
// Text processing utilities

class TextProcessor {
    // Extract keywords from text
    extractKeywords(text, maxKeywords = 10) {
        if (!text) return [];
        
        const stopWords = new Set([
            'the', 'and', 'or', 'but', 'for', 'with', 'about', 'from',
            'this', 'that', 'these', 'those', 'they', 'what', 'when',
            'where', 'which', 'while', 'were', 'been', 'have', 'has'
        ]);
        
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));
        
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        return Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxKeywords)
            .map(([word]) => word);
    }

    // Truncate text to specified length
    truncate(text, maxLength = 200, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        return truncated.substring(0, lastSpace) + suffix;
    }

    // Calculate text similarity (simple Jaccard similarity)
    calculateSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;
        
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        
        const intersection = [...words1].filter(word => words2.has(word));
        const union = new Set([...words1, ...words2]);
        
        return intersection.length / union.size;
    }

    // Extract sentences containing specific terms
    extractRelevantSentences(text, terms, maxSentences = 5) {
        if (!text || !terms || terms.length === 0) return [];
        
        const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
        const termLower = terms.map(t => t.toLowerCase());
        
        const relevant = sentences.filter(sentence => {
            const lower = sentence.toLowerCase();
            return termLower.some(term => lower.includes(term));
        });
        
        return relevant.slice(0, maxSentences);
    }

    // Clean and normalize text
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')
            .replace(/[^\x20-\x7E\s]/g, '')
            .trim();
    }

    // Format author names
    formatAuthors(authors, maxAuthors = 3) {
        if (!authors || authors.length === 0) return 'Unknown';
        
        if (authors.length <= maxAuthors) {
            return authors.join(', ');
        }
        
        return `${authors.slice(0, maxAuthors).join(', ')} et al.`;
    }

    // Generate summary from abstract
    generateSummary(abstract, maxLength = 150) {
        if (!abstract) return '';
        
        const cleaned = this.cleanText(abstract);
        const firstSentence = cleaned.split('.')[0];
        
        if (firstSentence.length <= maxLength) {
            return firstSentence + '.';
        }
        
        return this.truncate(firstSentence, maxLength);
    }
}

module.exports = new TextProcessor();