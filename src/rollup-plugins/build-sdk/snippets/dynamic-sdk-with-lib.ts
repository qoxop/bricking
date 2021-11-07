// @ts-ignore
fetch(__dynamic_sdk_json__).then(async res => {
    const config = await res.json();
    const [sdkScript, appScript] = [document.createElement('script'), document.createElement('script')];
    sdkScript.src = new URL(config.entry, config.cdnPath).href;
    document.body.append(sdkScript);
    // @ts-ignore
    appScript.src = __app_entry__;
    appScript.type = "systemjs-module";
    document.body.append(appScript);
});