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
import { VerticalReflectionGenerator } from './vertical-reflection-generator';
import { Rotation270DegGenerator } from './rotation270-deg-generator';
import { PrimaryDiagonalReflectionGenerator } from './primary-diagonal-reflection-generator';
import { SecondaryDiagonalReflectionGenerator } from './secondary-diagonal-reflection-generator';

// Export generator implementations
export {
  HorizontalReflectionGenerator,
  Rotation90DegGenerator,
  PatternCompletionGenerator,
  VerticalReflectionGenerator,
  Rotation270DegGenerator,
  PrimaryDiagonalReflectionGenerator,
  SecondaryDiagonalReflectionGenerator
};

// Register all generators with the registry
import { registerGridGenerator } from './base-generator';

registerGridGenerator('HorizontalReflectionGenerator', HorizontalReflectionGenerator);
registerGridGenerator('Rotation90DegGenerator', Rotation90DegGenerator);
registerGridGenerator('PatternCompletionGenerator', PatternCompletionGenerator);
registerGridGenerator('VerticalReflectionGenerator', VerticalReflectionGenerator);
registerGridGenerator('Rotation270DegGenerator', Rotation270DegGenerator);
registerGridGenerator('PrimaryDiagonalReflectionGenerator', PrimaryDiagonalReflectionGenerator);
registerGridGenerator('SecondaryDiagonalReflectionGenerator', SecondaryDiagonalReflectionGenerator);

