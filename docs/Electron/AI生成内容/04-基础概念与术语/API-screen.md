# screen

`screen` 提供显示器信息，用于把窗口放回正确的屏幕、处理缩放和多显示器。必须在 `ready` 之后使用。

文档：[https://www.electronjs.org/docs/latest/api/screen](https://www.electronjs.org/docs/latest/api/screen)

## 常用方法

```js
const { screen } = require('electron');

const primary = screen.getPrimaryDisplay();
const all = screen.getAllDisplays();
const current = screen.getDisplayMatching(win.getBounds());
```

每台显示器上常用的字段：

| 字段 | 含义 |
|------|------|
| `bounds` | 显示器在虚拟桌面中的位置和大小 |
| `workArea` | 去掉任务栏、Dock 之后的可用区域 |
| `scaleFactor` | 设备像素比 |
| `id` | 当前这次连接中的编号，重连后可能变化 |

`screen.getCursorScreenPoint()` 返回鼠标所在的点，用来决定新窗口出现在哪块屏上。

## 事件

`display-added`、`display-removed`、`display-metrics-changed` 在插拔显示器或分辨率变化时触发。恢复窗口位置时，先看保存的矩形是否和某一台显示器的 `workArea` 相交。没有交集时，放到主显示器中央，避免窗口出现在已经拔掉的屏幕上。

尺寸使用 DIP（与设备无关的像素），不是物理像素。`scaleFactor` 为 2 时，逻辑上的 100 像素对应 200 个物理像素。

## 相关文档

- [术语-DIP](./术语-DIP.md)
- [API-BrowserWindow](./API-BrowserWindow.md)
