# 灵犀侧边栏交接文档

# 项目概况

## 简介

灵犀侧边栏，通常指<u>在WPS客户端内打开的灵犀侧边栏</u>和<u>在浏览器内在线文档打开的侧边栏</u>。

![WPS客户端]()![浏览器WO端]()
> 📢
> Q：WPS客户端内打开在线文档属于哪个端？
> A：也是WPS客户端。但是通信机制有差异；打开本地文档依赖客户端(主框)的通信能力+相应组件的通信接收能力，打开在线文档依赖客户端(主框)的通信能力+灵犀WO插件的通信接收能力。

## canvas能力支持

![]()
# 开发相关

## 前端开发

#### 代码仓库

1. 灵犀侧边栏&主站&移动端&mini灵犀&····

[https://ksogit.kso.net/frontend/copilot](https://ksogit.kso.net/frontend/copilot)

1. 灵犀插件

[https://ksogit.kso.net/lingxi/plugin](https://ksogit.kso.net/lingxi/plugin)

#### 项目结构

```plaintext
packages
├── @ks-lingxi               // 灵犀SDK，封装了流式处理、消息卡片等业务
├── copilot-api_v2           // 侧边栏请求的服务端API
├── copilot-dockpanel        // 初版侧边栏，老旧版本WPS客户端在用（暂不更新
├── copilot-dockpanel_v2     // 纯WPS端内侧边栏，通过cookie的lingxi_run_scene控制切换
├── copilot-dockpanel_v3     // 端云一体侧边栏（目前迭代的版本
├── ....
```

- 控制版本切换的cookie：
    - lingxi_run_scene=dockpanel：运行copilot-dockpanel项目
    - lingxi_run_scene=dockpanel_v2：运行copilot-dockpanel_v2项目
    - lingxi_run_scene=dockpanel_v3：运行copilot-dockpanel_v3项目
-  WO灵犀插件：
    - copilot-dockpanel_v3才支持WO灵犀插件
    - 其余版本无

#### 运行项目

> 参考README.md

##### copilot-dockpanel_v3项目说明

基于copilot-dockpanel_v3的开发调试流程，其余版本同理。

```plaintext
copilot-dockpanel_v3/
├── src/
│   ├── api/              # API 请求相关
│   ├── assets/           # 静态资源（图片、样式、lottie动画等）
│   ├── components/        # 业务组件
│   │   ├── agent/        # Agent 模式相关组件
│   │   ├── chat/         # 聊天相关组件
│   │   ├── collection/   # 收藏相关组件
│   │   ├── editor/       # 编辑器相关组件
│   │   ├── messages/     # 消息渲染组件
│   │   ├── modals/       # 弹窗组件
│   │   ├── sidebar/      # 侧边栏组件
│   │   └── ...
│   ├── compositions/     # Vue Composition API 组合式函数
│   ├── config/           # 配置文件
│   ├── external-plugins/ # 外部插件加载器
│   ├── i18n/            # 国际化语言包
│   ├── report/          # 埋点上报相关
│   ├── router/          # 路由配置
│   ├── store/           # Pinia 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── util/            # 工具函数
│   ├── wpsapi/          # WPS API 封装
│   ├── webview/         # 独立弹窗相关
│   ├── entry.ts         # 入口文件
│   ├── main.ts          # 主应用初始化
│   ├── App.vue          # 根组件
│   ├── expose.ts        # 暴露给外部使用的模块（WO插件）
│   ├── injectEnv.ts     # 环境变量注入
│   ├── plugin.entry.ts  # WO 插件入口
│   └── plugin.mf.ts     # Module Federation 入口
├── public/              # 公共静态资源
├── plugins/             # Vite 插件
├── build/               # 构建脚本
├── vite.config.ts       # Vite 配置
├── package.json         # 项目依赖
└── tsconfig.json        # TypeScript 配置
```

##### 关键文件说明

- `expose.ts`：**暴露给外部使用的模块**，<u>WO 插件的核心入口</u>
    - 提供 `render()` 方法用于渲染应用
    - 提供 `init()` 方法用于初始化插件
    - 初始化 `lingxiSidebarBridge` 通信桥接
    - **重要**：不要引入其他模块，如需引入必须异步引入
- `entry.ts`：应用入口，初始化自定义域名等
- `main.ts`：Vue 应用初始化，注册插件、路由、状态管理等
- `App.vue`：根组件，处理主题、路由监听、侧边栏事件等
- `vite.config.ts`：构建配置，包含多页面配置、代码分割、CDN 配置等

##### 开发测试环境说明

> 基于测试环境的host才能拥有测试环境的能力，如分支切换、插件上传或其他。

- 开发测试环境host：http://10.13.88.191/34.11.txt
- 客户端包下载地址：
- 金山文档开发测试环境(主要WO环境)：
    - 分支切换：https://www.kdocs.cn/index.html
        - WO分支需要找WO团队新建，覆盖分支插件时需要明确该分支是否有在占用
    - 插件上传：https://www.kdocs.cn/doge/
        - 

> Q：WO端为何需要切换分支？<br/>A：因为组件在开发中的功能，需要指定分支才能生效。当组件开发的功能合并到master后，可以不需要切换分支。

##### 代理说明

使用whistle进行本地开发代理

> ⚠注意：<br/>1. lingx.wps.cn 是个人账号的业务域名<br/>2. 企业账号、自定义域名的代理设置，按业务域名进行调整

- 客户端侧边栏

```shell
# web代理
lingxi.wps.cn localhost:8003
365.wps.cn localhost:8003
huimeng.wps.cn localhost:8003

# API代理（按需补充）
lingxi.wps.cn/api lingxi.wps.cn/api
lingxi.wps.cn/clouddoc lingxi.wps.cn/clouddoc
lingxi.wps.cn/2c-cloud lingxi.wps.cn/2c-cloud

```

- WO侧边栏

> ⚠注意：wo侧边栏不是一个web服务，是一个代码包。

````shell
# 组件入口代理
```body.txt
var script = document.createElement("script");
script.type = "module";
script.src = "http://localhost:8003/src/plugin.entry.ts";
document.body.appendChild(script)
```

/APPfd5dc383b9/ jsBody://{body.txt}
/APPfd5dc383b9/ resCors://enable
````

> 原理浅析：拦截插件入口文件，通过重写script标签加载本地开发环境的入口文件，实现代理到本地

### LUI SDK

| 对接方业务 | sdk对接人 | 是否上线 | 项目 |
| --- | --- | --- | --- |
| 灵犀主站agent3.0 | 徐航、朱幻 | 已上线 | copilot |
| pc端侧边栏深入研究 |  |  | copilot-dockpanel_v3 |
| wo侧边栏 |  | 一期已上线 | copilot-dockpanel_v2 |
| 灵犀主站企智 |  | 已上线 | copilot |
| 看图LUI | 徐航 |  | 外部 |
| 文字深度研究 | 万博 |  | 外部 |
| AI填表单 | 邹莹莹 | 仅灰度 | copilot-agent |
| 法务专区 | 邹莹莹 | 仅灰度 | copilot-agent |

### 模块负责人

| 模块 | 负责人 | 参考文档 |
| --- | --- | --- |
| 通信SDK |  |  |
| 灵犀LUI插件 |  |  |
| 会话关联 |  |  |
| 对话流 |  |  |
| 独立弹窗 |  |  |
| 灵犀SDK |  |  |
| 埋点设计 |  |  |
| 私有化 |  |  |
| 国际化 |  |  |
| 监控埋点 | / |  |
| 多语言 |  |  |

## 服务端联调相关

- 接口

## 客户端联调相关

- 接口

## 数据和协议

| 模块 | 负责人 | 参考文档 |
| --- | --- | --- |
| 错误码： |  |  |
| 通信 |  |  |
| 埋点 |  |  |
| 其它 |  |  |

## 协作相关接口人

| 团队 | 接口人 |
| --- | --- |
| 客户端主框架 | / |
| 客户端 - 文字 | / |
| 客户端 - 演示 |  |
| 客户端 - 表格 |  |
| 客户端 - pdf |  |

# 部署相关

# 进行中工作项

## 本地文字支持AgentMode  

> 前端暂无问题反馈，配合效果联调即可。

- 产品：刘翌菲
- 服务端：林泽锐、张瑞朋
- 测试：陈美好
- 开发分支：feat-wps-agent-mode
- 相关文档
    - 
    - 
    - 
    - 
    - 
- 相关群聊：
    - 联调群：张业生邀请你加入「【灵犀AgentMode】联调」，快点击链接加入吧 [群聊邀请](https://365.kdocs.cn/woa/invite/Bwt9xDukiuw?channel=stable)
    - 需求群：张业生邀请你加入「端侧本地文档-文字组件灵犀侧边栏支持LUI改格式」，快点击链接加入吧 [群聊邀请](https://365.kdocs.cn/woa/invite/0Wt9xYqkkxy?channel=stable)

## **国际化 & 多语言进行中工作项**

- 
- 相关群聊
    - 移动端国际版：林若莹邀请你加入「移动端AI业务国际版沟通群」，快点击链接加入吧 [群聊邀请](https://365.kdocs.cn/woa/invite/bMta0Ujl2pa?channel=stable)
    - 移动国际n合1：林若莹邀请你加入「移动国际-灵犀商业化」，快点击链接加入吧 [群聊邀请](https://365.kdocs.cn/woa/invite/LYta0Wxl5xl?channel=stable)
    - 侧边栏国际版：林若莹邀请你加入「【灵犀内部】国际化版本产研测」，快点击链接加入吧 [群聊邀请](https://365.kdocs.cn/woa/invite/0gta0rClega?channel=stable)

## 在线演示优化二期

灵犀前端负责人： 

灵犀后端负责人:  

演示前端负责人： 

产品负责人： 

灵犀测试负责人： 

copilot仓库功能分支：feat_wpp_optimize_0120

plugin仓库功能分支：feat_wpp_canvas_2nd

状态：开发已完成，进入提测阶段，尚未安排测试资源。

相关群聊

杨伟民邀请你加入「【S级】【1210】 演示Web canvas需求」，快点击链接加入吧 

[群聊邀请](https://365.kdocs.cn/woa/invite/7cta07Grihq?channel=stable)

# 相关文档

# 相关群聊

- 灵犀插件构建通知群：张业生邀请你加入「灵犀MR通知群」，快点击链接加入吧 [群聊邀请](https://365.kdocs.cn/woa/invite/sOt9xNXm2rH?channel=stable)
    - 用于下载插件包
![]()

TODO: 

SRE权限申请

SRE操作流程

SDK维护

ImageViewer