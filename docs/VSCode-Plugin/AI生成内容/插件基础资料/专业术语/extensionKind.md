# extensionKind

清单字段，声明扩展更想跑在工作区一侧还是界面一侧。值是数组：`workspace`、`ui`，或两者按优先级排列。

`workspace` 表示要读工作区文件，远程开发时跟远程机器走。`ui` 表示必须靠近界面，例如要本机设备或很低延迟。纯网页扩展不要设置它，它会一直待在 web 宿主。

1.40 以前的单个字符串写法已废弃。

参考：https://code.visualstudio.com/api/advanced-topics/extension-host
