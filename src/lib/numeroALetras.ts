/**
 * Convierte un número decimal a su representación en letras (español, estilo SUNAT).
 * Soporta importes comerciales habituales para ventas de productos personalizados.
 *
 * Ejemplo: numeroALetras(7700.50) → "SIETE MIL SETECIENTOS CON 50/100"
 */

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const ESPECIALES = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
]
const DECENAS = [
  '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA',
  'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
]
const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS',
  'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
]

function convertirMenorMil(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'CIEN'

  const partes: string[] = []

  const centenas = Math.floor(n / 100)
  const resto = n % 100

  if (centenas > 0) partes.push(CENTENAS[centenas])

  if (resto === 0) {
    // nada
  } else if (resto < 10) {
    partes.push(UNIDADES[resto])
  } else if (resto < 20) {
    partes.push(ESPECIALES[resto - 10])
  } else if (resto === 20) {
    partes.push('VEINTE')
  } else if (resto < 30) {
    partes.push('VEINTI' + UNIDADES[resto - 20])
  } else {
    const decena = Math.floor(resto / 10)
    const unidad = resto % 10
    if (unidad === 0) {
      partes.push(DECENAS[decena])
    } else {
      partes.push(DECENAS[decena] + ' Y ' + UNIDADES[unidad])
    }
  }

  return partes.join(' ')
}

function convertirEntero(n: number): string {
  if (n === 0) return 'CERO'
  if (n === 1) return 'UNO'

  const partes: string[] = []

  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1_000)
  const resto = n % 1_000

  if (millones > 0) {
    partes.push(millones === 1 ? 'UN MILLÓN' : convertirMenorMil(millones) + ' MILLONES')
  }

  if (miles > 0) {
    partes.push(miles === 1 ? 'MIL' : convertirMenorMil(miles) + ' MIL')
  }

  if (resto > 0) {
    partes.push(convertirMenorMil(resto))
  }

  return partes.filter(Boolean).join(' ')
}

/**
 * Convierte un total numérico al formato SUNAT.
 * @param total - Número decimal, ej: 7700.50
 * @param moneda - 'SOLES' | 'DÓLARES' (por defecto 'SOLES')
 * @returns Ej: "SIETE MIL SETECIENTOS CON 50/100 SOLES"
 */
export function numeroALetras(total: number, moneda: 'SOLES' | 'DÓLARES' = 'SOLES'): string {
  if (isNaN(total) || total < 0) return 'IMPORTE NO VÁLIDO'

  // Separar parte entera y céntimos
  const entero = Math.floor(total)
  const centimos = Math.round((total - entero) * 100)

  const letrasEntero = convertirEntero(entero)
  const centimosStr = centimos.toString().padStart(2, '0')

  return `${letrasEntero} CON ${centimosStr}/100 ${moneda}`
}
