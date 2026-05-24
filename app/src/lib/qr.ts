// Server-side QR generation for printed/exported documents.
//
// Returns an inline SVG string (no <?xml?> prolog) so it can be dropped into
// dangerouslySetInnerHTML and rendered crisply at any size. Colours are pinned
// to the brand green so QRs match the rest of the invoice/receipt design.
//
// Always wrapped in a try/catch — a QR-render failure must never break the
// page it's embedded in.
import QRCode from 'qrcode'

export async function generateQrSvg(data: string): Promise<string | null> {
  try {
    return await QRCode.toString(data, {
      type: 'svg',
      margin: 0,
      width: 96,
      color: { dark: '#15803d', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch (err) {
    console.error('[qr] failed:', err)
    return null
  }
}
