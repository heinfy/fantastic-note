# Hover（悬停）

鼠标停在某个位置时弹出的说明。`HoverProvider.provideHover` 接收文档、位置和取消令牌，返回 `Hover` 或 `undefined`。

`Hover` 的内容是 `MarkdownString` 或字符串，可带一个范围，用来标出这段说明覆盖哪些字符。没有内容就返回 `undefined` 或 `null`。

多家悬停可以同时存在，编辑器会把它们放在一起。这和补全不同，补全会按匹配分数分批询问。

参考：https://code.visualstudio.com/api/language-extensions/programmatic-language-features
