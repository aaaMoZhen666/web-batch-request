const elements = {
    // 菜单栏
    importTargetBtn: document.getElementById('importTargetBtn'),
    exportResultBtn: document.getElementById('exportResultBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    // 工具栏
    runBtn: document.getElementById('runBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    // 状态栏
    statusLabel: document.getElementById('statusLabel'),
    // 左面板
    targetTextarea: document.getElementById('targetTextarea'),
    lineNumberGutter: document.getElementById('lineNumberGutter'),
    // 参数表单
    methodSelect: document.getElementById('methodSelect'),
    pathInput: document.getElementById('pathInput'),
    threadCountInput: document.getElementById('threadCountInput'),
    timeoutInput: document.getElementById('timeoutInput'),
    followRedirectsCheck: document.getElementById('followRedirectsCheck'),
    useProxyCheck: document.getElementById('useProxyCheck'),
    proxyUrlInput: document.getElementById('proxyUrlInput'),
    verifyProxyBtn: document.getElementById('verifyProxyBtn'),
    // 复用模态框
    loadingBox: document.getElementById('loadingBox'),
    contentBox: document.getElementById('contentBox'),
    // 设置页面
    themeSelect: document.getElementById('themeSelect'),
    fontSizeInput: document.getElementById('fontSizeInput'),
    saveParamsCheck: document.getElementById('saveParamsCheck')
}

const modals = {
    settings: new bootstrap.Modal(document.getElementById('settingsModal')),
    reusable: new bootstrap.Modal(document.getElementById('reusableModal'))
}

const appStore = {
    TASK_STATUS_MAP: {
        idle: '空闲',
        running: '运行中',
        paused: '已暂停',
        cancelling: '正在取消',
        cancelled: '已取消',
        completed: '已完成'
    },
    settings: {
        display: {
            theme: 'light',
            fontSize: 14
        },
        requestPresets: {
            queryParams: [],
            bodyParams: [],
            cookies: [],
            headers: []
        }
    },
    tables: {}
}

/**
 * 初始化 Split.js 面板布局
 */
function initSplitPanels() {
    Split(['#split-0', '#split-1', '#split-2'], {
        gutterSize: 4,
        sizes: [20, 55, 25]
    })
}

/**
 * 初始化 Bootstrap 工具提示
 */
function initTooltips() {
    const tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')]
    tooltipTriggerList.forEach((el) => new bootstrap.Tooltip(el))
}

/**
 * 加载当前设置
 */
async function loadSettings() {
    try {
        appStore.settings = await window.pywebview.api.load_config()

        const root = document.documentElement
        root.setAttribute('data-bs-theme', appStore.settings.display.theme)
        root.style.cssText = `
            --font-size-sm: ${appStore.settings.display.fontSize - 2}px;
            --font-size-md: ${appStore.settings.display.fontSize}px;
            --font-size-lg: ${appStore.settings.display.fontSize + 2}px;
        `
    } catch (error) {
        console.error('Failed to load settings:', error)
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 文本区域 - 行号更新 & 同步滚动条
    elements.targetTextarea.addEventListener('input', updateLineNumbers)
    elements.targetTextarea.addEventListener('scroll', () => (elements.lineNumberGutter.scrollTop = elements.targetTextarea.scrollTop))

    // 文件操作 - 导入目标 & 导出结果
    elements.importTargetBtn.addEventListener('click', async () => {
        const content = await window.pywebview.api.import_target()
        elements.targetTextarea.value = content ?? ''
        updateLineNumbers()
    })
    elements.exportResultBtn.addEventListener('click', () => {
        const data = appStore.tables.responses.getData().sort((a, b) => a.id - b.id)
        window.pywebview.api.export_result(data)
    })

    // 设置页面 - 打开 & 保存设置
    elements.openSettingsBtn.addEventListener('click', () => {
        elements.themeSelect.value = appStore.settings.display.theme
        elements.fontSizeInput.value = appStore.settings.display.fontSize
        elements.saveParamsCheck.checked = false

        modals.settings.show()
    })
    elements.saveSettingsBtn.addEventListener('click', async () => {
        appStore.settings.display.theme = elements.themeSelect.value
        appStore.settings.display.fontSize = parseInt(elements.fontSizeInput.value, 10)

        if (elements.saveParamsCheck.checked) {
            const tableTypes = ['queryParams', 'bodyParams', 'cookies', 'headers']

            appStore.settings.requestPresets = tableTypes.reduce((result, type) => {
                result[type] = getAllParamsWithSelection(appStore.tables[type].table)
                return result
            }, {})

            tableTypes.forEach((type) => {
                appStore.tables[type].updateDefaultData(appStore.settings.requestPresets[type])
            })
        }

        await window.pywebview.api.save_config(appStore.settings)
        await loadSettings()
        modals.settings.hide()
    })

    // 任务控制 - 开始/暂停/恢复/取消
    elements.runBtn.addEventListener('click', () => {
        updateTaskStatus('running')
        appStore.tables.responses.clearData()

        const method = elements.methodSelect.value.trim()
        const target = elements.targetTextarea.value || elements.targetTextarea.placeholder
        const path = elements.pathInput.value.trim()

        const urls = target
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => line + path)

        const options = {
            thread_count: getInputNumber(elements.threadCountInput, 5, 1, 99),
            timeout: getInputNumber(elements.timeoutInput, 5, 1, 99),
            query_params: getSelectedParams(appStore.tables.queryParams.table),
            body_params: getSelectedParams(appStore.tables.bodyParams.table),
            cookies: getSelectedParams(appStore.tables.cookies.table),
            headers: getSelectedParams(appStore.tables.headers.table),
            allow_redirects: elements.followRedirectsCheck.checked,
            proxy: (elements.useProxyCheck.checked && elements.proxyUrlInput.value.trim()) || null
        }

        window.pywebview.api.run(method, urls, options)
    })
    elements.pauseBtn.addEventListener('click', () => {
        updateTaskStatus('paused')
        window.pywebview.api.pause()
    })
    elements.resumeBtn.addEventListener('click', () => {
        updateTaskStatus('running')
        window.pywebview.api.resume()
    })
    elements.cancelBtn.addEventListener('click', () => {
        updateTaskStatus('cancelling')
        window.pywebview.api.cancel()
    })

    // 代理验证
    elements.verifyProxyBtn.addEventListener('click', async () => {
        elements.loadingBox.hidden = false
        elements.contentBox.hidden = true
        modals.reusable.show()

        try {
            const result = await window.pywebview.api.verify_proxy(elements.proxyUrlInput.value.trim())

            elements.contentBox.textContent = `测试目标：${result.test_url}\n` + `请求次数：${result.total}\n` + `成功次数：${result.success}\n` + `返回IP：${result.ips.join('; ')}`
        } catch (error) {
            console.error('Failed to verify proxy:', error)
            elements.contentBox.textContent = '接口异常，请重试'
        } finally {
            elements.loadingBox.hidden = true
            elements.contentBox.hidden = false
        }
    })
}

/**
 * 根据当前文本内容更新行号
 */
function updateLineNumbers() {
    const lineCount = elements.targetTextarea.value.split('\n').length
    elements.lineNumberGutter.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')
}

/**
 * 更新任务控制按钮和任务状态标签
 */
function updateTaskStatus(statusKey) {
    elements.statusLabel.textContent = appStore.TASK_STATUS_MAP[statusKey]
    switch (statusKey) {
        case 'running':
            elements.runBtn.hidden = true
            elements.pauseBtn.hidden = false
            elements.resumeBtn.hidden = true
            elements.cancelBtn.disabled = false
            break
        case 'paused':
            elements.runBtn.hidden = true
            elements.pauseBtn.hidden = true
            elements.resumeBtn.hidden = false
            elements.cancelBtn.disabled = false
            break
        case 'cancelled':
        case 'completed':
        case 'idle':
            elements.runBtn.hidden = false
            elements.pauseBtn.hidden = true
            elements.resumeBtn.hidden = true
            elements.cancelBtn.disabled = true
            break
    }
}

/**
 * 将新数据追加到响应表格
 */
function appendResponseData(data) {
    appStore.tables.responses.addData(data)
}

/**
 * 初始化应用程序
 */
async function initApp() {
    try {
        initSplitPanels()
        initTooltips()
        await loadSettings()

        appStore.tables.queryParams = initRequestParamTable('queryParamsTable', appStore.settings.requestPresets.queryParams)
        appStore.tables.bodyParams = initRequestParamTable('bodyParamsTable', appStore.settings.requestPresets.bodyParams)
        appStore.tables.cookies = initRequestParamTable('cookiesTable', appStore.settings.requestPresets.cookies)
        appStore.tables.headers = initRequestParamTable('headersTable', appStore.settings.requestPresets.headers)
        appStore.tables.responses = initResponseTable('responsesTable')

        elements.targetTextarea.placeholder = 'https://www.google.com\nhttps://www.bing.com\nhttps://www.baidu.com'
        updateLineNumbers()
        updateTaskStatus('idle')

        bindEvents()
    } catch (error) {
        console.error('Initialization failed:', error)
    }
}
