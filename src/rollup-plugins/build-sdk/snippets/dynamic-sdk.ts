

// @ts-ignore
const SDKJsonUrl: string = __dynamic_sdk_json__;
// @ts-ignore
const APPEntryUrl: string = __app_entry__;
System.register([SDKJsonUrl], (function (e) {
    "use strict";
    var m;
    return {
        setters: [function (e) {
            m = e.default;
        }],
        execute: function () {
            if (!m.entry) {
                throw new Error("模块入口不存在");
            }
            var cdn = SDKJsonUrl.replace(/\/\w+\.json$/, '') + '/';
            if (/^https?/.test(m.cdnPath || '')) {
                cdn = m.cdnPath;
            }
            var sdkEntry = (new URL(m.entry, cdn)).href;
            System.import(sdkEntry).then(function () {
                System.import(APPEntryUrl);
            })
        }
    }
}));