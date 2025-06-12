from __future__ import print_function
import requests
import pandas as pd
import json
import re
import os
import csv
# import argparse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import NavigableString
from bs4 import BeautifulSoup
from bs4 import Tag
from urllib.parse import urljoin

# Set up command-line argument parsing
# parser = argparse.ArgumentParser(description='Search for keywords in a file with context.')
# parser.add_argument('input_file', type=str, help='Path to the input JSON file')

# Parse the arguments
# args = parser.parse_args()

class MyBeautifulSoup(BeautifulSoup):
    def _all_strings_plus(  self, strip=True, types=NavigableString, 
                            aRef={'a': lambda a: f"<{a.get('href', '')}>"}, 
                            skipTags=['script', 'style']    ):
        # verify types
        if hasattr(types,'__iter__') and not isinstance(types,type):
            types = tuple([t for t in types if isinstance(t, type)])
        if not (types and isinstance(types,(type,tuple))): types = NavigableString
        
        # skip text in tags included in aRef
        # skipTags += list(aRef.keys())
        
        for descendant in self.descendants:
            # yield extra strings according to aRef
            if isinstance(descendant, Tag) and descendant.name in aRef:
                extraStr = aRef[descendant.name](descendant)
                if isinstance(extraStr, str): yield extraStr

            # skip text nodes DIRECTLY inside a Tag in aRef
            # if descendant.parent.name in aRef: continue

            # skip ALL text nodes inside skipTags 
            if skipTags and descendant.find_parent(skipTags): continue

            # default behavior
            if not isinstance(descendant, types): continue

            if strip:
                descendant = descendant.strip()
                if len(descendant) == 0: continue
            yield descendant
    
    def get_text_plus(self, separator=" ", srcUrl=None, **aspArgs):
        if srcUrl and isinstance(srcUrl, str):
            def hrefStr(aTag):
                href = aTag.get('href')
                if not (href is None or href.startswith('javascript:')):
                    return f"<{urljoin(srcUrl, href)}>"
            aspArgs.setdefault('aRef', {})
            aspArgs['aRef']['a'] = hrefStr
        
        return separator.join(self._all_strings_plus(**aspArgs)) 



class URLScraper:
        
    @staticmethod
    def open_page(url):
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode to capture full page
        #chrome_options.add_argument("window-size=6709,5337")
        #chrome_options.add_argument("window-size=1920,5337")
        # Initialize the Chrome WebDriver with the specified options
        driver = webdriver.Chrome(options=chrome_options)
        # Open the URL in the browser
        driver.get(url)
        #time.sleep(3)  # Wait for the page to load (you can adjust the waiting time if needed)
        #driver.get(url)
        soup = MyBeautifulSoup(driver.page_source, "html.parser")
        print('TYPE OF SOUP:')
        print(type(soup))
        return soup

    @staticmethod
    def get_visible_text_and_links(url, use_selenium = False):
        if use_selenium:
            print('OPENING PAGE:')
            soup = open_page(url)
            print(type(soup))
        
        # Regardless, Make a GET request to the URL to get the base url:
        headers = {                                                                   
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36'     
        }   
        response = requests.get(url, headers=headers)
        # Expand relative links to absolute URLs
        base_url = response.url

        # Check if the request was successful (status code 200)
        if use_selenium or response.status_code == 200:
            # Parse the HTML content of the page
            if use_selenium == False:
                soup = MyBeautifulSoup(response.text.encode('ascii', 'ignore').decode('ascii'), 'html.parser')

                # Extract visible text
                visible_text = soup.body.get_text(' ', strip=True)

            else:
                visible_text = soup.get_text_plus(srcUrl=base_url)# ' '.join(soup.stripped_strings) #' '.join(soup.stripped_strings)
                #print(visible_text)
                return visible_text

            links = {link.get('href'): {'url': urljoin(base_url, link.get('href')), 'index': visible_text.find(link.text.strip())+len(link.text.lstrip()),'link_text':link.text.strip()} for link in soup.find_all('a') if visible_text.find(link.text.strip())>0}

            link_replacements = []
            for link, info in links.items():
                #print(f"Link: {link}, URL: {info['url']}, Index: {info['index']}")
                if link is not None and info['index']>=0:
                    link_replacements.append([info['index'],link])
            
            link_replacements = sorted(link_replacements, key=lambda x: x[0],reverse=True)
            for linkrep in link_replacements:
                # NOTE: Turning off link replacement for this task
                visible_text = visible_text[:linkrep[0]] + ' (' + linkrep[1] + ') ' + visible_text[linkrep[0]:]
            # Output the text with expanded links
            output = f"\n{visible_text}"
            return output

        else:
            return f'Failed to retrieve the page. Status code: {response.status_code}'



    @staticmethod
    def extract_with_spacing(in_str: str, find_str: str, spacing: int) -> list:
        results = []
        find_len = len(find_str)
        
        idx = 0
        while idx < len(in_str):
            idx = in_str.find(find_str, idx)
            if idx == -1:
                break
            
            # Calculate start and end indices with spacing
            start = max(0, idx - spacing)
            end = min(len(in_str), idx + find_len + spacing)
            
            results.append(in_str[start:end])
            idx += 1  # move forward to find overlapping matches if any

        return results


    @staticmethod
    def create_keyword_results_csv(filename='keyword_results.csv'):
        # Open the file in write mode initially
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            # Create a CSV writer object
            csv_writer = csv.writer(csvfile)
            
            # Write the header row
            csv_writer.writerow(['Scraped_URL', 'Company_Name', 'Website', 'Scraped_URLs', 'Page_Text'])
        
        return filename

    @staticmethod
    def create_error_results_csv(filename='error_results.csv'):
        # Open the file in write mode initially
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            # Create a CSV writer object
            csv_writer = csv.writer(csvfile)
            
            # Write the header row
            csv_writer.writerow(['Scraped_URL', 'Company_Name', 'Website', 'Scraped_URLs', 'Page_Text'])
        
        return filename

    @staticmethod
    def append_keyword_result(filename, url_to_scrape, keyword, example):
        # Open the file in append mode
        with open(filename, 'a', newline='', encoding='utf-8') as csvfile:
            # Create a CSV writer object
            csv_writer = csv.writer(csvfile)
            
            # Write the data row
            csv_writer.writerow([url_to_scrape, keyword, example])

    @staticmethod
    def append_error_result(filename, url_to_scrape, page_text,company_name, base_url, pip_urls):
        # Open the file in append mode
        with open(filename, 'a', newline='', encoding='utf-8') as csvfile:
            # Create a CSV writer object
            csv_writer = csv.writer(csvfile)
            
            # Write the data row
            csv_writer.writerow([url_to_scrape, company_name, base_url, pip_urls, page_text])
    
    @staticmethod     
    def append_good_result(filename, url_to_scrape, page_text, company_name, base_url, pip_urls):
        # Open the file in append mode
        with open(filename, 'a', newline='', encoding='utf-8') as csvfile:
            # Create a CSV writer object
            csv_writer = csv.writer(csvfile)
            
            # Write the data row
            csv_writer.writerow([url_to_scrape, company_name, base_url, pip_urls, page_text])

# input_data = pd.read_json(args.input_file).to_dict(orient='records')
# # print(f"Input Data: {input_data}")
# # print(f"{type(input_data)}")

# results_file = create_keyword_results_csv('./scraped_data/' + 'scraped_results.csv')
# errors_file = create_error_results_csv('./scraped_data/' + 'scraped_errors.csv')

# for company in input_data:
#     urls = list(company.get("People-info page URL"))
#     company_name = str(company.get("Company Name"))
#     base_url = str(company.get("Base URL"))
#     pip_urls = str(company.get("People-info page URL"))
#     print(f"Working on company: {company_name}")
#     # urls = list(pd.read_json(args.input_file)['Address'])
        
#     for url_to_scrape in urls:
#         try:
#             web_page_text = '\n\n' + get_visible_text_and_links(url_to_scrape,use_selenium = False)
#             if (web_page_text is None) or (len(web_page_text) < 50):
#                 print(f'\n\nSomething messed up!  Possible too-short page. The web_page_text was: {web_page_text}\n\n')
#                 append_error_result(errors_file, url_to_scrape, web_page_text, company_name, base_url, pip_urls)
#             else:
#                 print(f'Appending good result: {(results_file, url_to_scrape, web_page_text, company_name, base_url, pip_urls)}')
#                 append_good_result(results_file, url_to_scrape, web_page_text, company_name, base_url, pip_urls)

#         except Exception as e:
#             print(f'Error: {e}')
#             append_error_result(errors_file, url_to_scrape, web_page_text, company_name, base_url, pip_urls)
