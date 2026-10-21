# TreeDataProvider（树数据提供器）

侧栏树的数据来源。VS Code 在需要时调用：

- `getChildren(element?)`：根或某个节点的子节点
- `getTreeItem(element)`：把节点画成 `TreeItem`

可选 `getParent`，否则 `TreeView.reveal` 无法定位到深层节点。数据变化时触发 `onDidChangeTreeData`。不传参数表示刷新整棵树，传入元素表示只刷新那一枝。

`getChildren` 里不要做长时间同步 IO。视图 ID 必须和 `contributes.views` 里的 `id` 一致。

参考：https://code.visualstudio.com/api/extension-guides/tree-view
