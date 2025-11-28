/**
 * @fileoverview Quantumult X Rewrite Script for Qmai Web API
 * Generated based on ReshaperBackup.json
 * 
 * Target URL: ^https://webapi\.qmai\.cn/web
 * 
 * Modifications:
 * 1. data.customerCenterCardLevelInfo.level -> 5
 * 2. data.customerCenterCardLevelInfo.cardName -> "黑金匠"
 */

var body = $response.body;
var url = $request.url;

try {
    var obj = JSON.parse(body);

    if (obj && obj.data && obj.data.customerCenterCardLevelInfo) {
        // Modify level to 5
        obj.data.customerCenterCardLevelInfo.level = 5;
        
        // Modify cardName to "黑金匠"
        obj.data.customerCenterCardLevelInfo.cardName = "黑金匠";
        
        $done({body: JSON.stringify(obj)});
    } else {
        // If the path doesn't exist, return original body
        $done({});
    }
} catch (e) {
    // If JSON parse fails, return original body
    console.log("Qmai Rewrite Error: " + e);
    $done({});
}
