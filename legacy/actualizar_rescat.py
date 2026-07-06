"""
actualizar_rescat.py
════════════════════════════════════════════════════════
RESCAT — Script de actualización automática
════════════════════════════════════════════════════════

CÓMO USAR:
  1. Pon este script en tu carpeta RESCAT (junto al Excel y los HTML)
  2. Actualiza el Excel (SampleSuperstore.xlsx) con los datos nuevos
  3. Agrega imágenes nuevas en la carpeta "Imágenes productos"
     (el nombre del archivo = nombre exacto del producto en el Excel)
  4. Abre una terminal en la carpeta RESCAT y ejecuta:
        python actualizar_rescat.py
  5. Listo — los 3 archivos JS se regeneran solos

REQUISITOS (instalar una sola vez):
  pip install pandas openpyxl pillow
"""

import sys
import os
import json
import base64
import io
from pathlib import Path
from datetime import datetime
from collections import Counter

# ── VERIFICAR DEPENDENCIAS ────────────────────────────────────────────────────
try:
    import pandas as pd
    from PIL import Image
except ImportError:
    print("Instalando dependencias...")
    os.system(f"{sys.executable} -m pip install pandas openpyxl pillow")
    import pandas as pd
    from PIL import Image

# ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
# Carpeta donde está este script (= carpeta RESCAT)
BASE = Path(__file__).parent

EXCEL         = BASE / "SampleSuperstore.xlsx"
DIR_PRODUCTOS = BASE / "Imágenes productos"
DIR_CAJAS     = BASE / "Caja sopresa"
DIR_ICONOS    = BASE / "Íconos"   # ajustar si el nombre de carpeta varía

# Hoja del Excel
HOJA_STOCK  = 1   # segunda hoja = stock
HOJA_VENTAS = 0   # primera hoja = ventas

# Fecha de referencia para calcular días restantes
# Cambia a: HOY = pd.Timestamp.now()  para usar la fecha real del día
HOY = pd.Timestamp('2026-06-27')

# Cajas sorpresa — define aquí las combinaciones
COMBOS_CAJAS = [
    {
        'id': 'desayuno', 'nom': 'Caja Desayuno', 'emoji': '🌅',
        'tipo': 'duo', 'img': 'caja_desayuno',
        'prods': ['Pan de Molde Blanco', 'Leche Entera 1L', 'Galletas de Chocolate']
    },
    {
        'id': 'lacteos', 'nom': 'Caja Lácteos', 'emoji': '🥛',
        'tipo': 'solo', 'img': 'caja_lacteos',
        'prods': ['Leche Descremada 1L', 'Queso Fresco 500g', 'Media Cubeta de Huevos x15']
    },
    {
        'id': 'verduras', 'nom': 'Caja Verduras', 'emoji': '🥦',
        'tipo': 'duo', 'img': 'caja_verduras',
        'prods': ['Tomate Riñón 1kg', 'Cebolla Paiteña 1kg', 'Plátano Verde x5']
    },
    {
        'id': 'proteina', 'nom': 'Caja Proteína', 'emoji': '🥩',
        'tipo': 'familia', 'img': 'caja_carne',
        'prods': ['Carne de Res Molida 500g', 'Salchichas de Pollo', 'Mortadela 500 g']
    },
]

# ── FUNCIONES ─────────────────────────────────────────────────────────────────

def comprimir_imagen(path, max_w=600, calidad=78):
    """Convierte imagen a base64 comprimida para embeber en JS."""
    try:
        img = Image.open(path)
        if img.mode not in ('RGB',):
            img = img.convert('RGB')
        if img.width > max_w:
            ratio = max_w / img.width
            img = img.resize((max_w, int(img.height * ratio)), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=calidad, optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode()
        return f'data:image/jpeg;base64,{b64}'
    except Exception as e:
        print(f"  ⚠️  Error imagen {path.name}: {e}")
        return None


def nivel_alerta(dias):
    if dias <= 0:  return 'VENCIDO'
    if dias <= 7:  return 'CRITICO'
    if dias <= 14: return 'ALERTA'
    if dias <= 30: return 'ADVERTENCIA'
    return 'OK'


def descuento_caducidad(dias):
    """Descuento automático según días restantes."""
    if dias <= 0:  return 0
    if dias <= 7:  return 55
    if dias <= 14: return 40
    if dias <= 30: return 25
    return 0


def calcular_mb(data, min_soporte=5):
    """Market Basket Analysis — encuentra qué productos se compran juntos."""
    data = data.copy()
    data['cesta'] = (data['Nombre del Cliente'] + '_' +
                     data['f_compra'].dt.to_period('M').astype(str))
    baskets = data.groupby('cesta')['Producto'].apply(list).to_dict()

    pc, sc = Counter(), Counter()
    for prods in baskets.values():
        u = list(set(prods))
        sc.update(u)
        for i in range(len(u)):
            for j in range(i + 1, len(u)):
                pc[tuple(sorted([u[i], u[j]]))] += 1

    total = len(baskets)
    reglas = []
    for (a, b), cnt in pc.items():
        if cnt < min_soporte:
            continue
        conf_ab = cnt / sc[a]
        lift = conf_ab / (sc[b] / total)
        cat_a = data[data['Producto'] == a]['Categoría'].mode()
        cat_b = data[data['Producto'] == b]['Categoría'].mode()
        reglas.append({
            'a': a, 'b': b,
            'cat_a': cat_a[0] if len(cat_a) else '',
            'cat_b': cat_b[0] if len(cat_b) else '',
            'freq': cnt,
            'conf_ab': round(conf_ab * 100, 1),
            'conf_ba': round(cnt / sc[b] * 100, 1),
            'lift': round(lift, 2)
        })
    return sorted(reglas, key=lambda x: -x['lift'])[:200]


def calcular_ventas(data):
    """Agrega ventas por categoría, tendencia mensual y top productos."""
    cats = (data.groupby('Categoría')
            .agg(ventas=('Ventas Netas', 'sum'),
                 ganancia=('Ganancia', 'sum'),
                 qty=('Cantidad', 'sum'))
            .reset_index()
            .rename(columns={'Categoría': 'cat'}))

    top = (data.groupby(['Producto', 'Marca'])
           .agg(ganancia=('Ganancia', 'sum'),
                ventas=('Ventas Netas', 'sum'),
                qty=('Cantidad', 'sum'))
           .reset_index()
           .sort_values('ganancia', ascending=False)
           .head(20)
           .rename(columns={'Producto': 'prod', 'Marca': 'marca'}))

    data2 = data.copy()
    data2['mes'] = data2['f_compra'].dt.to_period('M').astype(str)
    tend = (data2.groupby('mes')
            .agg(ventas=('Ventas Netas', 'sum'), ganancia=('Ganancia', 'sum'))
            .reset_index())

    return {
        'kpis': {
            'ventas_total':   round(data['Ventas Netas'].sum(), 2),
            'ganancia_total': round(data['Ganancia'].sum(), 2),
            'n_pedidos':      len(data),
            'n_clientes':     data['Nombre del Cliente'].nunique(),
        },
        'ventas_cat':  cats.to_dict('records'),
        'top_prods':   top.to_dict('records'),
        'tendencia':   [r for r in tend.to_dict('records') if r['ventas'] > 0],
    }


# ── PROCESO PRINCIPAL ─────────────────────────────────────────────────────────

def main():
    print()
    print("═" * 52)
    print("  RESCAT — Actualización automática")
    print(f"  {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("═" * 52)

    # ── 1. LEER EXCEL ─────────────────────────────────────────────────────────
    print("\n📊 Leyendo Excel...")
    if not EXCEL.exists():
        print(f"  ❌ No encontré {EXCEL.name} en esta carpeta")
        return

    df_s = pd.read_excel(EXCEL, sheet_name=HOJA_STOCK)
    df_s.columns = [str(c).replace('\n', ' ').strip() for c in df_s.columns]
    df_v = pd.read_excel(EXCEL, sheet_name=HOJA_VENTAS)
    df_v.columns = [str(c).replace('\n', ' ').strip() for c in df_v.columns]
    df_v['f_compra'] = pd.to_datetime(df_v['Día de Compra  (Fecha Pedido)'])

    prods_excel = set(df_s['Producto'].unique())
    print(f"  ✓ {len(prods_excel)} productos · {len(df_s)} lotes · {len(df_v)} ventas")

    # ── 2. PROCESAR IMÁGENES ──────────────────────────────────────────────────
    print("\n🖼️  Procesando imágenes...")

    # Productos
    IMGS_PRODS = {}
    if DIR_PRODUCTOS.exists():
        sin_imagen = []
        for f in DIR_PRODUCTOS.iterdir():
            if f.is_file() and f.stem in prods_excel:
                b = comprimir_imagen(f, 500, 76)
                if b:
                    IMGS_PRODS[f.stem] = b
        # Detectar productos sin imagen
        sin_imagen = [p for p in prods_excel if p not in IMGS_PRODS]
        print(f"  ✓ {len(IMGS_PRODS)} imágenes de productos")
        if sin_imagen:
            print(f"  ⚠️  Sin imagen ({len(sin_imagen)}):")
            for p in sin_imagen:
                print(f"      - {p}")
            print(f"     → Agrega '{sin_imagen[0]}.jpg' en la carpeta 'Imágenes productos'")

    # Cajas
    IMGS_CAJAS = {}
    if DIR_CAJAS.exists():
        for f in DIR_CAJAS.iterdir():
            if f.is_file():
                key = f.stem.lower().replace(' ', '_')
                b = comprimir_imagen(f, 700, 80)
                if b:
                    IMGS_CAJAS[key] = b
        print(f"  ✓ {len(IMGS_CAJAS)} imágenes de cajas")

    # Iconos
    IMGS_ICONOS = {}
    ICO_MAP = {
        'icono dashboard': 'dashboard', 'icono despensa': 'despensa',
        'icono regalo': 'regalo', 'ícono cesta de compra': 'cesta',
        'ícono mini market': 'mini_market', 'ícono ofertas': 'ofertas',
        'ícono productos top': 'top_productos', 'ícono trazabilidad': 'trazabilidad',
        'ícono ventas': 'ventas',
    }
    # Buscar iconos en varias carpetas posibles
    for posible in [DIR_ICONOS, BASE/'Íconos', BASE/'iconos', BASE/'╓conos']:
        if posible.exists():
            for f in posible.iterdir():
                if f.is_file():
                    key = ICO_MAP.get(f.stem)
                    if key:
                        b = comprimir_imagen(f, 48, 90)
                        if b:
                            IMGS_ICONOS[key] = b
            break
    # Tiendas
    for stem, key in [('Mini Market Juanita', 'tienda_juanita'),
                      ('Despensa Doña María', 'tienda_maria')]:
        f = DIR_PRODUCTOS / f'{stem}.jfif'
        if not f.exists():
            f = DIR_PRODUCTOS / f'{stem}.jpg'
        if f.exists():
            b = comprimir_imagen(f, 200, 85)
            if b:
                IMGS_ICONOS[key] = b
    print(f"  ✓ {len(IMGS_ICONOS)} iconos")

    # ── 3. PROCESAR STOCK ────────────────────────────────────────────────────
    print("\n📦 Procesando stock...")

    df_s['f_cad'] = pd.to_datetime(df_s['Fecha de Caducidad'])
    df_s['f_ing'] = pd.to_datetime(df_s['Fecha de Ingreso a Inventario'])
    df_s['dias']  = (df_s['f_cad'] - HOY).dt.days
    df_s['nivel'] = df_s['dias'].apply(nivel_alerta)
    df_s['desc_cad'] = df_s['dias'].apply(descuento_caducidad)

    # Usar Precio Final del Excel como precio de venta
    if 'Precio Final' in df_s.columns:
        df_s['precio_venta'] = df_s['Precio Final']
    else:
        # Si no tiene columna de precio final, calcular desde costo con margen del 30%
        df_s['precio_venta'] = (df_s['Costo Unitario'] * 1.30).round(2)
        print("  ⚠️  No encontré 'Precio Final' — usando Costo × 1.30")

    df_s['precio_r'] = (df_s['precio_venta'] * (1 - df_s['desc_cad'] / 100)).round(2)

    marcas = (df_s[['Producto', 'Marca']].drop_duplicates()
              .set_index('Producto')['Marca'].to_dict())

    stock = []
    for _, r in df_s.iterrows():
        stock.append({
            'id':           str(r.get('ID Lote', '')),
            'tienda':       r['Tienda (Ubicación)'],
            'cat':          r['Categoría'],
            'subcat':       r['Subcategoría'],
            'prod':         r['Producto'],
            'marca':        str(marcas.get(r['Producto'], '')),
            'f_ing':        str(r['f_ing'])[:10],
            'f_cad':        str(r['f_cad'])[:10],
            'dias':         int(r['dias']),
            'qty':          int(r['Cantidad en Stock']),
            'costo':        float(r['Costo Unitario']),
            'precio_venta': float(r['precio_venta']),
            'valor':        float(r['Valor Total Inventario']),
            'nivel':        r['nivel'],
            'desc':         int(r['desc_cad']),
            'precio_r':     float(r['precio_r']),
        })

    kpis_stock = {
        'valor_total':      round(df_s['Valor Total Inventario'].sum(), 2),
        'n_lotes':          len(df_s),
        'criticos':         int((df_s['nivel'] == 'CRITICO').sum()),
        'en_alerta':        int((df_s['nivel'] == 'ALERTA').sum()),
        'advertencia':      int((df_s['nivel'] == 'ADVERTENCIA').sum()),
        'ok':               int((df_s['nivel'] == 'OK').sum()),
        'valor_riesgo_7d':  round(df_s[df_s['dias'].between(1, 7)]['Valor Total Inventario'].sum(), 2),
        'valor_riesgo_30d': round(df_s[df_s['dias'].between(1, 30)]['Valor Total Inventario'].sum(), 2),
        'qty_riesgo_30d':   int(df_s[df_s['dias'].between(1, 30)]['Cantidad en Stock'].sum()),
    }

    print(f"  ✓ {len(stock)} lotes · {kpis_stock['criticos']} críticos · {kpis_stock['en_alerta']} en alerta")

    # ── 4. PROCESAR VENTAS + MBA ──────────────────────────────────────────────
    print("\n📈 Procesando ventas y análisis de cesta...")

    jua = df_v[df_v['Tienda (Vendedor)'] == 'Mini Market Juanita']
    mar = df_v[df_v['Tienda (Vendedor)'] == 'Despensa Doña María']

    MB_DATA = {
        'todas':   calcular_mb(df_v, 8),
        'juanita': calcular_mb(jua, 5),
        'maria':   calcular_mb(mar, 5),
    }
    VENTAS_DATA = {
        'todas':   calcular_ventas(df_v),
        'juanita': calcular_ventas(jua),
        'maria':   calcular_ventas(mar),
    }
    print(f"  ✓ {len(MB_DATA['todas'])} reglas MBA · ventas ${kpis_stock['valor_total']:,.0f}")

    # ── 5. CATÁLOGO ───────────────────────────────────────────────────────────
    prods_unicos = {}
    for s in stock:
        p = s['prod']
        if p not in prods_unicos:
            prods_unicos[p] = {
                'prod': p, 'cat': s['cat'], 'subcat': s['subcat'],
                'costo': s['costo'], 'precio_venta': s['precio_venta'],
                'marca': s['marca'], 'tienda_jua': False, 'tienda_mar': False,
            }
        if 'Juanita' in s['tienda']:
            prods_unicos[p]['tienda_jua'] = True
        else:
            prods_unicos[p]['tienda_mar'] = True

    # ── 6. CAJAS SORPRESA ─────────────────────────────────────────────────────
    cajas = []
    for tienda_n in ['Mini Market Juanita', 'Despensa Doña María']:
        # Stock urgente de esta tienda
        st = {}
        for s in stock:
            if (s['tienda'] == tienda_n and s['dias'] > 0 and s['dias'] <= 14):
                if s['prod'] not in st or s['dias'] < st[s['prod']]['dias']:
                    st[s['prod']] = s

        for cd in COMBOS_CAJAS:
            pd_list = []
            ok = True
            for p in cd['prods']:
                if p not in st:
                    ok = False
                    break
                pd_list.append(st[p])
            if not ok:
                continue
            n = min(p['qty'] for p in pd_list)
            if n < 1:
                continue
            po = sum(p['precio_venta'] for p in pd_list)
            pr = sum(p['precio_r'] for p in pd_list)
            cajas.append({
                'id':     cd['id'] + '_' + ('jua' if 'Juanita' in tienda_n else 'mar'),
                'nombre': cd['nom'], 'emoji': cd['emoji'],
                'tipo':   cd['tipo'], 'img': cd['img'],
                'tienda': tienda_n,
                'prods':  [{'prod': p['prod'], 'marca': p['marca'], 'dias': p['dias'],
                             'costo': round(p['precio_venta'], 2),
                             'precio_r': round(p['precio_r'], 2), 'cat': p['cat']}
                           for p in pd_list],
                'precio_orig':    round(po, 2),
                'precio_r':       round(pr, 2),
                'desc':           round((1 - pr / po) * 100) if po > 0 else 0,
                'dias_min':       min(p['dias'] for p in pd_list),
                'n_disponibles':  min(n, 20),
            })
    print(f"  ✓ {len(cajas)} cajas sorpresa generadas")

    # ── 7. ESCRIBIR ARCHIVOS JS ───────────────────────────────────────────────
    print("\n💾 Generando archivos JS...")

    DATA = {
        'kpis_stock':  kpis_stock,
        'kpis_ventas': VENTAS_DATA['todas']['kpis'],
        'stock':       stock,
        'productos':   sorted(list(prods_unicos.keys())),
    }

    js_data  = f"const MB_DATA={json.dumps(MB_DATA, ensure_ascii=False, default=str)};\n"
    js_data += f"const VENTAS_DATA={json.dumps(VENTAS_DATA, ensure_ascii=False, default=str)};\n"
    js_data += f"const DATA={json.dumps(DATA, ensure_ascii=False, default=str)};\n"

    js_store  = f"const CAJAS_V2={json.dumps(cajas, ensure_ascii=False)};\n"
    js_store += f"const CATALOGO={json.dumps(list(prods_unicos.values()), ensure_ascii=False)};\n"
    js_store += "const PROD_IMG_MAP=null;\n"  # nombres 1:1 con imágenes

    js_imgs  = f"const IMGS_PRODS={json.dumps(IMGS_PRODS, ensure_ascii=False)};\n"
    js_imgs += f"const IMGS_CAJAS={json.dumps(IMGS_CAJAS, ensure_ascii=False)};\n"
    js_imgs += f"const IMGS_ICONOS={json.dumps(IMGS_ICONOS, ensure_ascii=False)};\n"

    (BASE / 'rescat_data.js').write_text(js_data, encoding='utf-8')
    (BASE / 'rescat_store.js').write_text(js_store, encoding='utf-8')
    (BASE / 'rescat_images.js').write_text(js_imgs, encoding='utf-8')

    print(f"  ✓ rescat_data.js   ({len(js_data)//1024} KB)")
    print(f"  ✓ rescat_store.js  ({len(js_store)//1024} KB)")
    print(f"  ✓ rescat_images.js ({len(js_imgs)//1024} KB)")

    print()
    print("═" * 52)
    print("  ✅ ¡Actualización completada!")
    print("  Recarga el navegador para ver los cambios.")
    print("═" * 52)
    print()


if __name__ == '__main__':
    main()
    input("Presiona Enter para cerrar...")
