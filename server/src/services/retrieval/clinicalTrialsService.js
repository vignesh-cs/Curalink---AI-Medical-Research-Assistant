// server/src/services/retrieval/clinicalTrialsService.js
// ClinicalTrials.gov API v2 integration - FULLY CORRECTED

const axios = require('axios');
const logger = require('../../config/logger');

class ClinicalTrialsService {
    constructor() {
        this.baseURL = 'https://clinicaltrials.gov/api/v2/studies';
        
        // Valid status filters
        this.validStatuses = [
            'RECRUITING',
            'NOT_YET_RECRUITING',
            'ACTIVE_NOT_RECRUITING',
            'COMPLETED',
            'ENROLLING_BY_INVITATION',
            'TERMINATED',
            'WITHDRAWN',
            'UNKNOWN'
        ];
    }

    // Build query parameters for ClinicalTrials.gov API v2 - CORRECTED FORMAT
    buildQueryParams(options = {}) {
        const params = new URLSearchParams();
        
        // Required format
        params.append('format', 'json');
        params.append('pageSize', options.pageSize || 50);
        params.append('countTotal', 'true');
        
        if (options.pageToken) {
            params.append('pageToken', options.pageToken);
        }
        
        // Build query.cond parameter - main condition search
        if (options.condition) {
            // Clean the condition string - remove special characters
            const cleanCondition = options.condition.replace(/[()]/g, '').trim();
            params.append('query.cond', cleanCondition);
        }
        
        // Add term search if provided
        if (options.term) {
            const cleanTerm = options.term.replace(/[()]/g, '').trim();
            params.append('query.term', cleanTerm);
        }
        
        // Add location if provided
        if (options.location) {
            const cleanLocation = options.location.replace(/[()]/g, '').trim();
            params.append('query.loc', cleanLocation);
        }
        
        // Add status filter - CORRECTED FORMAT
        if (options.status) {
            const statusFilter = Array.isArray(options.status) ? options.status : [options.status];
            const validStatuses = statusFilter.filter(s => this.validStatuses.includes(s));
            if (validStatuses.length > 0) {
                params.append('filter.overallStatus', validStatuses.join(','));
            }
        } else {
            // Default to recruiting trials
            params.append('filter.overallStatus', 'RECRUITING,NOT_YET_RECRUITING');
        }
        
        // Add study type filter if provided
        if (options.studyType) {
            params.append('filter.studyType', options.studyType);
        }
        
        // Add phase filter if provided
        if (options.phase) {
            params.append('filter.phase', options.phase);
        }
        
        // Add sorting
        if (options.sort) {
            params.append('sort', options.sort);
        } else {
            params.append('sort', '@relevance');
        }
        
        return params;
    }

    // Search clinical trials - CORRECTED
    async searchTrials(options = {}) {
        try {
            const params = this.buildQueryParams(options);
            
            const url = `${this.baseURL}?${params.toString()}`;
            
            logger.info('Searching ClinicalTrials.gov:', {
                condition: options.condition,
                location: options.location,
                url: url.substring(0, 200) + '...'
            });
            
            const response = await axios.get(url, {
                timeout: 30000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Curalink-Medical-Assistant/1.0'
                }
            });
            
            const studies = response.data.studies || [];
            const totalCount = response.data.totalCount || 0;
            
            logger.info(`ClinicalTrials.gov returned ${studies.length} studies (total: ${totalCount})`);
            
            const formattedStudies = studies
                .map(study => this.formatTrialData(study))
                .filter(study => study !== null);
            
            return {
                studies: formattedStudies,
                totalCount,
                nextPageToken: response.data.nextPageToken || null
            };
        } catch (error) {
            logger.error('ClinicalTrials.gov search error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            
            // Return empty result instead of throwing
            return { 
                studies: [], 
                totalCount: 0,
                nextPageToken: null,
                error: error.message 
            };
        }
    }

    // Format trial data to standardized structure
    formatTrialData(study) {
        try {
            const protocolSection = study.protocolSection || {};
            const identificationModule = protocolSection.identificationModule || {};
            const statusModule = protocolSection.statusModule || {};
            const descriptionModule = protocolSection.descriptionModule || {};
            const designModule = protocolSection.designModule || {};
            const eligibilityModule = protocolSection.eligibilityModule || {};
            const contactsLocationsModule = protocolSection.contactsLocationsModule || {};
            const sponsorCollaboratorsModule = protocolSection.sponsorCollaboratorsModule || {};
            
            // Format locations
            const locations = [];
            if (contactsLocationsModule.locations) {
                contactsLocationsModule.locations.forEach(loc => {
                    locations.push({
                        facility: loc.facility || 'Unknown Facility',
                        city: loc.city || '',
                        state: loc.state || '',
                        country: loc.country || '',
                        status: loc.status || 'Unknown'
                    });
                });
            }
            
            // Format eligibility criteria
            let eligibilityCriteria = '';
            if (eligibilityModule.eligibilityCriteria) {
                eligibilityCriteria = eligibilityModule.eligibilityCriteria;
            }
            
            // Format contact information
            const contactInfo = {};
            if (contactsLocationsModule.centralContacts && contactsLocationsModule.centralContacts.length > 0) {
                const primaryContact = contactsLocationsModule.centralContacts[0] || {};
                contactInfo.name = primaryContact.name || 'Not specified';
                contactInfo.phone = primaryContact.phone || 'Not specified';
                contactInfo.email = primaryContact.email || 'Not specified';
            }
            
            // Get NCT ID
            const nctId = identificationModule.nctId || '';
            
            return {
                nctId: nctId,
                title: identificationModule.briefTitle || 'No title available',
                officialTitle: identificationModule.officialTitle || '',
                status: statusModule.overallStatus || 'Unknown',
                phase: designModule.phases || ['Not Specified'],
                studyType: designModule.studyType || 'Unknown',
                conditions: descriptionModule.conditions || [],
                briefSummary: descriptionModule.briefSummary || '',
                detailedDescription: descriptionModule.detailedDescription || '',
                eligibilityCriteria: eligibilityCriteria,
                locations: locations,
                contactInfo: contactInfo,
                sponsor: sponsorCollaboratorsModule.leadSponsor?.name || 'Unknown',
                startDate: statusModule.startDateStruct?.date || null,
                completionDate: statusModule.completionDateStruct?.date || null,
                enrollmentCount: statusModule.enrollmentInfo?.count || null,
                url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : '',
                lastUpdatePosted: statusModule.lastUpdatePostDateStruct?.date || null
            };
        } catch (error) {
            logger.error('Error formatting clinical trial data:', error);
            return null;
        }
    }

    // Get trials for specific condition
    async getTrialsByCondition(condition, options = {}) {
        try {
            const searchOptions = {
                ...options,
                condition: condition,
                status: options.status || ['RECRUITING', 'NOT_YET_RECRUITING'],
                pageSize: options.pageSize || 50
            };
            
            return await this.searchTrials(searchOptions);
        } catch (error) {
            logger.error('Error fetching trials by condition:', error);
            return { studies: [], totalCount: 0 };
        }
    }

    // Get trials with location filter
    async getTrialsByLocation(condition, location, options = {}) {
        try {
            const searchOptions = {
                ...options,
                condition: condition,
                location: location,
                pageSize: options.pageSize || 30
            };
            
            return await this.searchTrials(searchOptions);
        } catch (error) {
            logger.error('Error fetching trials by location:', error);
            return { studies: [], totalCount: 0 };
        }
    }

    // Get all trials with pagination
    async getAllTrials(query, maxResults = 50) {
        try {
            const allTrials = [];
            let nextPageToken = null;
            let pageCount = 0;
            const maxPages = 5; // Safety limit
            
            do {
                const result = await this.searchTrials({
                    condition: query.condition,
                    term: query.term,
                    location: query.location,
                    pageSize: Math.min(100, maxResults - allTrials.length),
                    pageToken: nextPageToken
                });
                
                const validTrials = result.studies.filter(t => t !== null);
                allTrials.push(...validTrials);
                
                nextPageToken = result.nextPageToken;
                pageCount++;
                
                if (!nextPageToken || allTrials.length >= maxResults || pageCount >= maxPages) {
                    break;
                }
            } while (allTrials.length < maxResults);
            
            return allTrials.slice(0, maxResults);
        } catch (error) {
            logger.error('Error fetching all trials:', error);
            return [];
        }
    }

    // Get trial by NCT ID
    async getTrialById(nctId) {
        try {
            const url = `${this.baseURL}/${nctId}?format=json`;
            
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Curalink-Medical-Assistant/1.0'
                }
            });
            
            return this.formatTrialData(response.data);
        } catch (error) {
            logger.error(`Error fetching trial ${nctId}:`, error.message);
            return null;
        }
    }
}

module.exports = new ClinicalTrialsService();