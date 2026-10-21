# 打印功能与导出 PDF 怎么做？有什么坑？

## 考察点

- webContents.print / printToPDF 的实战
- 打印样式与静默打印

## 参考答案

### 1. 打印的两种方式

**（1）调起系统打印对话框**

```js
// 渲染进程桥接调用，主进程执行
win.webContents.print(
  {
    silent: false,        // false: 弹系统打印对话框
    printBackground: true, // 打印背景色/背景图（默认 false！常见坑）
    color: true,
    margins: { marginType: 'default' },
    pageSize: 'A4',
    landscape: false,
    copies: 1,
  },
  (success, failureReason) => {
    if (!success) logger.warn('打印失败:', failureReason);
  }
);
```

**（2）静默打印（不弹对话框，直接打）**

```js
win.webContents.print({
  silent: true,
  deviceName: 'HP LaserJet', // 指定打印机（名称要先枚举）
  printBackground: true,
});

// 枚举可用打印机
const printers = await win.webContents.getPrintersAsync();
```

静默打印是 agent/行业软件高频需求（小票、标签、单据），注意 `deviceName` 必须精确匹配系统打印机名。

### 2. 导出 PDF

```js
// 主进程
const data = await win.webContents.printToPDF({
  printBackground: true,
  pageSize: 'A4',
  landscape: false,
  margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }, // 英寸
  preferCSSPageSize: true, // 尊重 CSS @page 尺寸
});

await fs.writeFile(savePath, data); // data 是 Buffer
```

实践技巧：导出内容通常不是当前页面，而是**隐藏窗口加载专门的打印模板**：

```js
async function exportPDF(reportData) {
  // 创建离屏窗口，加载打印专用页面
  const printWin = new BrowserWindow({ show: false });
  await printWin.loadURL('myapp://app/print-template.html');
  
  // 注入数据，等渲染完成
  await printWin.webContents.executeJavaScript(
    `window.renderReport(${JSON.stringify(reportData)})`
  );
  
  const pdf = await printWin.webContents.printToPDF({ printBackground: true });
  printWin.destroy(); // 用完即毁
  return pdf;
}
```

好处：打印模板与业务页面解耦，样式可控，不打扰用户。

### 3. 打印样式（CSS 层）

```css
/* 打印专用样式 */
@media print {
  .no-print { display: none; }        /* 按钮/导航不打印 */
  .page-break { page-break-before: always; } /* 强制分页 */
  
  /* 避免内容被截断在页边 */
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; }
}

/* 精确控制页面尺寸 */
@page {
  size: A4 portrait;
  margin: 10mm;
}
```

常见坑：
- **背景色丢失**：Chromium 打印默认不输出背景，`printBackground: true` + CSS `-webkit-print-color-adjust: exact`
- **分页截断**：表格行被劈两半 → `page-break-inside: avoid`
- **页眉页脚**：printToPDF 支持 `headerTemplate`/`footerTemplate`（页码、标题），但样式能力弱
- **屏幕像素 vs 打印尺寸**：打印是物理单位（mm/in），用 pt/mm 写打印样式比 px 可靠

### 4. 特殊场景：小票/标签打印机

- ESC/POS 指令打印机：不用 print API，主进程直接通过 USB/串口/网络发送指令（node 的 escpos 库）
- 标签打印机（斑马等）：同样走指令或厂商 SDK
- 这类场景 Electron 只负责业务流，打印走原生通道

### 5. 坑位清单

1. print 回调的 failureReason 要记录（用户取消不算失败）
2. 大量打印任务要队列化，避免并发 print 互相干扰
3. printToPDF 大页面内存占用高，长报表分页生成再合并
4. macOS 打印对话框偶尔与窗口层级冲突（对话框在窗口后），必要时先 blur 窗口
5. 中文字体：目标机器缺字体会回退，PDF 导出建议内嵌 Web 字体保证一致性

### 6. 面试话术

> 打印分交互打印（print silent:false）和静默打印（silent:true + deviceName，枚举打印机拿名称）。PDF 导出的最佳实践是隐藏窗口加载专用打印模板、注入数据后 printToPDF——与业务页面解耦。CSS 层三大坑：背景色要 printBackground + color-adjust、分页用 page-break-inside:avoid、打印样式用物理单位。小票/标签类打印机走 ESC/POS 指令通道而不是 print API。

## 常见追问

- **打印预览怎么做？** Electron 无内置预览 UI，自己做：printToPDF 生成后用 pdf.js 在窗口内预览，确认后静默打印。
- **打印失败怎么兜底？** 回调记录 failureReason；重要单据场景提供"重打"和"导出 PDF 备用"两个出口。
