export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getCategoryBadgeClass(category) {
  switch (category) {
    case 'Image':
      return 'badge-image';
    case 'Video':
      return 'badge-video';
    case 'Audio':
      return 'badge-audio';
    case 'Document':
      return 'badge-document';
    case 'Archive':
      return 'badge-archive';
    case 'Code & Data':
      return 'badge-code';
    default:
      return 'badge-other';
  }
}
