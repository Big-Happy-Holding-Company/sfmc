---
trigger: always_on
---

Adhere to DRY and SRP. 

The token '&&' is not a valid statement separator in this version! NEVER USE &&
We are on Windows.  Use Windows syntax.
You need to use ; instead!!!
Example: command1; command2 NEVER command1 && command2
Windows batch files use & (single ampersand) for command chaining, not &&
&& is for conditional execution (run second command only if first succeeds)
You must refer to spaceEmojis.ts as the source of TRUTH for all emoji sets. schema.ts is the source of truth for the project.
Emoji sets map exactly to the 0-9 format dictated in the .JSON 
0 is represented by ⬛ which is a valid input.  It is not EMPTY or null.  It behaves just as the other numbers mapped to emojis.

YOU DO NOT NEED TO WRITE COMMENTS IN .JSON FILES!!!