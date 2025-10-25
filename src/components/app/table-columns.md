# Table Columns Hooks

Custom React hooks for creating table column definitions with TanStack Table. These hooks provide a convenient way to define table columns with built-in formatting and customization options.

## Hooks

### `useGenericTableColumns`

A generic hook for creating table columns with customizable configuration.

### `useEHRTableColumns`

A convenience hook specifically for ElectronicHealthRecord data with predefined columns.

## useGenericTableColumns

### Features

- ✅ **Generic TypeScript Support** - Works with any data type
- ✅ **Custom Cell Renderers** - Define custom cell content
- ✅ **Sorting Control** - Enable/disable sorting per column
- ✅ **Column Widths** - Set custom column widths
- ✅ **Action Columns** - Optional action buttons column
- ✅ **Locale Support** - Built-in locale-aware formatting

### Parameters

```typescript
useGenericTableColumns<TData>(config: {
  columns: Array<{
    key: keyof TData;
    header: string;
    cell?: (value: unknown, row: TData, locale: string) => React.ReactNode;
    enableSorting?: boolean;
    width?: string;
  }>;
  locale: string;
  actions?: {
    header: string;
    cell: (row: TData) => React.ReactNode;
  };
})
```

### Usage Example

```tsx
import { useGenericTableColumns } from "@/components/app/table-columns";

interface MyData {
  id: string;
  name: string;
  value: number;
  status: string;
}

const MyComponent = () => {
  const locale = useLocale();
  
  const columns = useGenericTableColumns({
    locale,
    columns: [
      {
        key: "name",
        header: "نام",
        enableSorting: true,
      },
      {
        key: "value",
        header: "مقدار",
        cell: (value, row, locale) => {
          return formatNumber(value as number, locale);
        },
        enableSorting: true,
      },
      {
        key: "status",
        header: "وضعیت",
        cell: (value) => (
          <Badge variant={value === "active" ? "default" : "secondary"}>
            {value as string}
          </Badge>
        ),
      },
    ],
    actions: {
      header: "عملیات",
      cell: (row) => (
        <button onClick={() => handleAction(row)}>
          مشاهده جزئیات
        </button>
      ),
    },
  });

  return <DataTable table={table} columns={columns} />;
};
```

## useEHRTableColumns

### Features

- ✅ **Predefined EHR Columns** - Ready-to-use columns for ElectronicHealthRecord
- ✅ **Persian Headers** - All headers in Persian
- ✅ **Custom Formatting** - Proper formatting for EHR data
- ✅ **Optional Actions** - Can include action buttons
- ✅ **Sorting Support** - Date column is sortable by default

### Parameters

```typescript
useEHRTableColumns(config: {
  locale: string;
  onViewDetails?: (record: ElectronicHealthRecord) => void;
  showActions?: boolean;
})
```

### Usage Example

```tsx
import { useEHRTableColumns } from "@/components/app/table-columns";

const EHRTable = () => {
  const locale = useLocale();
  
  const columns = useEHRTableColumns({
    locale,
    onViewDetails: (record) => {
      console.log("View details for:", record["نام بيمار"]);
    },
    showActions: true,
  });

  return <DataTable table={table} columns={columns} />;
};
```

### Predefined Columns

The `useEHRTableColumns` hook includes these predefined columns:

1. **نام و نام خانوادگی بیمار** - Patient full name (combines first and last name)
2. **کد ملی** - National ID
3. **تاریخ** - Date (sortable)
4. **نام خدمت** - Service name (with word wrapping)
5. **نام پزشک معالج** - Doctor name
6. **مکان** - Location
7. **نوع بیمار** - Patient type
8. **عملیات** - Actions (optional)

## Column Configuration Options

### Column Definition

```typescript
{
  key: keyof TData;                    // Data property key
  header: string;                       // Column header text
  cell?: (value, row, locale) => React.ReactNode; // Custom cell renderer
  enableSorting?: boolean;              // Enable/disable sorting (default: true)
  width?: string;                       // Column width
}
```

### Custom Cell Renderer

```tsx
{
  key: "status",
  header: "وضعیت",
  cell: (value, row, locale) => (
    <div className="flex items-center gap-2">
      <Badge variant={value === "active" ? "default" : "secondary"}>
        {value as string}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {formatDate(row.createdAt, locale)}
      </span>
    </div>
  ),
}
```

### Actions Column

```tsx
{
  actions: {
    header: "عملیات",
    cell: (row) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleEdit(row)}>
          ویرایش
        </Button>
        <Button size="sm" variant="destructive" onClick={() => handleDelete(row)}>
          حذف
        </Button>
      </div>
    ),
  },
}
```

## Dependencies

- `@tanstack/react-table` - Core table functionality
- `@/app/[locale]/(authenticated)/console/electronic-health-record/_utils/format-numbers` - Number formatting utility

## Notes

- All columns are sortable by default unless `enableSorting: false` is specified
- The `formatCellValue` function is used for default cell rendering
- Custom cell renderers receive the cell value, full row data, and locale
- Action columns are automatically added to the end of the column list
- The hooks use `React.useMemo` for performance optimization
- Uses `unknown` type for cell values to avoid unnecessary type assertions
- Only one `any` type assertion remains (necessary for TanStack Table compatibility)