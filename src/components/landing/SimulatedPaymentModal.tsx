import { useState, type FormEvent } from 'react'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

interface PaymentOrder {
  pedidoId: number
  codigo: string
  total: number
  moneda: string
}

interface SimulatedPaymentResponse {
  estadoPago: string
  mensaje: string
}

interface SimulatedPaymentModalProps {
  paymentOrder: PaymentOrder
  paymentMethodId: 'TARJETA' | 'YAPE_PLIN'
  onClose: () => void
  onPaid: (response: SimulatedPaymentResponse) => void
}

export function SimulatedPaymentModal({
  paymentOrder,
  paymentMethodId,
  onClose,
  onPaid,
}: SimulatedPaymentModalProps) {
  const { user } = useAuth()
  const [cardNumber, setCardNumber] = useState('')
  const [expiration, setExpiration] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [documentType, setDocumentType] = useState('DNI')
  const [documentNumber, setDocumentNumber] = useState('')
  const [installments, setInstallments] = useState('1')
  const [mobileNumber, setMobileNumber] = useState('')
  const [processing, setProcessing] = useState(false)

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (processing) return

    if (!user) {
      toast.error('Tu sesión venció. Inicia sesión para continuar.')
      return
    }

    setProcessing(true)
    try {
      // Los datos del formulario se usan solo para la experiencia visual y no se envían.
      await new Promise((resolve) => window.setTimeout(resolve, 1500))
      const fakeToken = `tok_demo_${crypto.randomUUID()}`
      const firebaseToken = await user.getIdToken()

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tienda/pedidos/${paymentOrder.pedidoId}/pago`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${firebaseToken}`,
          },
          body: JSON.stringify({ token: fakeToken, paymentMethodId }),
        },
      )
      const result = await response.json().catch(() => ({})) as Partial<SimulatedPaymentResponse>

      if (!response.ok) {
        throw new Error(result.mensaje || 'No se pudo procesar el pago.')
      }
      if (result.estadoPago !== 'APROBADO') {
        throw new Error(result.mensaje || 'El pago no fue aprobado.')
      }

      onPaid({ estadoPago: result.estadoPago, mensaje: result.mensaje || 'Pago aprobado.' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar el pago.')
    } finally {
      setProcessing(false)
      setCardNumber('')
      setExpiration('')
      setCvv('')
      setCardholderName('')
      setDocumentNumber('')
      setMobileNumber('')
    }
  }

  return (
    <div className='fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm' role='dialog' aria-modal='true' aria-label='Pago con tarjeta'>
      <div className='mx-auto mt-8 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8'>
        <div className='mb-5 flex items-start justify-between gap-4'>
          <div>
            <h3 className='text-2xl font-black text-slate-950'>Pago con tarjeta</h3>
            <p className='mt-1 text-sm text-slate-600'>Pedido {paymentOrder.codigo}</p>
          </div>
          <button type='button' onClick={onClose} disabled={processing} className='rounded-full p-2 hover:bg-slate-100 disabled:opacity-50' aria-label='Cerrar pago'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
          Entorno de pruebas: no se realizará ningún cargo. No ingreses datos de una tarjeta real.
        </div>

        <form onSubmit={(event) => void submitPayment(event)} className='space-y-4'>
          {paymentMethodId === 'TARJETA' ? (
            <>
              <div className='space-y-2'>
                <Label htmlFor='sim-card-number'>Número de tarjeta</Label>
                <Input
                  id='sim-card-number'
                  autoComplete='off'
                  inputMode='numeric'
                  placeholder='1234 5678 9012 3456'
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 16))}
                  pattern='[0-9]{16}'
                  minLength={16}
                  maxLength={16}
                  required
                  disabled={processing}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='sim-cardholder-name'>Nombre del titular</Label>
                <Input
                  id='sim-cardholder-name'
                  autoComplete='off'
                  placeholder='Como aparece en la tarjeta'
                  value={cardholderName}
                  onChange={(event) => setCardholderName(event.target.value.slice(0, 100))}
                  maxLength={100}
                  required
                  disabled={processing}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='sim-card-expiration'>Vencimiento (MM/YY)</Label>
                  <Input
                    id='sim-card-expiration'
                    autoComplete='off'
                    placeholder='MM/YY'
                    value={expiration}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
                      setExpiration(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
                    }}
                    pattern='(0[1-9]|1[0-2])/[0-9]{2}'
                    maxLength={5}
                    required
                    disabled={processing}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='sim-card-cvv'>CVV</Label>
                  <Input
                    id='sim-card-cvv'
                    autoComplete='off'
                    inputMode='numeric'
                    placeholder='123'
                    value={cvv}
                    onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 3))}
                    pattern='[0-9]{3}'
                    minLength={3}
                    maxLength={3}
                    required
                    disabled={processing}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='sim-payer-email'>Correo del titular</Label>
                <Input
                  id='sim-payer-email'
                  type='email'
                  autoComplete='off'
                  placeholder='nombre@correo.com'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={150}
                  required
                  disabled={processing}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='sim-document-type'>Tipo de documento</Label>
                  <select
                    id='sim-document-type'
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    disabled={processing}
                    className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                  >
                    <option value='DNI'>DNI</option>
                    <option value='CE'>Carné de extranjería</option>
                    <option value='RUC'>RUC</option>
                  </select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='sim-document-number'>Número de documento</Label>
                  <Input
                    id='sim-document-number'
                    autoComplete='off'
                    inputMode='numeric'
                    placeholder={documentType === 'DNI' ? '8 dígitos' : 'Número de documento'}
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value.replace(/\D/g, '').slice(0, 12))}
                    minLength={documentType === 'DNI' ? 8 : 6}
                    maxLength={12}
                    required
                    disabled={processing}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='sim-installments'>Cuotas</Label>
                <select
                  id='sim-installments'
                  value={installments}
                  onChange={(event) => setInstallments(event.target.value)}
                  disabled={processing}
                  className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                >
                  <option value='1'>1 cuota sin intereses</option>
                  <option value='3'>3 cuotas</option>
                  <option value='6'>6 cuotas</option>
                  <option value='12'>12 cuotas</option>
                </select>
              </div>
            </>
          ) : (
            <div className='space-y-2'>
              <Label htmlFor='sim-mobile-number'>Número de celular asociado</Label>
              <Input
                id='sim-mobile-number'
                autoComplete='off'
                inputMode='numeric'
                placeholder='999 999 999'
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 9))}
                pattern='[0-9]{9}'
                minLength={9}
                maxLength={9}
                required
                disabled={processing}
              />
            </div>
          )}

          <div className='flex items-center justify-between border-t pt-4 text-lg'>
            <span>Total a pagar</span>
            <strong>{paymentOrder.moneda === 'PEN' ? 'S/' : paymentOrder.moneda} {paymentOrder.total.toFixed(2)}</strong>
          </div>

          <Button type='submit' disabled={processing} className='w-full bg-slate-800 py-6 text-white hover:bg-slate-700'>
            {processing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {processing ? 'Procesando...' : `Pagar ${paymentOrder.moneda === 'PEN' ? 'S/' : paymentOrder.moneda} ${paymentOrder.total.toFixed(2)}`}
          </Button>
        </form>
      </div>
    </div>
  )
}
