from flask import Flask, jsonify, render_template
import json
from .scraper import get_country_data, ScraperError
import os

app = Flask(__name__)

COUNTRIES_PATH = os.path.join(os.path.dirname(__file__), 'countries.json')
with open(COUNTRIES_PATH, 'r', encoding='utf-8') as f:
    COUNTRIES = json.load(f)


@app.route('/')
def index():
    return render_template('index.html', countries=COUNTRIES)


@app.route('/api/country/<slug>')
def api_country(slug):
    try:
        data = get_country_data(slug)
    except ScraperError as exc:
        return jsonify({'error': str(exc)}), 502
    return jsonify({'country': slug, 'data': data})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
