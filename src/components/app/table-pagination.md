# TablePagination Component

A generic table pagination component for tables with RTL (Right-to-Left) support and customizable page sizes.

## Features

- ✅ **RTL Support** - Perfect for Persian/Arabic languages
- ✅ **Customizable Page Sizes** - Choose from 10, 20, 30, 40, or 50 items per page
- ✅ **Smart Page Navigation** - Shows first, last, current, and adjacent pages
- ✅ **Ellipsis for Large Page Counts** - Handles large datasets gracefully
- ✅ **Accessible** - Screen reader friendly with proper ARIA labels
- ✅ **Internationalization** - Uses next-intl for translations
- ✅ **Generic TypeScript Support** - Works with any data type

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `table` | `TanStackTable<TData>` | ✅ | - | TanStack Table instance |
| `formatNumber` | `(num: number) => string` | ✅ | - | Function to format numbers (for locale) |
| `translationKey` | `string` | ❌ | `"EHRTable"` | Translation namespace for pagination text |

## Usage

### Basic Usage

```tsx
import { TablePagination } from "@/components/app";
import { formatNumber } from "@/utils/format-numbers";

const MyComponent = () => {
  const locale = useLocale();
  
  return (
    <TablePagination
      table={table}
      formatNumber={(num) => formatNumber(num, locale)}
    />
  );
};
```

### With Custom Translation Key

```tsx
<TablePagination
  table={table}
  formatNumber={(num) => formatNumber(num, locale)}
  translationKey="MyCustomTable"
/>
```

## Translation Keys Required

The component expects the following translation keys in your translation files:

```json
{
  "pagination": {
    "showing": "نمایش {start} تا {end} از {total} مورد",
    "rowsPerPage": "تعداد در صفحه:",
    "firstPage": "صفحه اول",
    "previousPage": "صفحه قبل",
    "nextPage": "صفحه بعد",
    "lastPage": "صفحه آخر",
    "page": "صفحه {current} از {total}"
  }
}
```

## Features Explained

### Page Size Selection
- Dropdown to select items per page (10, 20, 30, 40, 50)
- Automatically updates the table's page size

### Navigation Controls
- **First Page** (⏮️) - Jump to page 1
- **Previous Page** (◀️) - Go to previous page
- **Page Numbers** - Click to jump to specific page
- **Next Page** (▶️) - Go to next page
- **Last Page** (⏭️) - Jump to last page

### Smart Page Display
- Shows first page, last page, current page, and pages around current page
- Uses ellipsis (...) for gaps in page numbers
- Handles large page counts gracefully

### RTL Support
- Uses `space-x-reverse` classes for proper RTL layout
- Navigation buttons are mirrored for RTL languages
- Text alignment follows RTL conventions

## Dependencies

- `@tanstack/react-table` - Core table functionality
- `@/components/ui/button` - Button components
- `@/components/ui/select` - Select dropdown
- `lucide-react` - Navigation icons
- `next-intl` - Internationalization

## Notes

- The component automatically handles disabled states for navigation buttons
- Page numbers are formatted using the provided `formatNumber` function
- All text content is internationalized through the translation system
- The component is fully accessible with proper ARIA labels
