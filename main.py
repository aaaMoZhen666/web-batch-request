import webview

from modules.worker import BatchRequester
from modules.fileio import import_target_file, export_result_file
from modules.config import load_config, save_config
from modules.utils import verify_proxy


class API:
    CONFIG_FILE = 'config.yaml'

    def __init__(self):
        self.requester = BatchRequester()

    def run(self, method, urls, options):
        self.requester.run(method, urls, **options)

    def pause(self):
        self.requester.pause()

    def resume(self):
        self.requester.resume()

    def cancel(self):
        self.requester.cancel()

    def load_config(self):
        return load_config(self.CONFIG_FILE)

    def save_config(self, data):
        return save_config(self.CONFIG_FILE, data)

    def import_target(self):
        return import_target_file(main_window)

    def export_result(self, data):
        return export_result_file(main_window, data)

    def verify_proxy(self, proxy):
        return verify_proxy(proxy)


def on_loaded(window):
    window.evaluate_js('myApp.loadSettings()')


if __name__ == '__main__':
    api = API()
    main_window = webview.create_window(title='Web批量请求器', url='web/index.html', js_api=api, width=1440, height=960)
    api.requester.set_ui_window(main_window)
    main_window.events.loaded += on_loaded
    # webview.start(debug=True)
    webview.start()
