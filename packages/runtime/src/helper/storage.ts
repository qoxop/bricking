/**
 * 用于替代原生的 Storage，增加隔离功能和自动解析功能
 */
declare const process: {
    env: any,
    [k: string]: any
}

const createStorage = (store: Storage) => {
    const withPrefix = (key:string) => `$bk-${process.env.MODULE_NAME}-${key}`;
    if (withPrefix('') === '$bk--') {
        throw new Error(" process.env.MODULE_NAME empty ~");
    }
    return {
        getItem(key: string):string|null {
            return store.getItem(withPrefix(key));
        },
        setItem(key: string, value: string) {
            return store.setItem(withPrefix(key), value);
        },
        getObj<T extends Object>(key: string):T|null {
            const jsonString = store.getItem(withPrefix(key));
            if (jsonString) {
                try {
                    return JSON.parse(jsonString) as T;
                } catch (error) {
                    store.removeItem(withPrefix(key))
                    console.warn(error);
                    return null;
                }
            }
            return null
        },
        setObj<T extends Object>(key: string, value: T) {
            return store.setItem(withPrefix(key), JSON.stringify(value));
        },
        removeItem(key: string) {
            return store.removeItem(withPrefix(key));
        },
        clear() {
            Object.keys(store).forEach(itemKey => {
                if (itemKey.indexOf(`$bk-${process.env.MODULE_NAME}-`) === 0) {
                    store.removeItem(itemKey);
                }
            })
        }
    }
}

const LocalStore = createStorage(window.localStorage);
const SessionStore = createStorage(window.sessionStorage);

export {
    LocalStore,
    SessionStore,
}