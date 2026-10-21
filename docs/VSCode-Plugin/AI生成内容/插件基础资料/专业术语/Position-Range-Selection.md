# Position、Range、Selection

`Position` 是从 0 开始的行和字符，指向两个字符之间，不是指向某个字符本身。

`Range` 由起止两个位置组成，构造时会把较前的位置当作 start。

`Selection` 是带方向的 Range：`anchor` 是选区放下的那一端，`active` 是光标所在的一端。编辑器可以有多个 `selections`。

`document.offsetAt` 和 `positionAt` 用来和字符串偏移互转。

参考：https://code.visualstudio.com/api/references/vscode-api
