function initRequestParamTable(tableId, defaultData = []) {
    const counter = document.getElementById(`${tableId}Counter`)
    const toolbar = document.getElementById(`${tableId}Toolbar`)
    const [addBtn, clearBtn, resetBtn] = toolbar.querySelectorAll('.add-btn, .clear-btn, .reset-btn')

    let currentDefaultData = [...defaultData]

    const table = new Tabulator(`#${tableId}`, {
        height: '100%',
        data: JSON.parse(JSON.stringify(defaultData)),
        theme: 'bootstrap5',
        movableRows: true,
        layout: 'fitColumns',
        columns: [
            {
                formatter: 'rowSelection',
                titleFormatter: 'rowSelection',
                hozAlign: 'center',
                headerSort: false,
                width: 40
            },
            { title: 'Name', field: 'key', widthGrow: 1, sorter: 'string', editor: 'input' },
            { title: 'Value', field: 'value', widthGrow: 2, sorter: 'string', editor: 'input' },
            {
                width: 40,
                formatter: 'buttonCross',
                hozAlign: 'center',
                headerSort: false,
                cellClick: (e, cell) => cell.getRow().delete()
            }
        ]
    })

    const updateCounter = () => {
        counter.textContent = table.getSelectedData().length
    }

    table.on('dataProcessed', () => {
        table.getRows().forEach((row) => {
            if (row.getData().selected) row.select()
        })
        updateCounter()
    })
    table.on('dataChanged', updateCounter)
    table.on('rowSelectionChanged', updateCounter)

    addBtn.addEventListener('click', () => table.addRow({ name: '', value: '' }))
    clearBtn.addEventListener('click', () => table.clearData())
    resetBtn.addEventListener('click', () => table.setData(JSON.parse(JSON.stringify(currentDefaultData))))

    return {
        table,
        updateDefaultData: (newDefaultData) => (currentDefaultData = [...newDefaultData])
    }
}

function initResponseTable(tableId) {
    const table = new Tabulator(`#${tableId}`, {
        height: '100%',
        theme: 'bootstrap5',
        movableRows: true,
        layout: 'fitColumns',
        columns: [
            {
                field: 'id',
                width: 40,
                sorter: 'number',
                hozAlign: 'center'
            },
            {
                title: 'Target',
                field: 'target',
                sorter: 'string',
                formatter: 'link',
                formatterParams: {
                    target: '_blank'
                },
                headerFilter: 'input',
                headerFilterPlaceholder: 'Filter',
                headerMenu: createColumnHeaderMenu
            },
            {
                title: 'Status',
                field: 'status',
                sorter: 'number',
                headerFilter: 'input',
                headerFilterPlaceholder: 'Filter',
                headerMenu: createColumnHeaderMenu
            },
            {
                title: 'Server',
                field: 'server',
                sorter: 'string',
                headerFilter: 'input',
                headerFilterPlaceholder: 'Filter',
                headerMenu: createColumnHeaderMenu
            },
            {
                title: 'Title',
                field: 'title',
                sorter: 'string',
                headerFilter: 'input',
                headerFilterPlaceholder: 'Filter',
                headerMenu: createColumnHeaderMenu
            },
            {
                title: 'Response Time (ms)',
                field: 'time',
                sorter: 'number',
                headerFilter: 'input',
                headerFilterPlaceholder: 'Filter: Min-Max',
                headerFilterFunc: numericRangeFilter,
                headerMenu: createColumnHeaderMenu
            },
            {
                title: 'Length',
                field: 'length',
                sorter: 'number',
                headerFilter: 'input',
                headerFilterPlaceholder: 'Filter: Min-Max',
                headerFilterFunc: numericRangeFilter,
                headerMenu: createColumnHeaderMenu
            },
            {
                width: 40,
                formatter: 'buttonCross',
                hozAlign: 'center',
                headerSort: false,
                cellClick: (e, cell) => cell.getRow().delete()
            }
        ],
        initialSort: [{ column: 'id', dir: 'asc' }],
        rowContextMenu: [
            {
                label: '标记为红色',
                action: (e, row) => {
                    row.getElement().style.backgroundColor = 'var(--bs-danger-border-subtle)'
                }
            },
            {
                label: '标记为黄色',
                action: (e, row) => {
                    row.getElement().style.backgroundColor = 'var(--bs-warning-border-subtle)'
                }
            },
            {
                label: '标记为绿色',
                action: (e, row) => {
                    row.getElement().style.backgroundColor = 'var(--bs-success-border-subtle)'
                }
            },
            {
                label: '标记为蓝色',
                action: (e, row) => {
                    row.getElement().style.backgroundColor = 'var(--bs-primary-border-subtle)'
                }
            },
            {
                label: '恢复默认颜色',
                action: (e, row) => {
                    row.getElement().style.backgroundColor = ''
                }
            }
        ],
        popupContainer: '#split-1'
    })

    return table
}

/**
 * 数值范围过滤器
 */
function numericRangeFilter(headerValue, rowValue) {
    if (!headerValue) return true

    const parts = headerValue.replace(/\s/g, '').split('-')

    let min = parseFloat(parts[0])
    let max = parseFloat(parts[1])

    if (isNaN(min)) min = 0
    if (isNaN(max)) max = Infinity

    return rowValue != null && rowValue >= min && rowValue <= max
}

/**
 * 创建列头菜单，用于控制列的显示或隐藏
 */
function createColumnHeaderMenu() {
    const menu = []
    const columns = this.getColumns()

    for (const column of columns) {
        if (!column.getDefinition().title) continue

        // 创建图标元素（使用 Bootstrap Icons）
        const icon = document.createElement('i')
        icon.classList.add('bi', column.isVisible() ? 'bi-check-square' : 'bi-square')

        // 创建标签容器和标题文本节点
        const label = document.createElement('span')
        const title = document.createElement('span')
        title.textContent = ` ${column.getDefinition().title}`
        label.append(icon, title)

        // 添加菜单项，包括标签和点击动作
        menu.push({
            label,
            // 点击时切换列的可见性，并更新图标
            action: (e) => {
                // 阻止事件冒泡
                e.stopPropagation()
                // 显示或隐藏列
                column.toggle()
                // 根据列的可见性更新图标
                if (column.isVisible()) {
                    icon.classList.replace('bi-square', 'bi-check-square')
                } else {
                    icon.classList.replace('bi-check-square', 'bi-square')
                }
            }
        })
    }

    return menu
}
