# DataTable Component

A generic data table component built on top of TanStack Table with built-in sorting capabilities and RTL support.

## Features

- ✅ **Generic TypeScript Support** - Works with any data type
- ✅ **Built-in Sorting** - Click column headers to sort data
- ✅ **RTL Support** - Perfect for Persian/Arabic languages
- ✅ **Customizable Styling** - Accepts custom CSS classes
- ✅ **No Loading/Error States** - Focuses purely on data display
- ✅ **Responsive Design** - Works on all screen sizes

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `table` | `TanStackTable<TData>` | ✅ | - | TanStack Table instance |
| `columns` | `ColumnDef<TData>[]` | ✅ | - | Column definitions |
| `noDataMessage` | `string` | ❌ | `"هیچ داده‌ای موجود نیست"` | Message shown when no data |
| `className` | `string` | ❌ | `""` | Additional CSS classes |

## Usage

### Basic Usage

```tsx
import { DataTable } from "@/components/app";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

const MyComponent = () => {
  const table = useReactTable({
    data: myData,
    columns: myColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable
      table={table}
      columns={myColumns}
      noDataMessage="هیچ رکوردی یافت نشد"
      className="max-h-[500px] overflow-auto"
    />
  );
};
```

### With Custom Styling

```tsx
<DataTable
  table={table}
  columns={columns}
  className="border-2 border-blue-200 rounded-lg shadow-lg"
  noDataMessage="داده‌ای برای نمایش وجود ندارد"
/>
```

## Dependencies

- `@tanstack/react-table` - Core table functionality
- `@/components/ui/table` - UI table components
- `lucide-react` - Sort icons
- `next-intl` - Internationalization

## Notes

- This component does not handle loading or error states - those should be managed by the parent component
- Sorting is handled automatically by TanStack Table
- The component uses RTL-friendly styling with `space-x-reverse` classes
- Sort icons are automatically displayed for sortable columns
