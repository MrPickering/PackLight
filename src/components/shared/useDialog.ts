import { useEffect, useRef } from 'react';

export function useDialog(onClose: () => void) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    const focusable = () => Array.from(element?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => (focusable()[0] ?? element)?.focus());
    function keydown(event: KeyboardEvent) {
      const dialogs = document.querySelectorAll('[aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== element) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const fields = focusable();
      const first = fields[0]; const last = fields[fields.length - 1];
      if (!first) { event.preventDefault(); element?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', keydown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', keydown); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  return dialog;
}
