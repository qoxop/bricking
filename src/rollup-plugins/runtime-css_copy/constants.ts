export const Virtual_Inject_Module_Id ="\0runtime-style-inject";
export const Entry_Css_Str_Tpl = '__entry_css$file_tpl__';

export const Virtual_Inject_Module_Code = `
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

export const Entry_Css_Str_Tpl_Code = `

console.log('inject style');

(function(){
    const cssLink = "${Entry_Css_Str_Tpl}"
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

`

