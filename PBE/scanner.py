import asyncio
import os
import requests
from playwright.async_api import async_playwright
from urllib.parse import quote_plus
from proxy_manager import fetch_free_proxies, get_working_proxy

async def scan_target(client_id: str, full_name: str, past_city: str, max_retries=3):
    # Get Supabase credentials
    supabase_url = os.getenv("supabase_url")
    supabase_key = os.getenv("supabase_service_role_key")
    
    if not supabase_url or not supabase_key:
        print("[!] ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
        return []
    
    targets_found = []
    
    for attempt in range(max_retries):
        print(f"\n[*] Attempt {attempt + 1}/{max_retries}")
        
        proxies = fetch_free_proxies(count=30)
        working_proxy = get_working_proxy(proxies)
        
        if not working_proxy:
            print(f"[!] No working proxy on attempt {attempt + 1}. Retrying...")
            continue
        
        async with async_playwright() as p:
            try:
                browser = await p.chromium.launch(
                    headless=True,
                    proxy={"server": working_proxy}
                )
                
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1920, "height": 1080}
                )
                
                page = await context.new_page()
                
                # TARGET 1: TRUEPEOPLESEARCH
                try:
                    print(f"[*] Scanning TruePeopleSearch for {full_name}...")
                    url = f"https://www.truepeoplesearch.com/results?name={full_name.replace(' ', '%20')}&citystatezip={quote_plus(past_city)}"
                    await page.goto(url, timeout=30000)
                    await page.wait_for_selector("[data-result]", timeout=10000)
                    
                    results = await page.query_selector_all("[data-result] a")
                    for res in results[:3]:
                        href = await res.get_attribute("href")
                        if href:
                            full_url = f"https://www.truepeoplesearch.com{href}" if href.startswith("/") else href
                            targets_found.append({
                                "broker_name": "TruePeopleSearch",
                                "profile_url": full_url,
                                "status": "PENDING_OPT_OUT"
                            })
                except Exception as e:
                    print(f"[!] TruePeopleSearch failed: {e}")
                
                # TARGET 2: FASTPEOPLESEARCH
                try:
                    print(f"[*] Scanning FastPeopleSearch for {full_name}...")
                    url = f"https://www.fastpeoplesearch.com/name/{full_name.replace(' ', '-')}_{quote_plus(past_city)}"
                    await page.goto(url, timeout=30000)
                    await page.wait_for_timeout(3000)
                    
                    results = await page.query_selector_all(".card a[href*='/detail']")
                    for res in results[:3]:
                        href = await res.get_attribute("href")
                        if href:
                            full_url = f"https://www.fastpeoplesearch.com{href}" if href.startswith("/") else href
                            targets_found.append({
                                "broker_name": "FastPeopleSearch",
                                "profile_url": full_url,
                                "status": "PENDING_OPT_OUT"
                            })
                except Exception as e:
                    print(f"[!] FastPeopleSearch failed: {e}")

                # TARGET 3: GOOGLE DORK
                try:
                    print(f"[*] Running Google Dork for {full_name}...")
                    dork = f'"{full_name}" "{past_city}" site:spokeo.com OR site:whitepages.com OR site:radaris.com'
                    await page.goto(f"https://www.google.com/search?q={quote_plus(dork)}", timeout=30000)
                    await page.wait_for_timeout(2000)
                    
                    links = await page.query_selector_all("a[href]")
                    for link in links:
                        href = await link.get_attribute("href")
                        if href and any(b in href for b in ["spokeo.com", "whitepages.com", "radaris.com"]):
                            targets_found.append({
                                "broker_name": "Google_Dork",
                                "profile_url": href,
                                "status": "PENDING_OPT_OUT"
                            })
                except Exception as e:
                    print(f"[!] Google Dork failed: {e}")
                
                await browser.close()
                
                if targets_found:
                    break
                    
            except Exception as e:
                print(f"[!] Browser crashed with proxy {working_proxy}: {e}")
                try:
                    await browser.close()
                except:
                    pass
    
    # Deduplicate by URL
    unique = {}
    for t in targets_found:
        if t['profile_url'] not in unique:
            unique[t['profile_url']] = t
    results = list(unique.values())
    
    # WRITE TO SUPABASE USING DIRECT HTTP
    if results:
        print(f"\n[+] Writing {len(results)} targets to database for client {client_id}...")
        
        for target in results:
            target['client_id'] = client_id
        
        try:
            response = requests.post(
                f"{supabase_url}/rest/v1/targets",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                json=results
            )
            
            if response.status_code in [200, 201]:
                print(f"[+] Successfully saved {len(results)} targets to Supabase")
            else:
                print(f"[!] Failed to write to Supabase: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"[!] Failed to write to Supabase: {e}")
    
    print(f"\n[+] SCAN COMPLETE. Found {len(results)} targets.")
    return results

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    test_client_id = "00000000-0000-0000-0000-000000000000"
    results = asyncio.run(scan_target(test_client_id, "John Smith", "Toronto ON"))
