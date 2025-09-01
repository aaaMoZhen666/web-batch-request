# Web批量请求器（WebBatchRequest）

> ⚠️ 本工具仅供安全研究和技术交流，严禁用于非法用途。

## 🏷️ 项目简介

Web批量请求器（WebBatchRequest）是一款基于 Python 编写的工具，可对目标地址进行快速批量的存活探测，允许自定义 HTTP 请求，支持 HTTP/SOCKS5 代理，适用于批量漏洞验证场景。

本项目基于 [WebBatchRequest](https://github.com/ScriptKid-Beta/WebBatchRequest) 和 [WebBatchRequestpro](https://github.com/XF-FS/WebBatchRequestpro) 的设计思路，采用 Python 和 PyWebview 实现，前端结合 Bootstrap 和 Tabulator 构建了现代化交互界面，并新增了多项实用功能。

## ✨ 核心特性

### 基础功能

- [x] 支持GET、POST、HEAD 请求
- [x] 可自定义请求头、Cookies
- [x] 可自定义路径、查询参数、请求体参数
- [x] 可设置跟随重定向、超时时间
- [x] 支持多线程，可自定义线程数
- [x] 支持 HTTP/SOCKS5 代理
- [x] 支持数据的导入与导出

### 表格管理

- [x] 可拖拽、删除行
- [x] 支持排序

#### 请求参数表格

- [x] 可预设请求参数
- [x] 支持选择性应用参数
- [x] 支持增、删、改请求参数

#### 响应结果表格

- [x] 可右键标记行颜色
- [x] 支持多级过滤
- [x] 支持默认浏览器打开

### 外观设置

- [x] 明暗主题切换
- [x] 字体大小调整

### 其他功能

- [x] 简单验证代理有效性

## 🎉 致谢

### 感谢开源项目

本项目使用或参考了以下开源项目，在此致以由衷的感谢：

| 项目                                                                   | 简介 / 用途         |
|:--------------------------------------------------------------------:|:---------------:|
| [WebBatchRequest](https://github.com/ScriptKid-Beta/WebBatchRequest) | 原始项目            |
| [WebBatchRequestpro](https://github.com/XF-FS/WebBatchRequestpro)    | 设计参考            |
| [pywebview](https://github.com/r0x0r/pywebview)                      | 使用 Web 技术开发桌面应用 |
| [bootstrap](https://github.com/twbs/bootstrap)                       | 构建现代化界面         |
| [tabulator](https://github.com/olifolkerd/tabulator)                 | 创建交互式表格         |
| [split](https://github.com/nathancahill/split)                       | 实现可调节的面板        |

