/**
 * Incorrect Puzzle Warning
 * ========================
 * Displays a warning message when the loaded puzzle does not match the
 * puzzle intended for the current tutorial step.
 */

import { Card, CardContent } from '@/components/ui/card';

interface IncorrectPuzzleWarningProps {
  puzzleId: string;
  expectedPuzzleId: string;
}

export function IncorrectPuzzleWarning({
  puzzleId,
  expectedPuzzleId,
}: IncorrectPuzzleWarningProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
      <Card className="bg-yellow-900 border-yellow-600">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-400 text-xl">⚠️</div>
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1">Different Puzzle Detected</h4>
              <p className="text-yellow-100 text-sm">
                <strong>DESIGNER INPUT:</strong> This puzzle ({puzzleId}) doesn't match the tutorial step puzzle ({expectedPuzzleId}).
                You can still practice here, but return to the tutorial to continue with the intended training sequence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
