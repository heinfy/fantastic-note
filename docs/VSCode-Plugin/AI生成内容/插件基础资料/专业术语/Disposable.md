# Disposable

表示「调用 `dispose()` 后就注销」的对象。命令注册、事件订阅、状态栏项、诊断集合、事件发射器都是。

`ExtensionContext.subscriptions` 收集这些对象，扩展停用时一起释放。漏登记的常见结果是：重载后命令重复注册报错，或旧监听继续执行。

`Disposable.from(...)` 把多个对象收成一个。

参考：https://code.visualstudio.com/api/references/vscode-api
