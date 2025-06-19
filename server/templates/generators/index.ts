/**
 * Grid generation classes for SFMC puzzles
 * 
 * This directory contains the grid generator base interface and specialized
 * implementations for each transformation type.
 * 
 * @author Cascade
 */

// Export base generator definitions and registry
export { 
  GridGenerator, 
  getGridGenerator, 
  registerGridGenerator, 
  GRID_GENERATORS 
} from './base-generator';

// Import all generators
import { HorizontalReflectionGenerator } from './horizontal-reflection-generator';
import { Rotation90DegGenerator } from './rotation90-deg-generator';
import { PatternCompletionGenerator } from './pattern-completion-generator';
import { XorOperationGenerator } from './xor-operation-generator';
import { ObjectCountingGenerator } from './object-counting-generator';

// Export generator implementations
export {
  HorizontalReflectionGenerator,
  Rotation90DegGenerator,
  PatternCompletionGenerator,
  XorOperationGenerator,
  ObjectCountingGenerator
};

// Register all generators with the registry
import { registerGridGenerator } from './base-generator';

registerGridGenerator('HorizontalReflectionGenerator', HorizontalReflectionGenerator);
registerGridGenerator('Rotation90DegGenerator', Rotation90DegGenerator);
registerGridGenerator('PatternCompletionGenerator', PatternCompletionGenerator);
registerGridGenerator('XorOperationGenerator', XorOperationGenerator);
registerGridGenerator('ObjectCountingGenerator', ObjectCountingGenerator);

