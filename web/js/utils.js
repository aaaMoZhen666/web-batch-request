/**
 * 获取整数输入框数值，限制在 min 和 max 之间
 */
function getInputNumber(input, defaultValue, min, max) {
    if (!input) return defaultValue

    let value = parseInt(input.value.trim())
    if (isNaN(value)) value = defaultValue

    return Math.max(min, Math.min(value, max))
}

/**
 * 只获取参数表格选中行
 */
function getSelectedParams(table) {
    return table.getSelectedData().reduce((params, row) => {
        const key = row.key?.trim()
        if (key) params[key] = (row.value ?? '').trim()
        return params
    }, {})
}

/**
 * 获取参数表格所有行，选中行添加 selected: true
 */
function getAllParamsWithSelection(table) {
    return table.getData().map((row, rowIndex) => {
        const tableRow = table.getRows()[rowIndex]
        const selected = tableRow.isSelected()

        return {
            key: row.key?.trim(),
            value: (row.value ?? '').trim(),
            ...(selected ? { selected: true } : {})
        }
    })
}
