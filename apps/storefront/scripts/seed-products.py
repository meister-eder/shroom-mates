#!/usr/bin/env python3
"""Seed Medusa with real Shroom-Mates products."""

import json
import os
import sys
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE = os.environ.get("MEDUSA_BACKEND_URL", "http://localhost:9000")
IMAGES_DIR = os.path.join(os.path.dirname(__file__), "../../website/src/assets/images")
SALES_CHANNEL_ID = os.environ.get("SALES_CHANNEL_ID", "sc_01KMWW188BE8ENEYZ7V3WJG89D")

# Retry-capable session
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))

# ── Auth ────────────────────────────────────────────────────────────────
def get_token():
    email = os.environ.get("MEDUSA_ADMIN_EMAIL")
    password = os.environ.get("MEDUSA_ADMIN_PASSWORD")
    if not email or not password:
        print("ERROR: Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD env vars")
        sys.exit(1)
    r = session.post(f"{BASE}/auth/user/emailpass", json={
        "email": email,
        "password": password,
    })
    r.raise_for_status()
    return r.json()["token"]

def headers(token):
    return {"Authorization": f"Bearer {token}"}

# ── Helpers ─────────────────────────────────────────────────────────────
def create_category(token, name, handle, rank=0):
    # Check if already exists
    r = session.get(f"{BASE}/admin/product-categories", headers=headers(token), params={"q": name})
    if r.ok:
        existing = [c for c in r.json().get("product_categories", []) if c["handle"] == handle]
        if existing:
            print(f"  Category exists: {name} ({existing[0]['id']})")
            return existing[0]["id"]
    r = session.post(f"{BASE}/admin/product-categories", headers=headers(token), json={
        "name": name,
        "handle": handle,
        "is_active": True,
        "is_internal": False,
        "rank": rank,
    })
    r.raise_for_status()
    cat = r.json()["product_category"]
    print(f"  Category: {cat['name']} ({cat['id']})")
    return cat["id"]

def upload_image(token, filepath):
    if not os.path.exists(filepath):
        print(f"  WARNING: Image not found: {filepath}")
        return None
    with open(filepath, "rb") as f:
        r = session.post(
            f"{BASE}/admin/uploads",
            headers=headers(token),
            files=[("files", (os.path.basename(filepath), f, "image/jpeg"))],
        )
    r.raise_for_status()
    files = r.json().get("files", [])
    if files:
        url = files[0].get("url")
        print(f"  Uploaded: {os.path.basename(filepath)} -> {url}")
        return url
    return None

def create_product(token, data, category_id):
    payload = {
        "title": data["title"],
        "subtitle": data.get("subtitle", ""),
        "description": data["description"],
        "handle": data["handle"],
        "status": "published",
        "is_giftcard": False,
        "discountable": True,
        "categories": [{"id": category_id}],
        "sales_channels": [{"id": SALES_CHANNEL_ID}],
        "options": [{"title": "Variante", "values": [v["option"] for v in data["variants"]]}],
        "metadata": {},
    }

    if data.get("thumbnail"):
        payload["thumbnail"] = data["thumbnail"]
    if data.get("images"):
        payload["images"] = [{"url": img} for img in data["images"]]

    r = session.post(f"{BASE}/admin/products", headers=headers(token), json=payload)
    if not r.ok:
        print(f"  ERROR creating {data['title']}: {r.status_code} {r.text[:300]}")
        return None
    product = r.json()["product"]
    print(f"  Product: {product['title']} ({product['id']})")

    # Create variants with prices
    for v in data["variants"]:
        variant_payload = {
            "title": v["title"],
            "manage_inventory": False,
            "prices": [{"amount": v["price_eur"], "currency_code": "eur"}],
            "options": {"Variante": v["option"]},
        }

        rv = session.post(
            f"{BASE}/admin/products/{product['id']}/variants",
            headers=headers(token),
            json=variant_payload,
        )
        if rv.ok:
            var = rv.json()["product"]["variants"][-1]
            print(f"    Variant: {v['title']} - €{v['price_eur']/100:.2f} ({var['id']})")
        else:
            print(f"    ERROR variant {v['title']}: {rv.status_code} {rv.text[:200]}")

    return product["id"]


# ── Main ────────────────────────────────────────────────────────────────
def main():
    print("Authenticating...")
    token = get_token()

    # Upload images
    print("\nUploading images...")
    images = {}
    image_files = {
        "rosenseitling": "rosenseitling_seite.jpg",
        "lions_mane": "lions_mane.jpg",
        "white_pearl": "white_pearl.jpg",
        "pioppino": "pioppino2.jpg",
        "black_pearl": "black pearl.jpg",
        "growkit_lions_mane": "photo_5323464934236556928_y.jpg",
        "growkit_rosenseitling": "hero_rose_tasse.jpg",
        "growkit_white_pearl": "photo_5323464934236556943_y.jpg",
        "tinktur_lions_mane": "lions_mane.jpg",
        "tinktur_reishi": "mushrooms.jpg",
        "tinkturen_group": "tinkturen.jpeg",
    }
    for key, filename in image_files.items():
        path = os.path.join(IMAGES_DIR, filename)
        url = upload_image(token, path)
        if url:
            images[key] = url

    # Create categories
    print("\nCreating categories...")
    cat_pilze = create_category(token, "Frische Pilze", "frische-pilze", 0)
    cat_growkits = create_category(token, "Growkits", "growkits", 1)
    cat_tinkturen = create_category(token, "Tinkturen", "tinkturen", 2)

    # ── Fresh Mushrooms ──
    print("\nCreating fresh mushroom products...")
    mushrooms = [
        {
            "title": "Rosenseitling",
            "subtitle": "Pleurotus djamor",
            "handle": "rosenseitling",
            "description": "Die Rosenseitlinge (Pleurotus djamor) sind eine besondere Variante der Austernpilze mit ihrer charakteristischen rosa bis pinken Färbung. Die Art stammt ursprünglich aus den Tropen und mag es warm. Deshalb züchten wir sie auch nur in den Sommermonaten. Sie sind viel zarter als klassische Austernpilze. Wenn man sie knusprig anbrät erinnern Geschmack und Textur an Speck.",
            "thumbnail": images.get("rosenseitling"),
            "images": [images["rosenseitling"]] if "rosenseitling" in images else [],
            "variants": [
                {"title": "200g Packung", "option": "200g", "price_eur": 800},
                {"title": "500g Packung", "option": "500g", "price_eur": 1800},
            ],
        },
        {
            "title": "Lion's Mane",
            "subtitle": "Hericium erinaceus",
            "handle": "lions-mane",
            "description": "Ein Pilz mit vielen Namen: Igel-Stachelbart, Lion's Mane, Pom Pom, Bärenkopf. Schon seit Jahrhunderten wird er in Asien als Vitalpilz geschätzt. Seine Inhaltsstoffe sollen besonders gesund für Körper und Geist sein.",
            "thumbnail": images.get("lions_mane"),
            "images": [images["lions_mane"]] if "lions_mane" in images else [],
            "variants": [
                {"title": "150g Packung", "option": "150g", "price_eur": 850},
                {"title": "300g Packung", "option": "300g", "price_eur": 1550},
            ],
        },
        {
            "title": "White Pearl",
            "subtitle": "Pleurotus ostreatus",
            "handle": "white-pearl",
            "description": "Der White Pearl ist unsere Lieblingsvariante des klassischen Austernpilzes (Pleurotus Ostreatus). Er ist sehr vielseitig einsetzbar und eignet sich zum Beispiel perfekt für Stir Frys. Wir bauen ihn ganzjährig an.",
            "thumbnail": images.get("white_pearl"),
            "images": [images["white_pearl"]] if "white_pearl" in images else [],
            "variants": [
                {"title": "200g Packung", "option": "200g", "price_eur": 650},
                {"title": "500g Packung", "option": "500g", "price_eur": 1400},
            ],
        },
        {
            "title": "Pioppino",
            "subtitle": "Cyclocybe aegerita",
            "handle": "pioppino",
            "description": "Der Pioppino, oder auch südlicher Ackerling (Cyclocybe aegerita), hat ein wunderbares Waldpilz-Aroma und bleibt beim Kochen trotzdem knackig. Schon die alten Römer haben ihn kultiviert.",
            "thumbnail": images.get("pioppino"),
            "images": [images["pioppino"]] if "pioppino" in images else [],
            "variants": [
                {"title": "200g Packung", "option": "200g", "price_eur": 850},
                {"title": "500g Packung", "option": "500g", "price_eur": 1900},
            ],
        },
        {
            "title": "Black Pearl",
            "subtitle": "Austernpilz × Kräuterseitling",
            "handle": "black-pearl",
            "description": "In den Wintermonaten züchten wir den Black Pearl – eine Kreuzung aus dem Austernpilz und Kräuterseitling. Stiel und Kappe sind gleichermaßen zart. Er lässt sich durch seine fleischige Konsistenz vielseitig verwenden, sogar auf dem Grill!",
            "thumbnail": images.get("black_pearl"),
            "images": [images["black_pearl"]] if "black_pearl" in images else [],
            "variants": [
                {"title": "200g Packung", "option": "200g", "price_eur": 750},
                {"title": "500g Packung", "option": "500g", "price_eur": 1650},
            ],
        },
    ]

    for m in mushrooms:
        create_product(token, m, cat_pilze)
        time.sleep(0.5)

    # ── Growkits ──
    print("\nCreating growkit products...")
    growkits = [
        {
            "title": "Lion's Mane Growkit",
            "subtitle": "Hericium erinaceus · 16-20°C · ca. 3 Wochen",
            "handle": "lions-mane-growkit",
            "description": "Der Lion's Mane sieht mit seinen langen, weißen Stacheln aus wie kein anderer Pilz. Er braucht etwas mehr Aufmerksamkeit als Austernpilze, aber der Geschmack lohnt sich. Ideal bei 16-20°C. In 2-3 Wochen erntereif. Schmeckt am besten in Butter gebraten oder paniert als Pilz-Nuggets.",
            "thumbnail": images.get("growkit_lions_mane"),
            "images": [images["growkit_lions_mane"]] if "growkit_lions_mane" in images else [],
            "variants": [
                {"title": "Growkit", "option": "Standard", "price_eur": 2790},
            ],
        },
        {
            "title": "Rosenseitling Growkit",
            "subtitle": "Pleurotus djamor · bis 28°C · schnellwüchsig",
            "handle": "rosenseitling-growkit",
            "description": "Der Rosenseitling ist perfekt für Anfänger. Er wächst schnell, verzeiht kleine Pflegefehler und sieht dabei auch noch gut aus. Oft schon nach 2-4 Tagen die ersten Pins. Verträgt Temperaturen bis 28°C.",
            "thumbnail": images.get("growkit_rosenseitling"),
            "images": [images["growkit_rosenseitling"]] if "growkit_rosenseitling" in images else [],
            "variants": [
                {"title": "Growkit", "option": "Standard", "price_eur": 2490},
            ],
        },
        {
            "title": "White Pearl Growkit",
            "subtitle": "Pleurotus ostreatus · 12-24°C · anfängerfreundlich",
            "handle": "white-pearl-growkit",
            "description": "Der White Pearl ist sehr unkompliziert, bringt viel Ertrag und verzeiht auch mal einen vergessenen Sprühvorgang. Wächst bei 12-24°C, optimal sind etwa 18-20°C. Schmeckt mild und leicht nussig.",
            "thumbnail": images.get("growkit_white_pearl"),
            "images": [images["growkit_white_pearl"]] if "growkit_white_pearl" in images else [],
            "variants": [
                {"title": "Growkit", "option": "Standard", "price_eur": 2290},
            ],
        },
    ]

    for g in growkits:
        create_product(token, g, cat_growkits)
        time.sleep(0.5)

    # ── Tinkturen ──
    print("\nCreating tincture products...")
    tinkturen = [
        {
            "title": "Lion's Mane Extrakt",
            "subtitle": "Hericium erinaceus · Dualextrakt",
            "handle": "lions-mane-extrakt",
            "description": "Lion's Mane enthält Hericenone und Erinacine, Verbindungen, die so in keinem anderen Pilz vorkommen. Sie können die Produktion des Nervenwachstumsfaktors (NGF) anregen, der Nervenzellen beim Wachstum und bei der Reparatur unterstützt. Erste Humanstudien zeigen Hinweise auf verbesserte Konzentration und Reaktionszeit.",
            "thumbnail": images.get("tinktur_lions_mane"),
            "images": [img for img in [images.get("tinktur_lions_mane"), images.get("tinkturen_group")] if img],
            "variants": [
                {"title": "50ml Flasche", "option": "50ml", "price_eur": 2990},
            ],
        },
        {
            "title": "Reishi + Cordyceps",
            "subtitle": "Ganoderma lucidum & Cordyceps militaris · Dualextrakt",
            "handle": "reishi-cordyceps",
            "description": "Reishi und Cordyceps sind beide Adaptogene, die den Körper bei Belastung unterstützen. Reishi enthält Polysaccharide und Triterpene, die entzündungshemmend wirken und das Immunsystem modulieren können. Cordyceps regt den Energiestoffwechsel an und kann die Sauerstoffverwertung bei körperlicher Belastung verbessern.",
            "thumbnail": images.get("tinktur_reishi"),
            "images": [img for img in [images.get("tinktur_reishi"), images.get("tinkturen_group")] if img],
            "variants": [
                {"title": "50ml Flasche", "option": "50ml", "price_eur": 3290},
            ],
        },
    ]

    for t in tinkturen:
        create_product(token, t, cat_tinkturen)
        time.sleep(0.5)

    print("\n✅ Done! All products seeded.")

if __name__ == "__main__":
    main()
