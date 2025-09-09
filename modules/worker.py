import threading
import time
import json
from queue import Queue, Empty

import requests
from bs4 import BeautifulSoup


class BatchRequester:
    def __init__(self):
        # 任务控制事件
        self._is_running_event = threading.Event()  # 控制任务运行/暂停
        self._is_cancelled_event = threading.Event()  # 控制任务取消
        self._is_completed_event = threading.Event()  # 标记任务完成

        # 工作线程配置
        self._worker_thread_count = 5  # 工作线程数量
        self._worker_threads = None  # 工作线程列表

        # 请求结果相关
        self._result_queue = None  # 存放请求结果的队列
        self._result_collector_thread = None  # 收集请求结果的线程
        self._result_batch_size = 10  # 每批发送到前端的请求结果数量

        # webview 窗口
        self._ui_window = None

    def set_ui_window(self, window):
        self._ui_window = window

    def run(
        self,
        method,
        urls,
        thread_count=1,
        timeout=5,
        allow_redirects=True,
        query_params=None,
        body_params=None,
        cookies=None,
        headers=None,
        proxy=None,
    ):
        # 构建 request 请求参数
        request_config = {
            'params': query_params,
            'headers': headers,
            'cookies': cookies,
            'proxies': None if proxy is None else {'http': proxy, 'https': proxy},
            'allow_redirects': allow_redirects,
            'timeout': timeout,
        }

        # 根据 Content-Type 设置请求体类型
        if headers:
            content_type = next((v for k, v in headers.items() if k.lower() == 'content-type'), None)
            if content_type and 'application/json' in content_type.lower():
                request_config['json'] = body_params
            else:
                request_config['data'] = body_params

        print(f'[DEBUG] Request Config: {request_config}')

        # 初始化任务状态、工作线程和结果队列
        self._is_running_event.set()
        self._is_cancelled_event.clear()
        self._is_completed_event.clear()
        self._worker_threads = []
        self._worker_thread_count = thread_count
        self._result_queue = Queue()

        index_chunks = self._distribute_indices(len(urls))

        # 启动工作线程
        for chunk in index_chunks:
            thread = threading.Thread(target=self._process_url_batch, args=(chunk, method, urls, request_config))
            self._worker_threads.append(thread)
            thread.start()

        # 启动请求结果收集线程
        self._result_collector_thread = threading.Thread(target=self._collect_results)
        self._result_collector_thread.start()

        for t in self._worker_threads:
            t.join()

        self._is_completed_event.set()

    def pause(self):
        self._is_running_event.clear()

    def resume(self):
        self._is_running_event.set()

    def cancel(self):
        self._is_running_event.set()
        self._is_cancelled_event.set()
        self._is_completed_event.set()

    def _distribute_indices(self, total):
        """按线程数平均分配 URL 索引，使请求结果的顺序尽量接近原始顺序"""
        index_chunks = [[] for _ in range(self._worker_thread_count)]
        for i in range(total):
            index_chunks[i % self._worker_thread_count].append(i)
        return index_chunks

    def _process_url_batch(self, indices, method, urls, request_config):
        """批量处理指定索引的 URL 请求"""
        for i in indices:
            self._is_running_event.wait()
            if self._is_cancelled_event.is_set():
                break
            self._execute_request(i, method, urls[i], request_config)

    def _execute_request(self, index, method, url, request_config):
        """发送请求并将结果加入队列"""
        try:
            # 发送请求并记录响应时间
            start_time = time.time()
            response = requests.request(method, url, **request_config)
            elapsed_ms = int((time.time() - start_time) * 1000)

            # 获取网页标题
            page_title = None
            if 'text/html' in response.headers.get('Content-Type', ''):
                soup = BeautifulSoup(response.content, 'html.parser')
                page_title = soup.title.string.strip() if soup.title else None

            self._result_queue.put(
                {
                    'id': index + 1,
                    'target': url,
                    'status': response.status_code,
                    'server': response.headers.get('Server', 'Unknown'),
                    'title': page_title,
                    'time': elapsed_ms,
                    'length': len(response.content),
                }
            )
        except requests.exceptions.RequestException as e:
            self._result_queue.put(
                {
                    'id': index + 1,
                    'target': url,
                    'status': 'Error',
                    'server': None,
                    'title': None,
                    'time': None,
                    'length': None,
                }
            )

    def _collect_results(self):
        """收集请求结果并按批次发送到前端"""
        result_buffer = []

        # 循环直到任务完成且队列为空
        while not self._is_completed_event.is_set() or not self._result_queue.empty():
            self._is_running_event.wait()

            if self._is_cancelled_event.is_set():
                break

            try:
                # 从结果队列依次获取结果添加到缓冲区
                result_buffer.append(self._result_queue.get(timeout=1))

                # 当缓冲区达到批量大小时，发送到前端并清空缓冲
                if len(result_buffer) >= self._result_batch_size:
                    self._send_results_to_ui(result_buffer)
                    result_buffer = []
            except Empty:
                continue

        # 发送剩余未满批量大小的结果
        if result_buffer:
            self._send_results_to_ui(result_buffer)

        # 根据任务状态更新前端
        if self._is_cancelled_event.is_set():
            self._update_ui_status('cancelled')
        else:
            self._update_ui_status('completed')

    def _send_results_to_ui(self, results):
        """发送请求结果到前端表格"""
        self._ui_window.evaluate_js(f'myApp.appendResponseData({json.dumps(results)})')

    def _update_ui_status(self, status_key):
        """更新前端任务状态"""
        self._ui_window.evaluate_js(f'myApp.updateTaskStatus({json.dumps(status_key)})')
