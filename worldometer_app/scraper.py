import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.worldometers.info/world-population/"


class ScraperError(Exception):
    pass


def fetch_country_html(slug: str) -> str:
    url = BASE_URL + slug.strip('/') + '/'
    resp = requests.get(url, timeout=10)
    if resp.status_code != 200:
        raise ScraperError(f"Failed to fetch {url}: {resp.status_code}")
    return resp.text


def parse_country_data(html: str) -> dict:
    soup = BeautifulSoup(html, 'html.parser')

    def get_counter(rel_id: str):
        el = soup.find('span', {'rel': rel_id})
        if not el:
            return None
        return el.get_text(strip=True).replace(',', '')

    return {
        'population': get_counter('current_population'),
        'births_today': get_counter('births_today'),
        'births_this_year': get_counter('births_this_year'),
        'deaths_today': get_counter('deaths_today'),
        'deaths_this_year': get_counter('deaths_this_year'),
        'net_growth': get_counter('net_population_growth'),
    }


def get_country_data(slug: str) -> dict:
    html = fetch_country_html(slug)
    return parse_country_data(html)
