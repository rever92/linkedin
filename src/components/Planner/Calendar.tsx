import { useState } from 'react';
import { Post } from '../../types/posts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface CalendarProps {
  posts: Post[];
  onPostSelect: (post: Post) => void;
  onDateSelect?: (date: Date) => void;
}

export default function Calendar({ posts, onPostSelect, onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: es });
  const calendarEnd = endOfWeek(monthEnd, { locale: es });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPostsForDay = (date: Date) => {
    return posts.filter(post => 
      post.scheduled_datetime && 
      isSameDay(new Date(post.scheduled_datetime), date)
    );
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date, dayPosts: Post[]) => {
    if (dayPosts.length > 0) return;
    
    if (onDateSelect && isSameMonth(day, currentDate)) {
      onDateSelect(day);
    }
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
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
          <div key={day} className="py-2 text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-sm">
        {days.map((day, index) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isEmpty = dayPosts.length === 0;
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[100px] p-2 relative border-t",
                index % 7 !== 6 && "border-r",
                !isCurrentMonth && [
                  "bg-muted/30",
                  "relative overflow-hidden",
                  "before:absolute before:inset-0 before:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#00000008_4px,#00000008_8px)]",
                  "dark:before:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#ffffff08_4px,#ffffff08_8px)]",
                  "pointer-events-none"
                ],
                isCurrentMonth && isEmpty && "cursor-pointer hover:bg-gray-50 group"
              )}
              onClick={() => isCurrentMonth && handleDayClick(day, dayPosts)}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full mb-1 mx-auto",
                isToday(day) && "bg-primary text-primary-foreground font-medium",
                !isCurrentMonth && "text-muted-foreground/50"
              )}>
                {format(day, 'd')}
              </div>
              
              {isCurrentMonth && isEmpty && (
                <div className="hidden group-hover:flex items-center justify-center p-2 text-xs text-muted-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Nueva publicación</span>
                </div>
              )}
              
              <div className="space-y-1">
                {isCurrentMonth && dayPosts.map((post, i) => (
                  i < 2 ? (
                    <div
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostSelect(post);
                      }}
                      className={cn(
                        "text-xs p-2 rounded-[15px] cursor-pointer truncate",
                        "bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
                      )}
                    >
                      {format(new Date(post.scheduled_datetime!), 'HH:mm')} -{' '}
                      {post.content.substring(0, 20)}...
                    </div>
                  ) : i === 2 ? (
                    <div key="more" className="text-xs text-center text-muted-foreground">
                      +{dayPosts.length - 2} más
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 