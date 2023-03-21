// @ts-ignore
(async () => {
  // @ts-ignore
  const React = await System.import('react');
  // @ts-ignore
  const ReactDom = await System.import('react-dom/client');
  // @ts-ignore
  const { DatePicker } = await System.import('antd');
  const App = (
    <div style={{padding: 20}}>
      <h1>日历</h1>
      <DatePicker />
    </div>
  )
  const root = ReactDom.createRoot(document.getElementById('root'));
  root.render(App);
})()
