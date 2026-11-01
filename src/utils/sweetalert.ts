import Swal, { SweetAlertOptions } from 'sweetalert2';

// Custom SweetAlert2 theme matching Ban Naree School branding (Emerald & Royal Navy)
const baseConfig: SweetAlertOptions = {
  customClass: {
    popup: 'rounded-3xl shadow-2xl border border-slate-100 font-sans p-6',
    title: 'text-slate-900 font-bold text-lg sm:text-xl',
    htmlContainer: 'text-slate-600 text-sm leading-relaxed mt-2',
    confirmButton: 'px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all cursor-pointer mx-1',
    cancelButton: 'px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer mx-1',
    denyButton: 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer mx-1',
  },
  buttonsStyling: false,
};

export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'success',
    iconColor: '#059669',
    title,
    text,
    confirmButtonText: 'ตกลง',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 cursor-pointer',
    },
  });
};

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'error',
    iconColor: '#e11d48',
    title,
    text,
    confirmButtonText: 'รับทราบ',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 cursor-pointer',
    },
  });
};

export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    ...baseConfig,
    icon: 'warning',
    iconColor: '#d97706',
    title,
    text,
    confirmButtonText: 'เข้าใจแล้ว',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-600/20 cursor-pointer',
    },
  });
};

export const showConfirm = async (
  title: string,
  text?: string,
  confirmButtonText = 'ยืนยัน',
  cancelButtonText = 'ยกเลิก',
  isDestructive = false
): Promise<boolean> => {
  const result = await Swal.fire({
    ...baseConfig,
    icon: isDestructive ? 'warning' : 'question',
    iconColor: isDestructive ? '#e11d48' : '#2563eb',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      ...baseConfig.customClass,
      confirmButton: isDestructive
        ? 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 cursor-pointer mx-1'
        : 'px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 cursor-pointer mx-1',
      cancelButton: 'px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer mx-1',
    },
  });
  return result.isConfirmed;
};

export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
    customClass: {
      popup: 'rounded-2xl shadow-xl border border-slate-100 bg-white font-sans text-xs px-4 py-3',
      title: 'text-slate-800 font-semibold text-xs',
    },
  });

  return Toast.fire({
    icon,
    title,
  });
};

export default Swal;
