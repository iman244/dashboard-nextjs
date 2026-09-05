import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROW_COUNT = 5;

interface LoadingSkeletonProps {
  /**
   * Number of cells per row. Must come from the table's own column count —
   * a hardcoded list drifts out of sync and makes the table jump sideways
   * when the real rows arrive.
   */
  columnCount: number;
}

/**
 * Loading skeleton component for EHR table
 * Shows 5 skeleton rows matching the table's column count
 */
export const LoadingSkeleton = ({ columnCount }: LoadingSkeletonProps) => (
  <>
    {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columnCount }).map((_, cellIndex) => (
          <TableCell key={cellIndex}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);
