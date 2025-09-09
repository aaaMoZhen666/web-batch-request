!(function (global) {
    /**
     * 获取整数输入框数值，限制在 min 和 max 之间
     */
    global.getInputNumber = function (element, defaultValue, min, max) {
        if (!element) return defaultValue

        let value = parseInt(element.value.trim())
        if (isNaN(value)) value = defaultValue

        return Math.max(min, Math.min(value, max))
    }

    /**
     * 只获取参数表格选中行
     */
    global.getSelectedParams = function (table) {
        return table.getSelectedData().reduce((params, row) => {
            const key = row.key?.trim()
            if (key) params[key] = (row.value ?? '').trim()
            return params
        }, {})
    }

    /**
     * 获取参数表格所有行，选中行添加 selected: true
     */
    global.getAllParamsWithSelection = function (table) {
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
})(window)
