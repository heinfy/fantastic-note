
`ReactDOM.createPortal：`将子组件渲染到存在于父组件 DOM 层次结构之外的 DOM 节点中。

```jsx
// 可渲染的 React child，例如元素、字符串或片段
// DOM 元素
ReactDOM.createPortal(child, container);
```

demo:

```jsx
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const modalRootEl = document.getElementById('modal-root');

class Modal extends Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }
  componentDidMount() {
    modalRootEl.appendChild(this.el);
  }
  componentWillUnmount() {
    modalRootEl.removeChild(this.el);
  }
  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}
class Example extends Component {
  constructor(props) {
    super(props);
    this.state = { showModal: false };
    this.handleShow = this.handleShow.bind(this);
    this.handleHide = this.handleHide.bind(this);
  }
  handleShow() {
    this.setState({ showModal: true });
  }
  handleHide() {
    this.setState({ showModal: false });
  }
  render() {
    return (
      <div className='app'>
        这个div有溢出隐藏
        <button onClick={this.handleShow}>展示</button>
        {this.state.showModal ? (
          <Modal>
            <div className='modal'>
              <div>弹窗</div>
              <button onClick={this.handleHide}>隐藏</button>
            </div>
          </Modal>
        ) : null}
      </div>
    );
  }
}

export default Example;
```

css：

```css
#modal-root {
  position: relative;
  z-index: 999;
}

.modal {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

参看： [Portals – React](https://legacy.reactjs.org/docs/portals.html)
