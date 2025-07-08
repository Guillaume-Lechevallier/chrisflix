import os, sys; sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
import pytest
from worldometer_app.scraper import parse_country_data

SAMPLE_HTML = '''
<span rel="current_population">65,000,000</span>
<span rel="births_today">1000</span>
<span rel="births_this_year">30000</span>
<span rel="deaths_today">800</span>
<span rel="deaths_this_year">25000</span>
<span rel="net_population_growth">200</span>
'''

def test_parse_country_data():
    data = parse_country_data(SAMPLE_HTML)
    assert data['population'] == '65000000'
    assert data['births_today'] == '1000'
    assert data['births_this_year'] == '30000'
    assert data['deaths_today'] == '800'
    assert data['deaths_this_year'] == '25000'
    assert data['net_growth'] == '200'
