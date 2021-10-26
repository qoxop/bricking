/**
 * 创建模版
 */
import path from 'path';
import { bufferString, fileTransfer } from './utils/fs-tools';

const templatesDir = path.join(__dirname, '../templates');

const DefaultTemplate = {
    name: 'my-app-name',
    path: path.join(templatesDir, './default'),
    getTransform: (name: string) => bufferString((_: string, code: string) => code.replace('my-app-name', name))
}

const templates: {[key: string]: typeof DefaultTemplate } = {
    default: DefaultTemplate,
    remote: {
        ...DefaultTemplate,
        path: path.join(templatesDir, './remote')
    }
}

export const create = async (tplName = 'default', name = 'my-app') => {
    const template = templates[tplName];
    if (template) {
        fileTransfer(
            template.path,
            path.join(process.cwd(), `./${name}`),
            template.getTransform(name)
        )
    } else {
        throw new Error(`${tplName} 模版不存在～`);
    }
}