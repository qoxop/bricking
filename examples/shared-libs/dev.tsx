
/**
 * 开发模式下的启动代码
 * 只能使用 Systemjs 来加载模块
 */
(async () => {
  const React = await System.import('react');
  const ReactDom = await System.import('react-dom');
  const { DatePicker } = await System.import('antd');
  const App = (
    <div style={{padding: 20}}>
      <h1>日历</h1>
      <DatePicker />
    </div>
  )
  ReactDom.render(App, document.getElementById('root'));
})()