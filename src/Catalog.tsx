import { useState } from 'react'
import { Carousel, Chip, ProductCard } from '@bion-mfe-ui/react'
import { PRODUCTS } from './products'
import { glyphOf, type MarqetProduct } from './types'
import './styles.css'

const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

const CATS = ['Semua', 'Audio', 'Kamera', 'Wearable'] as const
type Cat = (typeof CATS)[number]
const catOf = (icon: MarqetProduct['icon']): Exclude<Cat, 'Semua'> =>
  icon === 'camera' ? 'Kamera' : icon === 'watch' ? 'Wearable' : 'Audio'

export interface CatalogProps {
  onAddToCart: (p: MarqetProduct) => void
  query?: string
}

export function Catalog({ onAddToCart, query }: CatalogProps) {
  const [cat, setCat] = useState<Cat>('Semua')
  const q = (query ?? '').trim().toLowerCase()

  const list = PRODUCTS.filter(
    (p) =>
      (cat === 'Semua' || catOf(p.icon) === cat) &&
      (!q || `${p.brand} ${p.name}`.toLowerCase().includes(q)),
  )

  return (
    <div className="catalog">
      <section className="hero-wrap">
        <Carousel aspect="16/9" interval={5500}>
          <div className="hero-slide s1">Audio · Diskon 30%</div>
          <div className="hero-slide s2">Wearable · Koleksi baru</div>
          <div className="hero-slide s3">Kamera · Flash sale</div>
        </Carousel>
      </section>

      <div className="sec-head">
        <h2>Terlaris minggu ini</h2>
        <span className="meta">{list.length} produk</span>
      </div>

      <section className="filt">
        {CATS.map((c) => (
          <Chip key={c} value={c} active={c === cat} onSelect={() => setCat(c)}>
            {c}
          </Chip>
        ))}
        <span className="sort">Terlaris ▾</span>
      </section>

      <section className="grid">
        {list.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            brand={p.brand}
            price={rp(p.price)}
            oldPrice={p.old ? rp(p.old) : undefined}
            glyph={glyphOf(p.icon)}
            tag={p.tag ?? undefined}
            rating={p.rate}
            reviews={p.rev}
            // React → React: a plain callback up to the shell, which forwards
            // it to the Vue cart over the event bus.
            onAdd={() => onAddToCart(p)}
          />
        ))}
      </section>

      <section className="promo">
        <div>
          <h2>Gratis ongkir ke seluruh Indonesia</h2>
          <p>
            Minimal belanja Rp 300rb, berlaku untuk semua kategori hingga akhir
            bulan.
          </p>
        </div>
        <button className="pcta">Mulai belanja</button>
      </section>
    </div>
  )
}
