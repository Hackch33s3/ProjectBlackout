import requests
import random

def fetch_free_proxies(count=50):
    """
    Pulls fresh proxies from public free proxy APIs.
    Returns a list of proxy strings in the format 'http://IP:PORT'.
    """
    proxies = []
    
    # Source 1: Proxyscrape API
    try:
        url = "https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=5000&country=all"
        response = requests.get(url, timeout=10)
        for line in response.text.strip().split('\n'):
            if ':' in line:
                proxies.append(f"http://{line.strip()}")
    except Exception as e:
        print(f"[!] Proxyscrape fetch failed: {e}")

    # Source 2: Free-proxy-list.net (via API mirror)
    try:
        url = "https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt"
        response = requests.get(url, timeout=10)
        for line in response.text.strip().split('\n'):
            if ':' in line:
                proxies.append(f"http://{line.strip()}")
    except Exception as e:
        print(f"[!] GitHub proxy list fetch failed: {e}")

    # Deduplicate and shuffle
    proxies = list(set(proxies))
    random.shuffle(proxies)
    
    print(f"[+] Fetched {len(proxies)} free proxies")
    return proxies[:count]

def get_working_proxy(proxies, test_url="https://httpbin.org/ip", timeout=8):
    """
    Tests proxies one by one and returns the first one that responds.
    """
    for i, proxy in enumerate(proxies):
        try:
            response = requests.get(
                test_url,
                proxies={"http": proxy, "https": proxy},
                timeout=timeout
            )
            if response.status_code == 200:
                print(f"[+] Working proxy found: {proxy} (tried {i+1}/{len(proxies)})")
                return proxy
        except:
            continue
    
    print(f"[!] All {len(proxies)} proxies failed. Fetching fresh batch...")
    return None