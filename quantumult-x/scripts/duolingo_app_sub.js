/**
 * Duolingo Premium - Quantumult X 脚本
 *
 * 功能: 修改 Duolingo API 响应，将免费用户伪装为订阅用户
 * 类型: script-analyze-echo-response (自己发送请求并处理响应)
 *
 * @author qinxi
 * @version 1.5.0
 */
const version = "1.5.0";
const scriptName = "Duolingo Premium";

// 环境检测
function ENV() {
    return {
        isQX: "undefined" != typeof $task,
        isLoon: "undefined" != typeof $loon,
        isSurge: "undefined" != typeof $httpClient && "undefined" == typeof $loon,
        isShadowrocket: "undefined" != typeof $Shadowrocket
    };
}

const env = ENV();

// HTTP 请求封装
function httpRequest(options) {
    return new Promise((resolve, reject) => {
        if (env.isQX) {
            console.log(`[${scriptName}] ${options.method} request to: ${options.url}, ${version}`);
            $task.fetch(options).then(
                response => resolve({
                    status: response.statusCode,
                    headers: response.headers,
                    body: response.body
                }),
                error => reject(error.error || error)
            );
        } else if (env.isLoon || env.isSurge || env.isShadowrocket) {
            const method = options.method.toLowerCase();
            const handler = (err, response, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        status: response.status || response.statusCode,
                        headers: response.headers,
                        body: body
                    });
                }
            };
            if (method === 'get') {
                $httpClient.get(options, handler);
            } else {
                $httpClient.post(options, handler);
            }
        } else {
            reject("Unsupported environment");
        }
    });
}

// 格式化 headers (处理 HTTP/2 大小写问题)
function formatHeaders(headers) {
    return Object.keys(headers).reduce((result, key) => {
        result[key.toLowerCase()] = headers[key];
        return result;
    }, {});
}

// 修改用户数据
function modifyUserData(bodyData) {
    let modified = false;

    // 1. 修改 subscriberLevel: FREE -> PREMIUM

    bodyData.subscriberLevel = "GOLD";
    bodyData.hasPlus = true;
    modified = true;


    // 2. 添加订阅配置 (如果为空)

    let futureExpiration = Date.now() + (400 * 24 * 60 * 60 * 1000);
    bodyData.subscriptionConfigs = [{
        "vendorPurchaseId": "mock_purchase_" + Date.now(),
        "isInBillingRetryPeriod": false,
        "isInGracePeriod": false,
        "pauseStart": null,
        "pauseEnd": null,
        "productId": "com.duolingo.DuolingoMobile.subscription.Gold.TwelveMonth.25Q3IncMS87D.Trial7.240",
        "receiptSource": 1,
        "expirationTimestamp": futureExpiration,
        "isFreeTrialPeriod": false,
        "itemType": "gold_subscription"
    }];


    // 3. 清空广告配置
    if (bodyData.adsConfig && bodyData.adsConfig.units &&
        Object.keys(bodyData.adsConfig.units).length > 0) {
        bodyData.adsConfig.units = {};
        modified = true;
    }

    // 4. 修改 trackingProperties
    if (bodyData.trackingProperties) {
        bodyData.trackingProperties.has_item_gold_subscription = true;
        modified = true;

        if (bodyData.trackingProperties.monetizable_status === "free_trial_eligible") {
            bodyData.trackingProperties.monetizable_status = "free_trial_owner_super";
            modified = true;
        }
    }

    // 5. 添加 premium_subscription 到 shopItems
    if (bodyData.shopItems && Array.isArray(bodyData.shopItems)) {
        let hasGold = bodyData.shopItems.some(item =>
            item.id === "gold_subscription" || item.itemName === "gold_subscription"
        );

        if (!hasGold) {
            let futureExp = Date.now() + (400 * 24 * 60 * 60 * 1000);
            let futureExpSec = Math.floor(futureExp / 1000);

            bodyData.shopItems.push({
                "purchaseId": "mock_gold_" + Date.now(),
                "purchaseDate": Math.floor(Date.now() / 1000),
                "purchasePrice": 0,
                "id": "gold_subscription",
                "itemName": "gold_subscription",
                "subscriptionInfo": {
                    "currency": "USD",
                    "expectedExpiration": futureExpSec,
                    "isFreeTrialPeriod": false,
                    "isIntroOfferPeriod": false,
                    "isInBillingRetryPeriod": false,
                    "periodLength": 12,
                    "price": 0,
                    "productId": "com.duolingo.DuolingoMobile.subscription.Gold.TwelveMonth.25Q3IncMS87D.Trial7.240",
                    "renewer": "APPLE",
                    "renewing": false,
                    "tier": "twelve_month",
                    "type": "gold",
                    "vendorPurchaseId": "mock_vendor_" + Date.now(),
                    "promotionalOfferId": "",
                    "firstPaymentDate": 0
                },
                "familyPlanInfo": {
                    "ownerId": bodyData.id || 0,
                    "secondaryMembers": [],
                    "inviteToken": "",
                    "pendingInvites": [],
                    "pendingInviteSuggestions": []
                }
            });
            modified = true;
        }
    }

    return modified;
}

// 处理响应体
function processResponseBody(body) {
    if (!body || body.length === 0) {
        return body;
    }

    try {
        let jsonData = JSON.parse(body);
        let modified = false;

        // 处理 batch 响应中的每个 response
        if (jsonData.responses && Array.isArray(jsonData.responses)) {
            for (let i = 0; i < jsonData.responses.length; i++) {
                let resp = jsonData.responses[i];

                if (resp.body && typeof resp.body === "string") {
                    try {
                        let bodyData = JSON.parse(resp.body);

                        // 检查是否是用户数据响应
                        if (bodyData.subscriberLevel !== undefined ||
                            (bodyData.id && bodyData.learningLanguage)) {

                            if (modifyUserData(bodyData)) {
                                resp.body = JSON.stringify(bodyData);
                                modified = true;
                            }
                        }
                    } catch (innerE) {
                        console.log(`[${scriptName}] Inner parse error: ${innerE.message}`);
                    }
                }
            }
        }

        if (modified) {
            return JSON.stringify(jsonData);
        }
    } catch (e) {
        console.log(`[${scriptName}] Parse error: ${e.message}`);
    }

    return body;
}

// 主逻辑
async function main() {

    // 准备请求选项
    let headers = formatHeaders($request.headers);

    // 修改 Accept-Encoding 以获取未压缩的响应
    headers['accept-encoding'] = 'identity';
    delete headers['content-length'];

    const options = {
        url: $request.url,
        method: $request.method,
        headers: headers,
        body: $request.body,
        timeout: 30000,
        insecure: true
    };

    // 跳过脚本循环
    options['X-Surge-Skip-Scripting'] = true;

    try {
        // 发送请求
        const response = await httpRequest(options);

        // 处理响应体
        const modifiedBody = processResponseBody(response.body);

        // 构建响应
        const result = {
            status: env.isQX ? `HTTP/1.1 ${response.status}` : response.status,
            headers: response.headers,
            body: modifiedBody
        };

        // 移除可能导致问题的 headers
        if (result.headers) {
            delete result.headers['content-length'];
            delete result.headers['content-encoding'];
            delete result.headers['transfer-encoding'];
        }

        // 返回响应
        if (env.isQX) {
            $done(result);
        } else {
            $done({ response: result });
        }
    } catch (error) {
        console.log(`[${scriptName}] Request error: ${error}, url: ${options.url}`);
        $done({});
    }
}

// 执行主逻辑
main();
