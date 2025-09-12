## Hint System

### 
Check client\src\components\officer\PermanentHintSystem.tsx it is an absolute mess of logic mixing in game hints with tooltips that belong in the UI...  the assessment start modal should be explaining the basics of the UI!  





    - This is how they should work, and the PlayFab backend already has rich integration of hints in scoring.
    - 1: Correct OutputGrid Size to match for the correct solution grid size   (we already know this!)
    - 2: Show List of 40 ARC-AGI Transformation Types with special TypesModal.tsx that will appear
    - 3: Simple language to explain the solution like "Copy Input, then rotate any symmetrical pattern 90 degrees counter-clockwise within its bounding box" (sourced from arc-explainer API, documentation exists in arc-explainer-api-investigation.md)
    
    The arc-explainer API is solid. It will require input from the designer to as to how exactly we source the data from the API for hint 3



###  The Assessment Interface sfmc\client\src\components\assessment\AssessmentInterface.tsx 

- Hints should work the same way as in the officer track

