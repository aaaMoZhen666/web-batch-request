from tkinter import Tk, filedialog
import json
import csv


def import_target_file():
    """导入目标数据文件内容"""
    try:
        root = Tk()
        root.withdraw()
        file_path = filedialog.askopenfilename(filetypes=[('Text Files', '*.txt')])
        root.destroy()

        if not file_path:
            return None

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return content
    except Exception as e:
        print(f'[DEBUG][ERROR] Failed to import file: {e}')
        return None


def export_result_file(data):
    """导出结果数据文件"""
    try:
        root = Tk()
        root.withdraw()
        file_path = filedialog.asksaveasfilename(
            defaultextension='.csv',
            filetypes=[('CSV Files', '*.csv'), ('JSON Files', '*.json'), ('All Files', '*.*')],
            initialfile='data.csv',
        )
        root.destroy()

        if not file_path:
            return

        # 保存为 JSON 格式
        if file_path.endswith('.json'):
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        # 保存为 CSV 格式（默认）
        else:
            with open(file_path, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
    except Exception as e:
        print(f'[DEBUG][ERROR] Failed to export file: {e}')
        return
