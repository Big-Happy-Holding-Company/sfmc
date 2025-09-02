# PlayFab Task Migration Scripts

## One-Time Setup

### 1. Get PlayFab Developer Secret Key
1. Go to [PlayFab Game Manager](https://developer.playfab.com/)
2. Navigate to: Settings > API Features > Secret Keys
3. Copy your Developer Secret Key

### 2. Set Environment Variable
```bash
# Windows (PowerShell)
$env:PLAYFAB_SECRET_KEY="your-secret-key-here"

# Windows (Command Prompt) 
set PLAYFAB_SECRET_KEY=your-secret-key-here

# Mac/Linux
export PLAYFAB_SECRET_KEY="your-secret-key-here"
```

## Migration Process

### Step 1: Upload Tasks to PlayFab
```bash
node scripts/sync-tasks-to-playfab.cjs
```
This reads all JSON files from `data/tasks/` and uploads them to PlayFab Title Data.

### Step 2: Test Data Retrieval  
```bash
node scripts/test-playfab-tasks.cjs
```
This verifies that tasks can be retrieved from PlayFab correctly.

## What These Scripts Do

**sync-tasks-to-playfab.cjs**:
- Reads all .json files from `data/tasks/` directory
- Consolidates them into a single array
- Uploads to PlayFab Title Data key "AllTasks"
- Uses PlayFab Admin API (requires secret key)

**test-playfab-tasks.cjs**:
- Logs in with anonymous user  
- Retrieves tasks using PlayFab Client API
- Validates task structure and count
- Confirms everything works for client apps

## After Migration

Once scripts complete successfully:
1. Unity can replace server API with PlayFab `GetTitleData("AllTasks")`
2. React can use same PlayFab `GetTitleData("AllTasks")` call
3. Both platforms get identical task data
4. No more server dependency