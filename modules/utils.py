import requests


def verify_proxy(proxy, total=4, timeout=5):
    """验证代理有效性"""
    proxies = {'http': proxy, 'https': proxy}
    test_url = 'https://ipinfo.io/json'
    success_count = 0
    ips = []

    for _ in range(total):
        try:
            response = requests.get(test_url, proxies=proxies, timeout=timeout)
            response.raise_for_status()
            ip_info = response.json().get('ip')
            ips.append(ip_info)
            success_count += 1
        except requests.RequestException:
            continue

    # 去重重复 IP
    unique_ips = list(set(ips))

    print('[DEBUG] Total Attempts: %d, Success: %d, IPs: %s' % (total, success_count, unique_ips))
    return {'test_url': test_url, 'total': total, 'success': success_count, 'ips': unique_ips}
