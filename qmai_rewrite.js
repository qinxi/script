/**
 * @fileoverview Quantumult X Rewrite Script for Qmai Web API
 * Generated based on ReshaperBackup.json
 * 
 * Target URL: ^https://webapi\.qmai\.cn/web
 * 
 * Modifications:
 * 1. Card Level: level -> 5, cardName -> "黑金匠", currentValue -> "12873.56"
 * 2. Assets: pointNum -> 11
 * 3. Badges: litStatus -> 1 (Light up all badges)
 */

var body = $response.body;
var url = $request.url;
var obj = JSON.parse(body);

try {
    // Rule 1: Modify Card Level Info
    // Matches generic webapi path, check for data existence
    if (obj && obj.data && obj.data.customerCenterCardLevelInfo) {
        obj.data.customerCenterCardLevelInfo.level = 5;
        obj.data.customerCenterCardLevelInfo.cardName = "黑金匠";
        obj.data.customerCenterCardLevelInfo.currentValue = "12873.56";
    }

    // Rule 2: Modify Points
    // Path: /web/account-center/crm/query-person-asset
    if (url.indexOf("/web/account-center/crm/query-person-asset") !== -1) {
        if (obj && obj.data) {
            obj.data.pointNum = 11;
        }
    }

    // Rule 3: Modify Badges
    // Path: web/cmk-center/badge/user/list
    if (url.indexOf("web/cmk-center/badge/user/list") !== -1) {
        // The original rule used regex replacement: "litStatus"\s*:\s*0\s*, -> "litStatus":1,
        // We can try to traverse the JSON if we know the structure, but a string replace is safer 
        // if the structure is complex or unknown, matching the original rule's behavior exactly.
        // However, since we already parsed JSON, let's try to modify the object if possible.
        // If the structure is unknown, string replacement on the original body is a valid fallback,
        // but mixing JSON parse and string replace is tricky. 
        // Let's assume standard Qmai structure: data -> list of badges?
        // To be safe and strictly follow the Reshaper regex logic which applies to the text:
        // We will re-serialize the object and then run the regex, OR just run regex on original body if we didn't modify it yet.

        // Since we might have modified other things (unlikely in this path), let's use the object approach if we can find the path.
        // But Reshaper rule didn't specify a JSON path, just text replace.
        // Let's use a recursive function to set litStatus to 1 everywhere, which is cleaner in JS.

        function setLitStatus(o) {
            for (var k in o) {
                if (typeof o[k] === 'object' && o[k] !== null) {
                    setLitStatus(o[k]);
                } else if (k === 'litStatus') {
                    o[k] = 1;
                }
            }
        }
        setLitStatus(obj);
    }

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    console.log("Qmai Rewrite Error: " + e);
    $done({});
}
