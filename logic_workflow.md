# FSEAS 文件夹关系与逻辑工作流

整个项目可以看成三个部分：**前端负责交互与显示，后端负责业务处理，数据库负责保存数据。**文件夹就是按这些工作进一步拆分的。

## 一、整体结构和文件夹之间的关系

```text
familySafety_fseas/
├── client/          前端：在浏览器中运行
│   ├── public/      直接提供给浏览器的静态文件
│   └── src/
│       ├── pages/        完整页面
│       ├── components/   页面中的界面组件
│       ├── hooks/        定位、实时连接、推送等逻辑
│       ├── store/        多个组件共享的状态
│       ├── api/          统一发送 HTTP 请求
│       └── utils/        通用工具函数
│
└── server/          后端：在服务器中运行
    └── src/
        ├── routes/       定义接口及处理顺序
        ├── middleware/   认证、权限和参数检查
        ├── controllers/  组织一次 HTTP 业务操作
        ├── services/     安全区域判断、推送等业务能力
        ├── models/       定义数据结构并操作数据库
        ├── sockets/      处理实时连接和事件
        ├── jobs/         后台定时任务
        ├── config/       数据库和 Firebase 初始化
        └── utils/        通用响应、错误处理工具
```

### 1. 前端：页面、逻辑和状态如何配合？

前端由 `client/src/main.jsx` 启动，`client/src/App.jsx` 根据浏览器地址选择要显示的页面。

```text
App.jsx：根据 URL 选择页面
    ↓
pages/：组织完整页面
    ├── components/：组成页面的界面块
    ├── hooks/：接入定位、Socket、推送
    ├── store/：读取和更新共享状态
    └── api/：向后端发送 HTTP 请求
```

| 文件夹 | 负责什么 | 与其他文件夹的联系 |
|---|---|---|
| `pages/` | 组织一个完整页面及其数据加载 | 组合 components，调用 hooks、api，读取 store |
| `components/` | 地图、表单、按钮、弹窗等具体界面 | 接收页面传来的数据，也可以读取 store、调用 api |
| `hooks/` | 封装持续运行或可复用的逻辑 | 接收外部事件，并更新 store |
| `store/` | 保存当前用户、群组、位置等共享状态 | 状态改变后，读取它的页面和组件重新渲染 |
| `api/` | 统一配置后端地址、Token 和请求重试 | 供 pages 和 components 调用 |
| `utils/` | 日期格式化、距离计算等工具 | 被需要这些功能的模块调用 |
| `public/` | 提供静态文件 | 其中的 Service Worker 接收后台推送 |

**`pages` 与 `components` 的区别是组织范围。**例如 `Dashboard.jsx` 是整个地图页面，它组合成员列表、地图、SOS 按钮和告警弹窗。

**`store` 与 `hooks` 的区别是“保存数据”和“运行逻辑”。**例如 `useSocket` 负责接收新位置，`groupStore` 负责保存新位置，地图组件负责展示新位置。

### 2. 后端：请求如何变成业务结果？

后端由 `server/server.js` 启动。它连接数据库、初始化 Firebase、启动定时任务，并挂载 Express 和 Socket.IO。

HTTP 请求的主要处理关系是：

```text
浏览器发出请求
    ↓
app.js：将请求交给对应路由模块
    ↓
routes/：匹配 HTTP 方法和路径，安排处理顺序
    ↓
middleware/：检查身份、权限和输入
    ↓
controllers/：组织业务操作
    ├── 调用 services/ 执行业务能力
    └── 调用 models/ 读取或写入数据库
    ↓
返回 JSON 给前端
```

| 文件夹 | 负责什么 | 与其他文件夹的联系 |
|---|---|---|
| `routes/` | 定义“什么接口交给谁处理” | 把 middleware 和 controller 串起来 |
| `middleware/` | 检查请求是否符合条件 | 通过后继续，并可向请求附加用户、群组信息 |
| `controllers/` | 决定一次请求需要完成哪些步骤 | 调用 models、services，也可以广播 Socket 事件 |
| `services/` | 完成独立的业务能力 | 被 controller 或 socket handler 调用 |
| `models/` | 定义数据字段、规则，执行数据库操作 | 供 controllers、services、sockets、jobs 使用 |
| `sockets/` | 接收实时事件并向在线用户广播 | 调用 models 保存数据，调用 services 处理业务 |
| `jobs/` | 定时执行后台工作 | 调用 models 清理过期位置 |
| `config/` | 初始化外部服务连接 | 为数据库操作和 Firebase 推送提供基础 |
| `utils/` | 提供公共响应和异常工具 | 被控制器、中间件等复用 |

这里的箭头表示处理关系。具体执行顺序由代码注册决定，例如公共中间件可能在进入路由前就执行；控制器也可以直接调用 Model，不必每次经过 Service。

### 3. 前后端如何连起来？

有两条主要通道：

```text
HTTP：发送操作、查询数据
前端 pages / components
    → api/
    → 后端 routes → middleware → controllers
    → models / services
    → 返回结果 → 更新前端状态 → 显示界面

Socket.IO：接收和广播实时变化
前端 hooks/
    ↔ 后端 sockets/
    → models / services
    → 广播事件
    → 前端 hooks → store → 页面和组件更新
```

数据库保存持久化数据；前端 Store 保存浏览器当前使用的数据。两者通过 HTTP 响应和 Socket 事件保持联系。

## 二、经典例子：A 发出 SOS，B 收到并解除告警

这个例子同时涉及界面、HTTP、后端业务、数据库、实时通信和状态更新。

假设 A、B 属于同一个群组，且都打开了 Dashboard。

### 第一步：页面组织界面和实时连接

以下前端路径均相对于 `client/src/`：

```text
pages/Dashboard.jsx
    ├── components/SOS/SOSButton.jsx
    ├── components/SOS/SOSModal.jsx
    └── hooks/useSocket.js
```

Dashboard 显示 SOS 按钮，并挂载告警弹窗组件，通过 `useSocket` 建立实时连接。没有活动告警时，弹窗不显示内容。

### 第二步：A 点击 SOS，前端发出请求

```text
components/SOS/SOSButton.jsx
    ↓ 用户确认，浏览器获取当前位置
api/axios.js
    ↓ 携带 Access Token
POST /api/sos/trigger
```

- `components` 负责按钮交互和获取求助坐标。
- `api` 负责把请求发送到后端，并统一携带身份信息。

### 第三步：后端检查身份并处理业务

以下后端路径均相对于 `server/src/`：

```text
app.js
    ↓ 将 /api/sos 请求交给 SOS 路由
routes/sos.routes.js
    ↓ 先执行该路由模块注册的身份验证
middleware/auth.middleware.js
    ↓ 验证 JWT，把当前用户放入 req.user
routes/sos.routes.js
    ↓ 匹配 POST /trigger 并交给控制器
controllers/sos.controller.js
    ↓ 执行 triggerSOS
```

这里每一层回答一个问题：

- **Route：**这个接口由哪个函数处理？
- **Middleware：**请求者是谁，是否允许继续？
- **Controller：**这次求助需要完成哪些业务步骤？

### 第四步：控制器协调保存、推送和广播

```text
controllers/sos.controller.js
    ├── models/SOSAlert.model.js
    │   └── 保存求助者、群组、坐标和 active 状态
    │
    ├── models/User.model.js
    │   └── 查询同群组其他成员
    │
    ├── services/fcm.service.js
    │   └── 使用 config/firebase.js 初始化的 Firebase Admin 发送推送
    │
    ├── models/Notification.model.js
    │   └── 为其他成员保存通知记录
    │
    └── Socket.IO
        └── 向群组广播 sos:triggered
```

Controller 在这里是协调者：Model 负责数据库，Service 负责推送，Socket 负责把变化及时告诉在线成员。

本次 SOS 广播由控制器调用 `server/server.js` 导出的 `io` 实例完成。`sockets/socket.handler.js` 负责连接认证和加入群组房间，因此控制器能够按房间向同群组连接发送事件。

### 第五步：B 接收事件，界面自动显示告警

```text
hooks/useSocket.js
    ↓ 收到 sos:triggered
store/groupStore.js
    ↓ 把告警加入 activeSOSAlerts
components/SOS/SOSModal.jsx
    ↓ 读取到新的活动告警
显示求助弹窗
```

这一步不需要 B 手动刷新页面。

`useSocket` 收到数据后更新 Store；React 发现相关状态变化，重新渲染读取这些状态的组件。

### 第六步：B 解除告警，所有人的界面更新

```text
B 的 SOSModal.jsx
    ↓ 点击解除并确认，发送 PATCH /api/sos/:alertId/resolve
api/axios.js
    ↓
routes/sos.routes.js → middleware/auth.middleware.js
    ↓
controllers/sos.controller.js
    ↓ 验证告警属于当前群组，且尚未解决
models/SOSAlert.model.js
    ↓ 保存 resolved 状态、解决者和解决时间
Socket.IO 广播 sos:resolved
    ↓
A、B 的 hooks/useSocket.js
    ↓
store/groupStore.js 移除对应活动告警
    ↓
SOSModal.jsx 更新，关闭对应告警
```

如果还有其他活动告警，弹窗会继续展示下一条。解除操作还会在 HTTP 请求成功后更新请求方的本地活动告警状态。

### 把整个例子连起来

```text
组件接收操作
    → API 发请求
    → Route 分发
    → Middleware 检查
    → Controller 协调业务
    → Model 保存 / Service 推送
    → Socket 广播变化
    → Hook 接收
    → Store 更新
    → 组件重新显示
```

读这个项目时，可以沿着这条路径追踪一个功能：**操作从哪个组件开始，后端由谁处理，数据保存在哪里，结果又怎样回到界面。**
