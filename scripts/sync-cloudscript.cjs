const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

const CLOUDSCRIPT_FILE_PATH = path.resolve(process.cwd(), 'cloudscript.js');

async function makePlayFabRequest(endpoint, payload) {
    const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-SecretKey': PLAYFAB_SECRET_KEY,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PlayFab API error (${response.status}): ${errorData.errorMessage}`);
    }

    const responseData = await response.json();
    if (responseData.code !== 200) {
        throw new Error(`PlayFab API error: ${responseData.errorMessage}`);
    }

    return responseData.data;
}

async function getLatestCloudScript() {
    try {
        console.log('Fetching latest CloudScript from PlayFab...');
        const data = await makePlayFabRequest('/Admin/GetCloudScriptRevision', {
            Version: 1, // Specify a version to get the latest
        });
        return data.Files[0].FileContents;
    } catch (error) {
        // If no script is uploaded yet, API returns an error
        if (error.message.includes('CloudScriptNotUploaded')) {
            console.log('No CloudScript found on PlayFab. A new version will be uploaded.');
            return null;
        }
        throw error;
    }
}

async function uploadCloudScript(fileContent) {
    console.log('Uploading new CloudScript version to PlayFab...');
    await makePlayFabRequest('/Admin/UpdateCloudScript', {
        Files: [
            {
                FileName: 'cloudscript.js',
                FileContents: fileContent,
            },
        ],
        Publish: true,
    });
    console.log('CloudScript uploaded and published successfully.');
}

async function syncCloudScript() {
    if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
        console.error('Error: PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY must be set in your .env file.');
        process.exit(1);
    }

    try {
        const localScript = fs.readFileSync(CLOUDSCRIPT_FILE_PATH, 'utf-8');
        const remoteScript = await getLatestCloudScript();

        if (remoteScript && localScript.trim() === remoteScript.trim()) {
            console.log('✅ CloudScript is already up to date.');
        } else {
            console.log('CloudScript is outdated. Uploading new version...');
            await uploadCloudScript(localScript);
        }
    } catch (error) {
        console.error('Failed to sync CloudScript:', error.message);
        process.exit(1);
    }
}

syncCloudScript();
