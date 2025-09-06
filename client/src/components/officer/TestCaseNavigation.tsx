/**
 * Test Case Navigation Component
 * Author: Cascade
 * 
 * PURPOSE:
 * Handles puzzles with multiple test cases (2+ tests)
 * Allows switching between test cases and tracks completion status
 * 
 * HOW IT WORKS:
 * - Shows test case tabs/buttons (1 of N)
 * - Displays completion status per test
 * - Allows navigation between tests
 * - Shows overall puzzle progress
 * 
 * HOW THE PROJECT USES IT:
 * - Used in ResponsivePuzzleSolver for multi-test puzzle support
 * - Critical for ARC puzzles with multiple test cases
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';

interface TestCaseNavigationProps {
  /** Total number of test cases */
  totalTests: number;
  /** Currently active test index (0-based) */
  currentTestIndex: number;
  /** Array indicating which tests are completed */
  completedTests: boolean[];
  /** Callback when test case is selected */
  onTestSelect: (testIndex: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export function TestCaseNavigation({
  totalTests,
  currentTestIndex,
  completedTests,
  onTestSelect,
  className = ''
}: TestCaseNavigationProps) {
  
  if (totalTests <= 1) {
    return null; // Don't show navigation for single test puzzles
  }

  const completedCount = completedTests.filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / totalTests) * 100);

  return (
    <div className={`bg-slate-700 rounded-lg p-4 border border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-amber-300 text-sm font-semibold flex items-center">
          🎯 TEST CASES
        </h3>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${completedCount === totalTests ? 'text-green-400 border-green-600' : 'text-slate-300 border-slate-500'}`}
          >
            {completedCount}/{totalTests} Complete
          </Badge>
          {completedCount === totalTests && (
            <Badge className="bg-green-600 text-white">
              ✅ ALL SOLVED!
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Test Case Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {Array.from({ length: totalTests }, (_, index) => {
          const isActive = index === currentTestIndex;
          const isCompleted = completedTests[index];
          
          return (
            <Button
              key={index}
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={`
                relative h-10 flex items-center justify-center gap-2
                ${isActive 
                  ? 'bg-amber-600 text-slate-900 border-amber-600' 
                  : isCompleted
                    ? 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white'
                    : 'border-slate-600 text-slate-300 hover:border-amber-600 hover:text-amber-400'
                }
              `}
              onClick={() => onTestSelect(index)}
            >
              {isCompleted ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              <span className="text-xs font-semibold">
                Test {index + 1}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Current Test Info */}
      <div className="mt-4 text-xs text-slate-400 text-center">
        Currently solving: <span className="text-amber-400 font-semibold">Test Case {currentTestIndex + 1}</span>
        {completedTests[currentTestIndex] && (
          <span className="text-green-400 ml-2">✓ Completed</span>
        )}
      </div>
    </div>
  );
}
