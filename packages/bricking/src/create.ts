import * as os from 'os';
import * as path from 'path';
import inquirer from 'inquirer';
import { spawnSync } from 'child_process';
import { colors, fsExtra, btkFile, btkNetwork } from '@bricking/toolkit';

type Template = {
  name: string;
  git: string;
  source: string;
  branch: string;
}
type Options = {
  type?: string;
  name?: string;
  template?: string;
  cwd?: string
}

const _templates: Record<string, Template[]> = {
  base: [
    {
      name: 'react-base',
      git: 'git@github.com:qoxop/bricking-templates.git',
      branch: 'release',
      source: 'bricking-templates/packages/base/react',
    },
  ],
  module: [
    {
      name: 'react-micro',
      git: 'git@github.com:qoxop/bricking-templates.git',
      source: 'bricking-templates/packages/module/react-micro',
      branch: 'release',
    },
  ],
};

const randomStr = () => Math.ceil(Math.random() * 10000).toString(32);

export async function create({ type, name, template, cwd = './' }: Options) {
  let templates: Record<string, Template[]> = _templates;
  try {
    templates = await btkNetwork.getJson(process.env.BRICKING_TPL || 'https://vercel.bricking.dev/templates.json');
  } catch (error) {
    console.error(error);
  }
  const answers = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      message: '请选择项目类型',
      choices: [
        { name: '基座项目', value: 'base' },
        { name: '微模块项目', value: 'module' },
      ],
      when() {
        if (!type || !templates[type]) {
          type = '';
          return true;
        }
        return false;
      },
    },
    {
      name: 'template',
      type: 'list',
      message: '请选择一个模版',
      when(answer) {
        const _type = type || answer.type;
        // template 为空 或者 template 不存在现有模板中
        if (!template || templates[_type].every((item) => item.name !== template)) {
          template = '';
          return true;
        }
        return false;
      },
      choices: (answer) => (templates[type || answer.type].map((item) => ({
        name: item.name,
        value: item.name,
      }))),
    },
    {
      name: 'name',
      type: 'input',
      message: '输入项目名称',
      default: (answer: any) => answer.template,
      when() {
        if (!name || fsExtra.existsSync(path.join(process.cwd(), cwd, name))) {
          name = '';
          return true;
        }
        return false;
      },
      validate: (input) => {
        if (fsExtra.existsSync(path.join(process.cwd(), cwd, input))) {
          return `⚠️ 当前目录存在同名项目 ${path.join(cwd, input)} !!!`;
        }
        return true;
      },
    },
  ]);
  type = type || answers.type as string;
  template = template || answers.template;
  // 模版对象
  const tpl = templates[type].find((item) => item.name === template) as Template;
  // 项目名称
  const projectName = name || answers.name as string;
  // 项目路径
  const projectPath = path.join(process.cwd(), cwd, projectName);
  // 临时路径
  const tmpDirPath = path.resolve(os.tmpdir(), randomStr());
  // 打印命令
  console.log(colors.green(`\n> git clone ${tpl.git}\n`));
  // 创建临时路径
  fsExtra.mkdir(tmpDirPath, { recursive: true });

  console.log(colors.yellow('正在同步文件...'));
  // 执行 clone 脚本
  spawnSync('git', ['clone', '-b', tpl.branch, tpl.git], { stdio: 'inherit', cwd: tmpDirPath });
  // 文件夹移动
  await fsExtra.move(
    path.join(tmpDirPath, tpl.source),
    projectPath,
  );
  // 删除临时目录
  await fsExtra.remove(tmpDirPath);
  // 修改项目名称
  btkFile.updateJson(
    path.join(projectPath, 'package.json'),
    (json) => {
      json.name = projectName;
    },
  );
  console.log(colors.green('同步完成 ✅ \n'));
  console.log(colors.grey(`> cd ${path.join(cwd, projectName)}`));
  console.log(colors.grey('> yarn && yarn dev\n'));
}
