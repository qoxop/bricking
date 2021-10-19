"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entry_Css_Str_Tpl_Code = exports.Virtual_Inject_Module_Code = exports.Entry_Css_Str_Tpl = exports.Virtual_Inject_Module_Id = void 0;
exports.Virtual_Inject_Module_Id = "\0runtime-style-inject";
exports.Entry_Css_Str_Tpl = '__entry_css$file_tpl__';
exports.Virtual_Inject_Module_Code = `
const handledIds = {};
const injectFnMap  = {
    link({relativeUrl}) {
        const linkUrl = new URL(relativeUrl, import.meta.url).href;
        const link = document.createElement('link');
        link.href = linkUrl;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    },
    inline({cssVariableName}) {
        const style = document.createElement('style');
        style.innerText = cssVariableName;
        document.head.appendChild(style);
    }
};
export default function({ cssVariableName, relativeUrl, id, type }) {
    if(!handledIds[id]) {
        if (injectFnMap[type]) {
            injectFnMap[type]({cssVariableName, relativeUrl});
            handledIds[id] = true;
        }
    }
}
`;
exports.Entry_Css_Str_Tpl_Code = `

console.log('inject style');

(function(){
    const cssLink = "${exports.Entry_Css_Str_Tpl}"
    function inject() {
        const cssUrl = new URL(cssLink, import.meta.url).href;
        const link = document.createElement('link');
        link.href = cssUrl;
        link.rel = "stylesheet";
        link.type ="text/css";
        document.head.appendChild(link);
    }
    if (/.css$/.test(cssLink)) {
        if (document.head) {
            inject();
        } else {
            setTimeout(inject, 10);
        }
    }
})();

`;
