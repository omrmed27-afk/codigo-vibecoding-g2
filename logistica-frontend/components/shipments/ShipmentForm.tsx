'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import type { AxiosError } from 'axios'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCreateShipment, useUpdateShipment, useAssignTransport, useShipmentList } from '@/hooks/shipments/use-shipments'
import { useCustomerList } from '@/hooks/customers/use-customers'
import { useWarehouseList } from '@/hooks/warehouses/use-warehouses'
import { useProductList } from '@/hooks/products/use-products'
import { useTransportList } from '@/hooks/transport/use-transport'
import { useRouteList } from '@/hooks/routes/use-routes'
import type { Shipment } from '@/types/shipments'
import type { Product } from '@/types/products'
import type { ApiError } from '@/types/api'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

const productItemSchema = z.object({
  product: z.number(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

const createSchema = z.object({
  customer: z.number({ error: 'Customer is required' }),
  origin_warehouse: z.number({ error: 'Origin warehouse is required' }),
  destination_address: z
    .string()
    .min(1, 'Destination address is required')
    .max(500),
  destination_city: z
    .string()
    .min(1, 'Destination city is required')
    .max(100),
  destination_country: z
    .string()
    .min(1, 'Destination country is required')
    .max(100),
  scheduled_delivery_date: z
    .string()
    .min(1, 'Scheduled delivery date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
    .refine((val) => val >= today, { message: 'Delivery date cannot be in the past' }),
  weight_kg: z
    .string()
    .min(1, 'Weight is required')
    .regex(/^\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' }),
  notes: z.string().nullable().optional(),
  products: z
    .array(productItemSchema)
    .min(1, { message: 'At least one product is required' }),
})

const editSchema = z.object({
  destination_address: z
    .string()
    .min(1, 'Destination address is required')
    .max(500),
  destination_city: z
    .string()
    .min(1, 'Destination city is required')
    .max(100),
  destination_country: z
    .string()
    .min(1, 'Destination country is required')
    .max(100),
  scheduled_delivery_date: z
    .string()
    .min(1, 'Scheduled delivery date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
    .refine((val) => val >= today, { message: 'Delivery date cannot be in the past' }),
  weight_kg: z
    .string()
    .min(1, 'Weight is required')
    .regex(/^\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' }),
  notes: z.string().nullable().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>
type EditFormValues = z.infer<typeof editSchema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Shipment
  onSuccess: () => void
}

// ─── ProductCombobox ──────────────────────────────────────────────────────────

interface SelectedProduct {
  id: number
  name: string
  sku: string
  unit_price: string
  quantity: number
  stock_quantity: number
}

interface ProductComboboxProps {
  selectedProducts: SelectedProduct[]
  onAdd: (product: Product) => void
  onRemove: (productId: number) => void
  onQuantityChange: (productId: number, quantity: number) => void
  committedQuantities: Map<number, number>
  error?: string
}

function ProductCombobox({
  selectedProducts,
  onAdd,
  onRemove,
  onQuantityChange,
  committedQuantities,
  error,
}: ProductComboboxProps) {
  function effectiveStock(productId: number, stockQty: number): number {
    return Math.max(0, stockQty - (committedQuantities.get(productId) ?? 0))
  }
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useProductList({
    search: debouncedSearch || undefined,
    page: 1,
  })

  const searchResults = data?.results ?? []
  const selectedIds = new Set(selectedProducts.map((p) => p.id))

  function handleSearchChange(value: string) {
    setSearch(value)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }

  function handleSelect(product: Product) {
    if (!selectedIds.has(product.id)) {
      onAdd(product)
    }
    setSearch('')
    setDebouncedSearch('')
    setOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search products by name or SKU…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        {open && (search || searchResults.length > 0) && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 flex justify-center">
                <LoadingSpinner className="w-4 h-4" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No products found</div>
            ) : (
              searchResults.map((product) => {
                const isSelected = selectedIds.has(product.id)
                const avail = effectiveStock(product.id, product.stock_quantity)
                const noStock = avail === 0
                const committed = committedQuantities.get(product.id) ?? 0
                const disabled = isSelected || noStock
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(product)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      disabled ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <span className="ml-2 text-xs text-gray-400 font-mono">{product.sku}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">${product.unit_price}</span>
                      <span className={noStock ? 'text-red-500 font-medium' : 'text-gray-400'}>
                        Disp: {avail}
                        {committed > 0 && ` (${product.stock_quantity} total − ${committed} en pedidos)`}
                      </span>
                      {isSelected && (
                        <span className="text-green-600 font-medium">Agregado</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Unit Price
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {selectedProducts.map((sp) => {
                const avail = effectiveStock(sp.id, sp.stock_quantity)
                const committed = committedQuantities.get(sp.id) ?? 0
                const overLimit = sp.quantity > avail
                const atLimit = sp.quantity === avail && avail > 0
                return (
                  <tr key={sp.id} className={overLimit ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2">
                      <p className="text-gray-900 font-medium">{sp.name}</p>
                      <p className={`text-xs mt-0.5 ${overLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        Disponible: {avail}
                        {committed > 0 && ` (${sp.stock_quantity} − ${committed} en pedidos activos)`}
                        {overLimit && ' — ¡excede stock disponible!'}
                        {atLimit && ' — máximo'}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-mono text-xs">{sp.sku}</td>
                    <td className="px-3 py-2 text-right text-gray-700">${sp.unit_price}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        max={avail}
                        value={sp.quantity === 0 ? '' : sp.quantity}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === '') {
                            onQuantityChange(sp.id, 0)
                          } else {
                            const val = parseInt(raw, 10)
                            if (!isNaN(val)) {
                              onQuantityChange(sp.id, Math.min(val, avail))
                            }
                          }
                        }}
                        className={`w-16 px-2 py-1 text-sm text-center border rounded focus:outline-none focus:ring-1 ${
                          overLimit
                            ? 'border-red-400 focus:ring-red-400'
                            : 'border-gray-300 focus:ring-gray-400'
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(sp.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}

// ─── Main ShipmentForm ────────────────────────────────────────────────────────

export default function ShipmentForm({ mode, defaultValues, onSuccess }: Props) {
  const createShipment = useCreateShipment()
  const updateShipment = useUpdateShipment()
  const assignTransport = useAssignTransport()

  const isPending =
    mode === 'create'
      ? createShipment.isPending || assignTransport.isPending
      : updateShipment.isPending

  // ── Customer search state (create mode) ──────────────────────────
  const [customerSearch, setCustomerSearch] = useState('')
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [selectedCustomerName, setSelectedCustomerName] = useState(
    defaultValues?.customer?.name ?? ''
  )
  const customerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const customerContainerRef = useRef<HTMLDivElement>(null)

  const { data: customerData, isLoading: customerLoading } = useCustomerList({
    search: debouncedCustomerSearch || undefined,
    page: 1,
  })

  // ── Active shipments to compute committed stock ──────────────────
  const pendingShipments = useShipmentList({ status: 'pending', page: 1 })
  const pickedUpShipments = useShipmentList({ status: 'picked_up', page: 1 })
  const inTransitShipments = useShipmentList({ status: 'in_transit', page: 1 })

  const committedMap = useMemo(() => {
    const map = new Map<number, number>()
    const all = [
      ...(pendingShipments.data?.results ?? []),
      ...(pickedUpShipments.data?.results ?? []),
      ...(inTransitShipments.data?.results ?? []),
    ]
    for (const shipment of all) {
      for (const sp of (shipment.shipment_products ?? [])) {
        map.set(sp.product.id, (map.get(sp.product.id) ?? 0) + sp.quantity)
      }
    }
    return map
  }, [pendingShipments.data, pickedUpShipments.data, inTransitShipments.data])

  // ── Warehouse data (create mode) ─────────────────────────────────
  const { data: warehouseData } = useWarehouseList({ is_active: true })

  // ── Selected products state (create mode) ────────────────────────
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])

  // ── Transport & Route optional state (create mode) ───────────────
  const [selectedTransportId, setSelectedTransportId] = useState<number | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null)

  const { data: transportData } = useTransportList({ status: 'available' })
  const { data: routeData } = useRouteList({ status: 'active' })
  const availableTransports = transportData?.results ?? []
  const activeRoutes = routeData?.results ?? []

  // ── Create mode form ─────────────────────────────────────────────
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema) as Resolver<CreateFormValues>,
    defaultValues: {
      customer: undefined,
      origin_warehouse: undefined,
      destination_address: '',
      destination_city: '',
      destination_country: '',
      scheduled_delivery_date: '',
      weight_kg: '',
      notes: '',
      products: [],
    },
  })

  const { fields: createProductFields, replace: replaceCreateProducts } = useFieldArray({
    control: createForm.control,
    name: 'products',
  })
  void createProductFields // referenced to avoid lint warning

  // ── Edit mode form ───────────────────────────────────────────────
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema) as Resolver<EditFormValues>,
    defaultValues: {
      destination_address: defaultValues?.destination_address ?? '',
      destination_city: defaultValues?.destination_city ?? '',
      destination_country: defaultValues?.destination_country ?? '',
      scheduled_delivery_date: defaultValues?.scheduled_delivery_date ?? '',
      weight_kg: defaultValues?.weight_kg ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  useEffect(() => {
    if (defaultValues && mode === 'edit') {
      editForm.reset({
        destination_address: defaultValues.destination_address,
        destination_city: defaultValues.destination_city,
        destination_country: defaultValues.destination_country,
        scheduled_delivery_date: defaultValues.scheduled_delivery_date,
        weight_kg: defaultValues.weight_kg,
        notes: defaultValues.notes ?? '',
      })
    }
  }, [defaultValues, editForm, mode])

  // Customer combobox outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        customerContainerRef.current &&
        !customerContainerRef.current.contains(e.target as Node)
      ) {
        setCustomerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleCustomerSearchChange(value: string) {
    setCustomerSearch(value)
    setSelectedCustomerName('')
    createForm.setValue('customer', undefined as unknown as number)
    setCustomerOpen(true)
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current)
    customerDebounceRef.current = setTimeout(() => {
      setDebouncedCustomerSearch(value)
    }, 300)
  }

  function handleCustomerSelect(customerId: number, customerName: string) {
    createForm.setValue('customer', customerId)
    createForm.clearErrors('customer')
    setSelectedCustomerName(customerName)
    setCustomerSearch('')
    setDebouncedCustomerSearch('')
    setCustomerOpen(false)
  }

  // Sync selected products with form field array
  const syncProducts = useCallback(
    (products: SelectedProduct[]) => {
      replaceCreateProducts(
        products.map((p) => ({ product: p.id, quantity: p.quantity }))
      )
      if (products.length > 0) {
        createForm.clearErrors('products')
      }
    },
    [replaceCreateProducts, createForm]
  )

  function handleAddProduct(product: Product) {
    const avail = Math.max(0, product.stock_quantity - (committedMap.get(product.id) ?? 0))
    setSelectedProducts((prev) => {
      const next = [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: product.unit_price,
          quantity: Math.min(1, avail),
          stock_quantity: product.stock_quantity,
        },
      ]
      syncProducts(next)
      return next
    })
  }

  function handleRemoveProduct(productId: number) {
    setSelectedProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId)
      syncProducts(next)
      return next
    })
  }

  function handleQuantityChange(productId: number, quantity: number) {
    setSelectedProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, quantity } : p
      )
      syncProducts(next)
      return next
    })
  }

  function handleFieldErrors(error: unknown, form: typeof createForm | typeof editForm) {
    const axiosError = error as AxiosError<ApiError>
    const details = axiosError.response?.data?.error?.details
    if (details) {
      for (const [field, messages] of Object.entries(details)) {
        const message = Array.isArray(messages) ? messages[0] : String(messages)
        form.setError(field as never, { message })
      }
    }
  }

  // ── Submit handlers ─────────────────────────────────────────────

  function onCreateSubmit(values: CreateFormValues) {
    // Validate against effective stock (physical - already committed in active shipments)
    const overStock = selectedProducts.filter((p) => {
      const avail = Math.max(0, p.stock_quantity - (committedMap.get(p.id) ?? 0))
      return p.quantity > avail
    })
    if (overStock.length > 0) {
      createForm.setError('products', {
        message: `Cantidad excede el stock disponible (descontando pedidos activos) para: ${overStock.map((p) => p.name).join(', ')}`,
      })
      return
    }

    const body = {
      customer: values.customer,
      origin_warehouse: values.origin_warehouse,
      destination_address: values.destination_address,
      destination_city: values.destination_city,
      destination_country: values.destination_country,
      scheduled_delivery_date: values.scheduled_delivery_date,
      weight_kg: values.weight_kg,
      notes: values.notes || null,
      products: values.products,
    }

    createShipment.mutate(body, {
      onSuccess: (shipment) => {
        if (selectedTransportId !== null) {
          assignTransport.mutate(
            {
              id: shipment.id,
              body: {
                transport_id: selectedTransportId,
                ...(selectedRouteId !== null ? { route_id: selectedRouteId } : {}),
              },
            },
            {
              onSuccess,
              onError: () => onSuccess(),
            }
          )
        } else {
          onSuccess()
        }
      },
      onError: (error) => handleFieldErrors(error, createForm),
    })
  }

  function onEditSubmit(values: EditFormValues) {
    if (!defaultValues?.id) return

    const body = {
      destination_address: values.destination_address,
      destination_city: values.destination_city,
      destination_country: values.destination_country,
      scheduled_delivery_date: values.scheduled_delivery_date,
      weight_kg: values.weight_kg,
      notes: values.notes || null,
    }

    updateShipment.mutate(
      { id: defaultValues.id, body },
      {
        onSuccess,
        onError: (error) => handleFieldErrors(error, editForm),
      }
    )
  }

  const warehouses = warehouseData?.results ?? []
  const customers = customerData?.results ?? []

  // ─── Shared editable fields renderer ────────────────────────────────────────
  function renderEditableFields(form: typeof createForm | typeof editForm) {
    return (
      <>
        <FormField
          control={form.control as typeof createForm.control}
          name="destination_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination Address</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g. 456 Business Blvd" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control as typeof createForm.control}
            name="destination_city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination City</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. Boston" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as typeof createForm.control}
            name="destination_country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination Country</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. USA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control as typeof createForm.control}
            name="scheduled_delivery_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Delivery Date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha de entrega"
                    minDate={new Date()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as typeof createForm.control}
            name="weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="0.000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control as typeof createForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Notes{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or instructions…"
                  rows={3}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    )
  }

  // ─── Create mode render ──────────────────────────────────────────────────────

  if (mode === 'create') {
    return (
      <Form {...createForm}>
        <form
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          className="space-y-6 max-w-2xl"
        >
          {/* Customer combobox */}
          <FormField
            control={createForm.control}
            name="customer"
            render={() => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <FormControl>
                  <div ref={customerContainerRef} className="relative">
                    <input
                      type="text"
                      value={selectedCustomerName || customerSearch}
                      onChange={(e) => handleCustomerSearchChange(e.target.value)}
                      onFocus={() => setCustomerOpen(true)}
                      placeholder="Search customer by name or email…"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    {customerOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {customerLoading ? (
                          <div className="p-3 flex justify-center">
                            <LoadingSpinner className="w-4 h-4" />
                          </div>
                        ) : customers.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No customers found
                          </div>
                        ) : (
                          customers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleCustomerSelect(c.id, c.name)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-medium text-gray-900">{c.name}</span>
                              <span className="ml-2 text-xs text-gray-400">{c.email}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Origin Warehouse */}
          <FormField
            control={createForm.control}
            name="origin_warehouse"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Origin Warehouse</FormLabel>
                  <Select
                    value={field.value !== undefined ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name} — {w.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          {renderEditableFields(createForm)}

          {/* Products */}
          <FormField
            control={createForm.control}
            name="products"
            render={() => (
              <FormItem>
                <FormLabel>Products</FormLabel>
                <FormControl>
                  <ProductCombobox
                    selectedProducts={selectedProducts}
                    onAdd={handleAddProduct}
                    onRemove={handleRemoveProduct}
                    onQuantityChange={handleQuantityChange}
                    committedQuantities={committedMap}
                    error={createForm.formState.errors.products?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Transport — optional */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Transporte{' '}
              <span className="text-gray-400 font-normal">(opcional — al asignar, el envío pasa a &quot;Recogido&quot;)</span>
            </p>
            <Select
              value={selectedTransportId !== null ? String(selectedTransportId) : ''}
              onValueChange={(val) => {
                setSelectedTransportId(val ? Number(val) : null)
                if (!val) setSelectedRouteId(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar transporte disponible" />
              </SelectTrigger>
              <SelectContent>
                {availableTransports.length === 0 ? (
                  <SelectItem value="__no_transport__" disabled>Sin vehículos disponibles</SelectItem>
                ) : (
                  availableTransports.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} — {t.plate_number}
                      {t.driver ? ` (Conductor: ${t.driver.license_number})` : ' (Sin conductor)'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedTransportId !== null && (
              <button
                type="button"
                onClick={() => { setSelectedTransportId(null); setSelectedRouteId(null) }}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
              >
                Quitar transporte
              </button>
            )}
          </div>

          {/* Route — optional */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Ruta{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </p>
            <Select
              value={selectedRouteId !== null ? String(selectedRouteId) : ''}
              onValueChange={(val) => setSelectedRouteId(val ? Number(val) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ruta activa" />
              </SelectTrigger>
              <SelectContent>
                {activeRoutes.length === 0 ? (
                  <SelectItem value="__no_route__" disabled>Sin rutas activas</SelectItem>
                ) : (
                  activeRoutes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedRouteId !== null && (
              <button
                type="button"
                onClick={() => setSelectedRouteId(null)}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
              >
                Quitar ruta
              </button>
            )}
          </div>

          {/* Cost Estimator */}
          {selectedProducts.length > 0 && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-indigo-900">Resumen antes de crear</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-indigo-700">Productos</dt>
                  <dd className="font-medium text-indigo-900">{selectedProducts.length} ítem(s)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-indigo-700">Valor total productos</dt>
                  <dd className="font-medium text-indigo-900">
                    ${selectedProducts
                      .reduce((acc, p) => acc + parseFloat(p.unit_price || '0') * p.quantity, 0)
                      .toFixed(2)}
                  </dd>
                </div>
                {createForm.watch('weight_kg') && parseFloat(createForm.watch('weight_kg')) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-indigo-700">Peso declarado</dt>
                    <dd className="font-medium text-indigo-900">{createForm.watch('weight_kg')} kg</dd>
                  </div>
                )}
                {selectedTransportId !== null && (
                  <div className="flex justify-between">
                    <dt className="text-indigo-700">Transporte</dt>
                    <dd className="font-medium text-indigo-900">
                      {availableTransports.find((t) => t.id === selectedTransportId)?.name ?? '—'}
                    </dd>
                  </div>
                )}
                {selectedRouteId !== null && (
                  <div className="flex justify-between">
                    <dt className="text-indigo-700">Ruta</dt>
                    <dd className="font-medium text-indigo-900">
                      {activeRoutes.find((r) => r.id === selectedRouteId)?.name ?? '—'}
                    </dd>
                  </div>
                )}
              </dl>
              {createForm.watch('weight_kg') && parseFloat(createForm.watch('weight_kg')) > 0 && (
                <div className="flex justify-between border-t border-indigo-200 pt-2 text-sm font-semibold">
                  <dt className="text-indigo-800">Costo estimado del envío</dt>
                  <dd className="text-indigo-900">
                    ${(parseFloat(createForm.watch('weight_kg')) * 2.50).toFixed(2)}
                  </dd>
                </div>
              )}
              <p className="text-xs text-indigo-500">
                Fórmula: peso (kg) × $2.50 por kg. El costo final puede diferir tras ajustes.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending && (
                <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
              )}
              {selectedTransportId !== null ? 'Crear y Asignar Transporte' : 'Crear Envío'}
            </Button>
            <Link href="/shipments">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Form>
    )
  }

  // ─── Edit mode render ────────────────────────────────────────────────────────

  return (
    <Form {...editForm}>
      <form
        onSubmit={editForm.handleSubmit(onEditSubmit)}
        className="space-y-6 max-w-2xl"
      >
        {renderEditableFields(editForm)}

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2"
          >
            {isPending && (
              <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
            )}
            Save Changes
          </Button>
          <Link href={defaultValues ? `/shipments/${defaultValues.id}` : '/shipments'}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </Form>
  )
}
