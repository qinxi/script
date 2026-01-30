// duolingo_unlimited_hearts_max_qx.js
// Duolingo Unlimited Hearts + Max
// Quantumult X script-response-body
// Match: /YYYY-MM-DD/users/
// author: https://github.com/eztakesin/duolingo-mitm-lab/blob/main/duolingo_unlimited_hearts_max.js

'use strict';

let body = $response && $response.body;
if (!body) {
    $done({});
}

let data;
try {
    data = JSON.parse(body);
} catch (e) {
    $done({});
}

// Custom Max / Gold subscription
const CUSTOM_SHOP_ITEMS = {
    gold_subscription: {
        itemName: "gold_subscription",
        subscriptionInfo: {
            vendor: "STRIPE",
            renewing: true,
            isFamilyPlan: true,
            expectedExpiration: 9999999999000
        }
    }
};

if (data && typeof data === 'object') {

    // Unlimited Hearts
    if (!data.health || typeof data.health !== 'object') {
        data.health = {};
    }
    data.health.unlimitedHeartsAvailable = true;

    // Plus / Max
    data.hasPlus = true;
    data.subscriberLevel = "GOLD"

    if (!data.trackingProperties || typeof data.trackingProperties !== 'object') {
        data.trackingProperties = {};
    }
    data.trackingProperties.has_item_gold_subscription = true;

    // Merge shopItems
    if (!data.shopItems || typeof data.shopItems !== 'object') {
        data.shopItems = {};
    }
    data.shopItems = Object.assign({}, data.shopItems, CUSTOM_SHOP_ITEMS);
}

$done({ body: JSON.stringify(data) });
