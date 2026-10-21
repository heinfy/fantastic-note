# CodeLens

显示在代码行上方的一小段可点击文字，例如「3 个引用」「运行测试」。

`CodeLensProvider.provideCodeLenses` 返回位置和标题。`resolveCodeLens` 可以晚一点再填命令，避免滚动时就把所有命令都算完。

它适合一行以内的提示。长说明用 Hover，修改代码用 CodeAction。

参考：https://code.visualstudio.com/api/language-extensions/programmatic-language-features
