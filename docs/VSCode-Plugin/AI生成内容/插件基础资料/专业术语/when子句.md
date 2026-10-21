# when 子句（when clause）

一段用上下文键写成的条件字符串，决定菜单项、快捷键、视图是否启用或显示。

示例：`editorTextFocus && !editorReadonly`、`editorLangId == typescript`、`resourceFilename =~ /docker/`。

运算符包括 `!`、`&&`、`||`、`==`、`!=`、比较、`=~`、`in`。比较运算符两边必须有空格。`==` 右侧是字面量，不是另一个键。

参考：https://code.visualstudio.com/api/references/when-clause-contexts
