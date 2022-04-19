
import * as Babel from '@babel/core';

export default (babel: typeof Babel) => {
  const { types: t } = babel;
  return {
    visitor: {
      'ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration': (path: Babel.NodePath) => {
        if ('source' in path.node && path.node.source) {
          path.node.source = t.stringLiteral(`~~${path.node.source.value}`);
        }
      },
      CallExpression(path: Babel.NodePath) {
        if (
          t.isCallExpression(path.node)
          && t.isImport(path.node.callee)
          && path.node.arguments.length === 1
          && t.isStringLiteral(path.node.arguments[0])
        ) {
          path.node.arguments[0] = t.stringLiteral(`~~${path.node.arguments[0].value}`);
        }
      },
    },
  };
};
