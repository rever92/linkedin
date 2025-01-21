import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

const Spinner = ({ className, size = 'md' }: SpinnerProps) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "animate-spin rounded-full border-t-2 border-b-2 ai-spinner",
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
};

export default Spinner;