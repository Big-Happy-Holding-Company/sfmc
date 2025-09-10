/**
 * Centralized ID Conversion Service
 * 
 * Single Responsibility: Handle all puzzle ID format conversions
 * DRY Compliance: Eliminates duplicate ID conversion logic scattered across services
 * 
 * Handles conversions between:
 * - Raw ARC IDs (e.g., "007bbfb7")  
 * - PlayFab prefixed IDs (e.g., "ARC-TR-007bbfb7")
 * - Dataset identification from file paths and prefixes
 * - ID validation and format detection
 */

export type ARCDatasetType = 'training' | 'training2' | 'evaluation' | 'evaluation2';

interface IDValidationResult {
  isValid: boolean;
  format: 'arc' | 'playfab' | 'unknown';
  dataset?: ARCDatasetType;
  arcId?: string;
  prefix?: string;
}

/**
 * Centralized ID Converter
 * Single source of truth for all ID format conversions
 */
export class IDConverter {
  private static instance: IDConverter;
  
  // Dataset prefix mapping (matches upload script format)
  private readonly prefixMap: Record<ARCDatasetType, string> = {
    'training': 'ARC-TR-',
    'evaluation': 'ARC-EV-', 
    'training2': 'ARC-T2-',
    'evaluation2': 'ARC-E2-'
  };

  // Reverse mapping for prefix to dataset
  private readonly datasetMap: Record<string, ARCDatasetType> = {
    'TR': 'training',
    'EV': 'evaluation',
    'T2': 'training2',
    'E2': 'evaluation2'
  };

  private constructor() {}

  public static getInstance(): IDConverter {
    if (!IDConverter.instance) {
      IDConverter.instance = new IDConverter();
    }
    return IDConverter.instance;
  }

  /**
   * Convert raw ARC ID to PlayFab prefixed format
   * 007bbfb7 + training -> ARC-TR-007bbfb7
   */
  arcToPlayFab(arcId: string, dataset: ARCDatasetType = 'training'): string {
    // Return as-is if already in PlayFab format
    if (this.isPlayFabFormat(arcId)) {
      return arcId;
    }

    // Validate ARC ID format
    if (!this.isValidArcId(arcId)) {
      throw new Error(`Invalid ARC ID format: ${arcId}`);
    }

    return this.prefixMap[dataset] + arcId;
  }

  /**
   * Convert PlayFab prefixed ID to raw ARC ID
   * ARC-TR-007bbfb7 -> 007bbfb7
   */
  playFabToArc(playFabId: string): string {
    // Return as-is if already in ARC format  
    if (!this.isPlayFabFormat(playFabId)) {
      return playFabId;
    }

    return playFabId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
  }

  /**
   * Extract dataset from PlayFab ID
   * ARC-TR-007bbfb7 -> training
   */
  getDatasetFromPlayFabId(playFabId: string): ARCDatasetType | null {
    const match = playFabId.match(/^ARC-(TR|T2|EV|E2)-/);
    return match ? this.datasetMap[match[1]] : null;
  }

  /**
   * Determine dataset from file path
   * /data/training/007bbfb7.json -> training
   */
  getDatasetFromPath(filePath: string): ARCDatasetType | null {
    if (filePath.includes('/training2/')) return 'training2';
    if (filePath.includes('/training/')) return 'training';
    if (filePath.includes('/evaluation2/')) return 'evaluation2';
    if (filePath.includes('/evaluation/')) return 'evaluation';
    return null;
  }

  /**
   * Comprehensive ID validation with format detection
   */
  validateId(id: string): IDValidationResult {
    if (!id || typeof id !== 'string') {
      return { isValid: false, format: 'unknown' };
    }

    // Check PlayFab format: ARC-XX-xxxxxxxx
    const playFabMatch = id.match(/^ARC-(TR|EV|T2|E2)-([a-f0-9]{8})$/);
    if (playFabMatch) {
      const dataset = this.datasetMap[playFabMatch[1]];
      return {
        isValid: true,
        format: 'playfab',
        dataset,
        arcId: playFabMatch[2],
        prefix: playFabMatch[1]
      };
    }

    // Check ARC format: 8 hex characters
    if (id.match(/^[a-f0-9]{8}$/)) {
      return {
        isValid: true,
        format: 'arc',
        arcId: id
      };
    }

    return { isValid: false, format: 'unknown' };
  }

  /**
   * Clean and normalize ID to ARC format
   * Handles various input formats and returns clean ARC ID
   */
  normalizeToArcId(input: string): string | null {
    const validation = this.validateId(input.trim().toLowerCase());
    return validation.isValid && validation.arcId ? validation.arcId : null;
  }

  /**
   * Convert any ID format to PlayFab format with dataset detection
   * Uses intelligent dataset detection if not specified
   */
  normalizeToPlayFabId(input: string, defaultDataset: ARCDatasetType = 'training'): string | null {
    const validation = this.validateId(input.trim());
    
    if (!validation.isValid || !validation.arcId) {
      return null;
    }

    // Use detected dataset or fallback to default
    const dataset = validation.dataset || defaultDataset;
    return this.arcToPlayFab(validation.arcId, dataset);
  }

  /**
   * Find matching IDs across different formats
   * Returns array of IDs that represent the same puzzle
   */
  findMatchingIds(targetId: string, candidateIds: string[]): string[] {
    const normalizedTarget = this.normalizeToArcId(targetId);
    if (!normalizedTarget) return [];

    return candidateIds.filter(candidateId => {
      const normalizedCandidate = this.normalizeToArcId(candidateId);
      return normalizedCandidate === normalizedTarget;
    });
  }

  /**
   * Generate PlayFab batch key for dataset and batch number
   */
  generateBatchKey(dataset: ARCDatasetType, batchNumber: number): string {
    return `officer-tasks-${dataset}-batch${batchNumber}.json`;
  }

  /**
   * Parse batch key to extract dataset and batch number
   */
  parseBatchKey(batchKey: string): { dataset: ARCDatasetType; batchNumber: number } | null {
    const match = batchKey.match(/^officer-tasks-(\w+)-batch(\d+)\.json$/);
    if (!match) return null;

    const dataset = match[1] as ARCDatasetType;
    const batchNumber = parseInt(match[2], 10);

    if (!this.isValidDataset(dataset) || isNaN(batchNumber)) {
      return null;
    }

    return { dataset, batchNumber };
  }

  /**
   * Get all possible PlayFab IDs for an ARC ID (across all datasets)
   */
  getAllPlayFabVariants(arcId: string): string[] {
    if (!this.isValidArcId(arcId)) return [];

    return Object.keys(this.prefixMap).map(dataset => 
      this.arcToPlayFab(arcId, dataset as ARCDatasetType)
    );
  }

  /**
   * Private validation helpers
   */
  private isValidArcId(id: string): boolean {
    return /^[a-f0-9]{8}$/.test(id);
  }

  private isPlayFabFormat(id: string): boolean {
    return /^ARC-(TR|T2|EV|E2)-[a-f0-9]{8}$/.test(id);
  }

  private isValidDataset(dataset: string): dataset is ARCDatasetType {
    return ['training', 'training2', 'evaluation', 'evaluation2'].includes(dataset);
  }

  /**
   * Get prefix for dataset
   */
  getPrefixForDataset(dataset: ARCDatasetType): string {
    return this.prefixMap[dataset];
  }

  /**
   * Get all supported datasets
   */
  getAllDatasets(): ARCDatasetType[] {
    return Object.keys(this.prefixMap) as ARCDatasetType[];
  }
}

// Export singleton instance
export const idConverter = IDConverter.getInstance();