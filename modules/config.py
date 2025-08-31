import yaml
import os


def load_config(file):
    """读取配置文件"""
    if not os.path.exists(file):
        print(f'[DEBUG][ERROR] Config file {file} not found')
        return None

    try:
        with open(file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        return data
    except Exception as e:
        print(f'[DEBUG][ERROR] Failed to load config: {e}')
        return None


def save_config(file, data):
    """保存配置到 YAML 文件"""
    try:
        with open(file, 'w', encoding='utf-8') as f:
            yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False)
    except Exception as e:
        print(f'[DEBUG][ERROR] Failed to save config: {e}')
