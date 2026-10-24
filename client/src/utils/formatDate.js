import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (dateString, formatStr = 'PPP p') => {
  if (!dateString) return '';
  return format(new Date(dateString), formatStr);
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};
