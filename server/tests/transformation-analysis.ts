/**
 * Transformation Analysis Tool
 * 
 * This tool analyzes transformation implementations across different parameters
 * to ensure consistency, correctness, and appropriate difficulty levels.
 * 
 * @author Cascade
 */

import { getGridGenerator } from '../templates/generators';
import { TRANSFORMATION_TYPES, getTransformationByType } from '../templates/transformations';
import { ExamplePair } from '../templates/task.interface';

/**
 * Analysis results for a transformation
 */
interface TransformationAnalysisResult {
  transformationType: string;
  name: string;
  gridGenerator: string;
  difficulty: string;
  consistency: number; // 0-1 score
  validityRate: number; // 0-1 score
  averageExecutionTime?: number; // milliseconds
  recommendedDifficulty: string;
  gridSizeAnalysis: {
    size2: { validityRate: number, complexity: number },
    size3: { validityRate: number, complexity: number },
    size4: { validityRate: number, complexity: number }
  };
  issues: string[];
}

/**
 * Configuration for transformation analysis
 */
interface AnalysisConfig {
  samplesPerSize: number;
  collectPerformance: boolean;
  consistencyThreshold: number; // 0-1 value
  validityThreshold: number; // 0-1 value
}

/**
 * Main analysis class for transformations
 */
export class TransformationAnalyzer {
  private config: AnalysisConfig;
  
  /**
   * Create a new TransformationAnalyzer
   * @param config Analysis configuration
   */
  constructor(config: AnalysisConfig = {
    samplesPerSize: 100,
    collectPerformance: true,
    consistencyThreshold: 0.95,
    validityThreshold: 0.98
  }) {
    this.config = config;
  }
  
  /**
   * Analyze all transformations
   * @returns Results for all transformations
   */
  async analyzeAllTransformations(): Promise<TransformationAnalysisResult[]> {
    const results: TransformationAnalysisResult[] = [];
    
    for (const transformationType of TRANSFORMATION_TYPES) {
      console.log(`Analyzing ${transformationType}...`);
      try {
        const result = await this.analyzeTransformation(transformationType);
        results.push(result);
      } catch (error) {
        console.error(`Error analyzing ${transformationType}: ${error}`);
      }
    }
    
    return results;
  }
  
  /**
   * Analyze a specific transformation
   * @param transformationType Transformation type to analyze
   * @returns Analysis results
   */
  async analyzeTransformation(transformationType: string): Promise<TransformationAnalysisResult> {
    const transformation = getTransformationByType(transformationType);
    if (!transformation) {
      throw new Error(`Transformation ${transformationType} not found`);
    }
    
    const generator = getGridGenerator(transformation.gridGenerator);
    if (!generator) {
      throw new Error(`Grid generator ${transformation.gridGenerator} not found`);
    }
    
    const issues: string[] = [];
    
    // Analyze each grid size
    const size2Analysis = await this.analyzeGridSize(generator, 2);
    const size3Analysis = await this.analyzeGridSize(generator, 3);
    const size4Analysis = await this.analyzeGridSize(generator, 4);
    
    // Calculate overall consistency and validity scores
    const consistencyScores = [
      size2Analysis.consistency,
      size3Analysis.consistency,
      size4Analysis.consistency
    ];
    const validityScores = [
      size2Analysis.validityRate,
      size3Analysis.validityRate,
      size4Analysis.validityRate
    ];
    
    const overallConsistency = this.average(consistencyScores);
    const overallValidityRate = this.average(validityScores);
    
    // Check for issues
    if (overallConsistency < this.config.consistencyThreshold) {
      issues.push(`Low consistency score: ${overallConsistency.toFixed(2)}`);
    }
    
    if (overallValidityRate < this.config.validityThreshold) {
      issues.push(`Low validity rate: ${overallValidityRate.toFixed(2)}`);
    }
    
    // Determine recommended difficulty
    const recommendedDifficulty = this.recommendDifficulty(
      size2Analysis.complexity,
      size3Analysis.complexity,
      size4Analysis.complexity
    );
    
    if (recommendedDifficulty !== transformation.difficulty) {
      issues.push(`Current difficulty (${transformation.difficulty}) differs from recommended (${recommendedDifficulty})`);
    }
    
    // Combine performance metrics if collected
    let averageExecutionTime: number | undefined;
    if (this.config.collectPerformance) {
      const executionTimes = [
        size2Analysis.executionTime || 0,
        size3Analysis.executionTime || 0,
        size4Analysis.executionTime || 0
      ];
      averageExecutionTime = this.average(executionTimes);
    }
    
    return {
      transformationType,
      name: transformation.name,
      gridGenerator: transformation.gridGenerator,
      difficulty: transformation.difficulty,
      consistency: overallConsistency,
      validityRate: overallValidityRate,
      averageExecutionTime,
      recommendedDifficulty,
      gridSizeAnalysis: {
        size2: { validityRate: size2Analysis.validityRate, complexity: size2Analysis.complexity },
        size3: { validityRate: size3Analysis.validityRate, complexity: size3Analysis.complexity },
        size4: { validityRate: size4Analysis.validityRate, complexity: size4Analysis.complexity }
      },
      issues
    };
  }
  
  /**
   * Analyze a transformation for a specific grid size
   * @param generator Grid generator
   * @param size Grid size
   * @returns Analysis results for the grid size
   */
  private async analyzeGridSize(generator: any, size: number): Promise<{
    validityRate: number,
    consistency: number,
    complexity: number,
    executionTime?: number
  }> {
    const samples = this.config.samplesPerSize;
    let validCount = 0;
    let totalExecutionTime = 0;
    const complexityScores: number[] = [];
    const consistencyMeasures = new Map<string, number>();
    
    for (let i = 0; i < samples; i++) {
      const startTime = this.config.collectPerformance ? performance.now() : 0;
      
      // Generate a test case
      const { input, output } = generator.generateTestCase(size);
      
      // Measure execution time
      if (this.config.collectPerformance) {
        totalExecutionTime += performance.now() - startTime;
      }
      
      // Check validity
      const isValid = generator.validateTransformation(input, output);
      if (isValid) {
        validCount++;
        
        // Measure complexity
        const complexity = this.calculateComplexity(input, output);
        complexityScores.push(complexity);
        
        // Track patterns for consistency analysis
        const pattern = this.getTransformationPattern(input, output);
        consistencyMeasures.set(pattern, (consistencyMeasures.get(pattern) || 0) + 1);
      }
    }
    
    // Calculate metrics
    const validityRate = validCount / samples;
    const averageComplexity = this.average(complexityScores);
    
    // Calculate consistency (how many follow the same pattern)
    const consistencyScore = this.calculateConsistencyScore(consistencyMeasures, validCount);
    
    return {
      validityRate,
      consistency: consistencyScore,
      complexity: averageComplexity,
      executionTime: this.config.collectPerformance ? totalExecutionTime / samples : undefined
    };
  }
  
  /**
   * Calculate a simple complexity score for a transformation
   * Higher score means more complex
   * @param input Input grid
   * @param output Output grid
   * @returns Complexity score (0-1)
   */
  private calculateComplexity(input: number[][], output: number[][]): number {
    // Calculate diversity of values in both input and output
    const uniqueInputValues = new Set<number>();
    const uniqueOutputValues = new Set<number>();
    
    // Count unique values
    for (const row of input) {
      for (const value of row) {
        uniqueInputValues.add(value);
      }
    }
    
    for (const row of output) {
      for (const value of row) {
        uniqueOutputValues.add(value);
      }
    }
    
    // Calculate pattern changes from input to output
    const inputMax = Math.max(...Array.from(uniqueInputValues.values()));
    const outputMax = Math.max(...Array.from(uniqueOutputValues.values()));
    const valueRange = Math.max(inputMax, outputMax);
    
    // More unique values and higher ranges indicate more complexity
    const valueComplexity = (uniqueInputValues.size + uniqueOutputValues.size) / (2 * 10);
    
    // A simple metric for the transformation itself is how many cells have different values
    // relative to their input cells or adjacent cells
    let differenceCount = 0;
    const totalCells = input.length * input[0].length;
    
    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[i].length; j++) {
        if (output[i] && output[i][j] !== input[i][j]) {
          differenceCount++;
        }
      }
    }
    
    const transformationComplexity = differenceCount / totalCells;
    
    // Combine metrics with weights
    return (valueComplexity * 0.4) + (transformationComplexity * 0.6);
  }
  
  /**
   * Calculate a consistency score based on pattern frequencies
   * @param patterns Map of pattern frequencies
   * @param validCount Number of valid samples
   * @returns Consistency score (0-1)
   */
  private calculateConsistencyScore(patterns: Map<string, number>, validCount: number): number {
    if (validCount === 0) return 0;
    
    // Get the most common pattern
    const counts = Array.from(patterns.values());
    const mostCommon = Math.max(...counts);
    
    // Calculate what percentage of valid samples follow the most common pattern
    return mostCommon / validCount;
  }
  
  /**
   * Get a string representation of the transformation pattern
   * @param input Input grid
   * @param output Output grid
   * @returns Pattern string
   */
  private getTransformationPattern(input: number[][], output: number[][]): string {
    // This is a simplified representation that we use to group similar transformations
    // In a real implementation, this would be more sophisticated
    
    const size = input.length;
    const pattern: string[] = [];
    
    // Create a pattern based on differences between input and output
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (output[i] && output[i][j] !== input[i][j]) {
          pattern.push(`${i},${j}:${input[i][j]}>${output[i][j]}`);
        }
      }
    }
    
    return pattern.join(';');
  }
  
  /**
   * Recommend a difficulty level based on complexity scores
   * @param size2Complexity Complexity for size 2
   * @param size3Complexity Complexity for size 3
   * @param size4Complexity Complexity for size 4
   * @returns Recommended difficulty level
   */
  private recommendDifficulty(
    size2Complexity: number,
    size3Complexity: number,
    size4Complexity: number
  ): string {
    // Calculate a weighted average of complexity scores, emphasizing larger grids
    const weightedComplexity = (
      size2Complexity * 0.2 +
      size3Complexity * 0.3 +
      size4Complexity * 0.5
    );
    
    // Map complexity score to difficulty level
    if (weightedComplexity < 0.3) {
      return 'Basic';
    } else if (weightedComplexity < 0.6) {
      return 'Intermediate';
    } else {
      return 'Advanced';
    }
  }
  
  /**
   * Calculate the average of an array of numbers
   * @param values Array of numbers
   * @returns Average value
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/**
 * Run the transformation analysis as a standalone script
 */
if (require.main === module) {
  const analyzer = new TransformationAnalyzer();
  
  console.log('Starting transformation analysis...');
  analyzer.analyzeAllTransformations().then(results => {
    console.log('\nAnalysis Results:');
    
    for (const result of results) {
      console.log(`\n${result.name} (${result.transformationType}):`);
      console.log(`  Difficulty: ${result.difficulty} (Recommended: ${result.recommendedDifficulty})`);
      console.log(`  Consistency: ${(result.consistency * 100).toFixed(1)}%`);
      console.log(`  Validity Rate: ${(result.validityRate * 100).toFixed(1)}%`);
      
      if (result.averageExecutionTime) {
        console.log(`  Avg. Execution Time: ${result.averageExecutionTime.toFixed(2)}ms`);
      }
      
      console.log('  Grid Size Analysis:');
      console.log(`    Size 2: ${(result.gridSizeAnalysis.size2.validityRate * 100).toFixed(1)}% valid, complexity ${result.gridSizeAnalysis.size2.complexity.toFixed(2)}`);
      console.log(`    Size 3: ${(result.gridSizeAnalysis.size3.validityRate * 100).toFixed(1)}% valid, complexity ${result.gridSizeAnalysis.size3.complexity.toFixed(2)}`);
      console.log(`    Size 4: ${(result.gridSizeAnalysis.size4.validityRate * 100).toFixed(1)}% valid, complexity ${result.gridSizeAnalysis.size4.complexity.toFixed(2)}`);
      
      if (result.issues.length > 0) {
        console.log('  Issues:');
        for (const issue of result.issues) {
          console.log(`    - ${issue}`);
        }
      }
    }
    
    console.log('\nAnalysis complete.');
  }).catch(error => {
    console.error(`Error running analysis: ${error}`);
    process.exit(1);
  });
}
