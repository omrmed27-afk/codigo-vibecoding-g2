'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useCreateProduct, useUpdateProduct } from '@/hooks/products/use-products'
import { useSupplierList } from '@/hooks/suppliers/use-suppliers'
import { useWarehouseList } from '@/hooks/warehouses/use-warehouses'
import type { Product } from '@/types/products'
import type { ApiError } from '@/types/api'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  sku: z.string().min(1, 'SKU is required').max(100),
  weight_kg: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  width_cm: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  height_cm: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  depth_cm: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  unit_price: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  stock_quantity: z
    .number({ error: 'Must be a number' })
    .int()
    .min(0, 'Stock cannot be negative'),
  supplier: z
    .number({ error: 'Supplier is required' })
    .int()
    .positive(),
  warehouse: z
    .number({ error: 'Warehouse is required' })
    .int()
    .positive(),
})

type FormValues = z.infer<typeof productSchema>

interface Props {
  mode: 'create' | 'edit'
  defaultValues?: Product
  onSuccess: () => void
}

export default function ProductForm({ mode, defaultValues, onSuccess }: Props) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const isPending =
    mode === 'create' ? createProduct.isPending : updateProduct.isPending

  const { data: suppliersData, isLoading: suppliersLoading } = useSupplierList({ page: 1 })
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouseList({ page: 1 })

  const activeWarehouses = warehousesData?.results.filter((w) => w.is_active) ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema) as Resolver<FormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      sku: defaultValues?.sku ?? '',
      weight_kg: defaultValues?.weight_kg ?? '',
      width_cm: defaultValues?.width_cm ?? '',
      height_cm: defaultValues?.height_cm ?? '',
      depth_cm: defaultValues?.depth_cm ?? '',
      unit_price: defaultValues?.unit_price ?? '',
      stock_quantity: defaultValues?.stock_quantity ?? 0,
      supplier: defaultValues?.supplier.id ?? undefined,
      warehouse: defaultValues?.warehouse.id ?? undefined,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        description: defaultValues.description ?? '',
        sku: defaultValues.sku,
        weight_kg: defaultValues.weight_kg,
        width_cm: defaultValues.width_cm,
        height_cm: defaultValues.height_cm,
        depth_cm: defaultValues.depth_cm,
        unit_price: defaultValues.unit_price,
        stock_quantity: defaultValues.stock_quantity,
        supplier: defaultValues.supplier.id,
        warehouse: defaultValues.warehouse.id,
      })
    }
  }, [defaultValues, form])

  function handleFieldErrors(error: unknown) {
    const axiosError = error as AxiosError<ApiError>
    const details = axiosError.response?.data?.error?.details
    if (details) {
      for (const [field, messages] of Object.entries(details)) {
        const message = Array.isArray(messages) ? messages[0] : String(messages)
        form.setError(field as keyof FormValues, { message })
      }
    }
  }

  function onSubmit(values: FormValues) {
    // Transform empty description string to null before sending
    const description =
      values.description === '' ||
      values.description === null ||
      values.description === undefined
        ? null
        : values.description

    const body = {
      name: values.name,
      description,
      sku: values.sku,
      weight_kg: values.weight_kg,
      width_cm: values.width_cm,
      height_cm: values.height_cm,
      depth_cm: values.depth_cm,
      unit_price: values.unit_price,
      stock_quantity: values.stock_quantity,
      supplier: values.supplier,
      warehouse: values.warehouse,
    }

    if (mode === 'create') {
      createProduct.mutate(body, {
        onSuccess,
        onError: handleFieldErrors,
      })
    } else {
      if (!defaultValues?.id) return
      updateProduct.mutate(
        { id: defaultValues.id, body },
        {
          onSuccess,
          onError: handleFieldErrors,
        }
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Row: Name + SKU */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. Laptop Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. LP-2026-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description full width */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Optional product description"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row: Unit Price + Stock Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. 1299.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row: Weight + Width */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. 1.500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="width_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width (cm)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. 35.50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row: Height + Depth */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="height_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. 23.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="depth_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Depth (cm)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="e.g. 18.50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row: Supplier + Warehouse */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select
                    disabled={suppliersLoading}
                    value={field.value !== undefined ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            suppliersLoading ? 'Loading suppliers…' : 'Select a supplier'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliersData?.results.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="warehouse"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <Select
                    disabled={warehousesLoading}
                    value={field.value !== undefined ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            warehousesLoading ? 'Loading warehouses…' : 'Select a warehouse'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeWarehouses.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        </div>

        <Button type="submit" disabled={isPending} className="flex items-center gap-2">
          {isPending && (
            <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
          )}
          {mode === 'create' ? 'Create Product' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
