# 这是一个完整的浏览器插件脚手架项目，目标实现chrome 插件的全链路开发支持

寻找wxt相关解决方案时，优先从 codewiki / wxt-dev/wxt 搜索。

代码风格和实现方案优先从 codewiki-mcp / microsoft/vscode 中获取。

# 项目需求

实现一个chrome 插件，将金山文档内的智能文档，导出为markdown格式。

输出的markdown文件直接通过浏览器进行下载导出。


## 实现策略
1. 插件先匹配金山文档智能文档的页面，匹配方式为：
    fileInfo.office_type === 'o',则应用插件，否则不应用
2. 智能文档的所有信息都保存在`window.APP.OTL.originDoc`变量中。

3. 编写 parser 函数，将`window.APP.OTL.originDoc`变量中的信息解析为markdown格式。

4. 检查markdown文件是否符合要求，如果不符合要求，则检查 parser 函数的实现是否正确。

5. 如果符合要求，则将markdown文件通过浏览器进行下载导出。

6. 我会先手动获取`window.APP.OTL.originDoc`变量，并写入本地目录文件中。

7. 你只需要读取此json，编写 parser 函数，并反复测试，直到可以输出正确的 markdown 文件。

8. 临时文件放在parser/ap*.json文件中。

9. 你需要制定完整的检查策略，确保 parser 函数可以正确解析`window.APP.OTL.state.doc`变量中的信息。

10. 尽可能减少人工的介入。

