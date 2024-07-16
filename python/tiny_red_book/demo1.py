from playwright.sync_api import sync_playwright
import random
import time

def random_delay(min_seconds=1, max_seconds=3):
    time.sleep(random.uniform(min_seconds, max_seconds))

def open_xiaohongshu():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
        
        # Use a real browser profile for better mimicry
        context = browser.new_context()

        page = context.new_page()

        # Add more anti-detection scripts
        page.add_init_script("""
            // Remove WebGL Vendor & Renderer
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445 || parameter === 37446) {
                    return 'Intel Inc.';
                }
                return getParameter(parameter);
            };

            // Mock navigator properties
            Object.defineProperty(navigator, 'webdriver', {
              get: () => false,
            });

            // Mock plugins and languages
            Object.defineProperty(navigator, 'plugins', {
              get: () => [1, 2, 3, 4, 5],
            });

            Object.defineProperty(navigator, 'languages', {
              get: () => ['en-US', 'en'],
            });
        """)

        # Open Xiaohongshu and simulate user operations
        page.goto("https://www.xiaohongshu.com/explore")
        random_delay()

        # Simulate scrolling
        for _ in range(5):
            page.mouse.wheel(0, random.randint(300, 500))
            random_delay()

        print("浏览器已打开并加载小红书，按Ctrl+C退出")

        # Keep the script running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("退出")
        finally:
            browser.close()

open_xiaohongshu()
