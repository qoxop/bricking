// import { types } from '@babel/core';
import { PREFIX } from './rollup-url';

export default function babelReplaceUrl({ types: t }) {
  return {
    name: 'babel-plugin-replace-url',
    visitor: {
      StringLiteral(path, state) {
        const { mode } = state.opts;
        if (path.node.value.startsWith(PREFIX)) {
          const relativeUrl: string = path.node.value.replace(PREFIX, (/^\.\//.test(path.node.value) ? '' : './'));
          if (mode === 'script') {
            path.replaceWith(
              t.memberExpression(
                t.newExpression(
                  t.identifier('URL'),
                  [
                    t.stringLiteral(relativeUrl),
                    t.memberExpression(
                      t.metaProperty(
                        t.identifier('import'),
                        t.identifier('meta'),
                      ),
                      t.identifier('url'),
                    ),
                  ],
                ),
                t.identifier('href'),
              ) as any,
            );
          } else {
            path.replaceWith(
              t.callExpression(
                t.identifier('require'),
                [t.stringLiteral(relativeUrl)],
              ) as any,
            );
          }
        }
      },
    },
  };
}
