import { useMemo, useState } from 'react';
import { ContentPlanItem, Post, getPostId } from '../../types/posts';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface CalendarProps {
  posts: Post[];
  planItems?: ContentPlanItem[];
  onPostSelect: (post: Post) => void;
  onPlanItemSelect?: (item: ContentPlanItem) => void;
  onDateSelect?: (date: Date) => void;
}

type DayEntry =
  | { type: 'post'; id: string; date: Date; label: string; subtitle: string; post: Post }
  | { type: 'plan-item'; id: string; date: Date; label: string; subtitle: string; item: ContentPlanItem };

export default function Calendar({
  posts,
  planItems = [],
  onPostSelect,
  onPlanItemSelect,
  onDateSelect,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: es });
  const calendarEnd = endOfWeek(monthEnd, { locale: es });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const entries = useMemo<DayEntry[]>(() => {
    const postEntries: DayEntry[] = posts
      .filter((post) => post.scheduled_datetime)
      .map((post) => ({
        type: 'post',
        id: getPostId(post),
        date: new Date(post.scheduled_datetime as string),
        label: post.content?.slice(0, 32) || 'Publicación',
        subtitle: post.scheduled_datetime ? format(new Date(post.scheduled_datetime), 'HH:mm') : '',
        post,
      }));

    const planEntries: DayEntry[] = planItems
      .filter((item) => item.suggested_date)
      .map((item) => ({
        type: 'plan-item',
        id: getPostId(item),
        date: new Date(item.suggested_date as string),
        label: item.topic || 'Pieza del plan',
        subtitle: item.content_type || 'Plan',
        item,
      }));

    return [...postEntries, ...planEntries].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [posts, planItems]);

  const getEntriesForDay = (date: Date) =>
    entries.filter((entry) => isSameDay(entry.date, date));

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date, dayEntries: DayEntry[]) => {
    if (dayEntries.length > 0) return;
    if (onDateSelect && isSameMonth(day, currentDate)) onDateSelect(day);
  };

  return (
    <div className="bg-white border border-gray-200/50 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-[25px]">
      <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
        <h2 className="text-xl font-medium capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3 text-sm text-center text-muted-foreground bg-blue-50 border-b border-blue-100">
        Haz clic en una fecha vacía para crear una nueva publicación para ese día
      </div>

      <div className="grid grid-cols-7 text-center text-sm border-b border-border">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="py-2 text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-sm">
        {days.map((day, index) => {
          const dayEntries = getEntriesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isEmpty = dayEntries.length === 0;

          return (
            <div
              key={day.toString()}
              className={cn(
                'min-h-[120px] p-2 relative border-t',
                index % 7 !== 6 && 'border-r',
                !isCurrentMonth && [
                  'bg-muted/30',
                  'relative overflow-hidden',
                  "before:absolute before:inset-0 before:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#00000008_4px,#00000008_8px)]",
                  "dark:before:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#ffffff08_4px,#ffffff08_8px)]",
                  'pointer-events-none',
                ],
                isCurrentMonth && isEmpty && 'cursor-pointer hover:bg-gray-50 group'
              )}
              onClick={() => isCurrentMonth && handleDayClick(day, dayEntries)}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-full mb-1 mx-auto',
                  isToday(day) && 'bg-primary text-primary-foreground font-medium',
                  !isCurrentMonth && 'text-muted-foreground/50'
                )}
              >
                {format(day, 'd')}
              </div>

              {isCurrentMonth && isEmpty && (
                <div className="hidden group-hover:flex items-center justify-center p-2 text-xs text-muted-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Nueva publicación</span>
                </div>
              )}

              <div className="space-y-1">
                {isCurrentMonth &&
                  dayEntries.map((entry, i) =>
                    i < 3 ? (
                      <div
                        key={`${entry.type}-${entry.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (entry.type === 'post') onPostSelect(entry.post);
                          if (entry.type === 'plan-item' && onPlanItemSelect) onPlanItemSelect(entry.item);
                        }}
                        className={cn(
                          'text-xs p-2 rounded-[15px] cursor-pointer transition-colors border',
                          entry.type === 'post'
                            ? 'bg-primary/10 hover:bg-primary/20 border-primary/20'
                            : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {entry.type === 'plan-item' && <FileText className="w-3 h-3 shrink-0" />}
                          <span className="truncate font-medium">{entry.label}</span>
                        </div>
                        <div className="truncate opacity-80">
                          {entry.subtitle}
                        </div>
                      </div>
                    ) : i === 3 ? (
                      <div key="more" className="text-xs text-center text-muted-foreground">
                        +{dayEntries.length - 3} más
                      </div>
                    ) : null
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
