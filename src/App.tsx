import '@bion-mfe-ui/tokens/css'
import { Catalog } from './Catalog'
import type { MarqetProduct } from './types'

// Exposed federated React component, consumed directly by the shell.
export default function App({
  onAddToCart,
  query,
}: {
  onAddToCart: (p: MarqetProduct) => void
  query?: string
}) {
  return <Catalog onAddToCart={onAddToCart} query={query} />
}
