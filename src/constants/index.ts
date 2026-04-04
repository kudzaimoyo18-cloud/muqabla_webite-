import type { Country, City, Industry, ExperienceLevel, CompanySize } from '@/types';

export const countries: Country[] = [
  { code: 'AE', name: 'United Arab Emirates', name_ar: 'الإمارات العربية المتحدة' },
  { code: 'SA', name: 'Saudi Arabia', name_ar: 'السعودية' },
  { code: 'QA', name: 'Qatar', name_ar: 'قطر' },
  { code: 'KW', name: 'Kuwait', name_ar: 'الكويت' },
  { code: 'BH', name: 'Bahrain', name_ar: 'البحرين' },
  { code: 'OM', name: 'Oman', name_ar: 'عمان' },
]

export const cities: City[] = [
  { country_code: 'AE', name: 'Dubai', name_ar: 'دبي' },
  { country_code: 'AE', name: 'Abu Dhabi', name_ar: 'أبو ظبي' },
  { country_code: 'AE', name: 'Sharjah', name_ar: 'الشارقة' },
  { country_code: 'AE', name: 'Ajman', name_ar: 'عجمان' },
  { country_code: 'AE', name: 'RAK', name_ar: 'رأس الخيمة' },
  { country_code: 'AE', name: 'Fujairah', name_ar: 'الفجيرة' },
  { country_code: 'SA', name: 'Riyadh', name_ar: 'الرياض' },
  { country_code: 'SA', name: 'Jeddah', name_ar: 'جدة' },
  { country_code: 'SA', name: 'Dammam', name_ar: 'الدمام' },
  { country_code: 'SA', name: 'Mecca', name_ar: 'مكة المكرمة' },
  { country_code: 'SA', name: 'Medina', name_ar: 'المدينة المنورة' },
  { country_code: 'QA', name: 'Doha', name_ar: 'الدوحة' },
  { country_code: 'QA', name: 'Al Wakrah', name_ar: 'الوكرة' },
  { country_code: 'QA', name: 'Al Khor', name_ar: 'الخور' },
  { country_code: 'KW', name: 'Kuwait City', name_ar: 'مدينة الكويت' },
  { country_code: 'KW', name: 'Hawalli', name_ar: 'حوال' },
  { country_code: 'KW', name: 'Salmiya', name_ar: 'السالمية' },
  { country_code: 'BH', name: 'Manama', name_ar: 'المنامة' },
  { country_code: 'BH', name: 'Riffa', name_ar: 'الرفاع' },
  { country_code: 'BH', name: 'Muharraq', name_ar: 'المحرق' },
  { country_code: 'OM', name: 'Muscat', name_ar: 'مسقط' },
  { country_code: 'OM', name: 'Salalah', name_ar: 'صلالة' },
  { country_code: 'OM', name: 'Sohar', name_ar: 'صحار' },
]

export const industries: Industry[] = [
  { name: 'Technology', name_ar: 'التكنولوجيا' },
  { name: 'Finance & Banking', name_ar: 'التمويل والبنوك' },
  { name: 'Healthcare', name_ar: 'الرعاية الصحية' },
  { name: 'Retail', name_ar: 'التجزئة' },
  { name: 'Hospitality', name_ar: 'ضيافة' },
  { name: 'Construction', name_ar: 'البناء' },
  { name: 'Education', name_ar: 'التعليم' },
  { name: 'Marketing', name_ar: 'التسويق' },
  { name: 'Logistics', name_ar: 'اللوجستيات' },
  { name: 'Oil & Gas', name_ar: 'البترول والغاز' },
  { name: 'Real Estate', name_ar: 'الاستثمار العقاري' },
  { name: 'Other', name_ar: 'أخرى' },
]

export const experienceLevels: ExperienceLevel[] = [
  { level: 'Entry Level', level_ar: 'مستوى الدخول', years_min: 0, years_max: 2 },
  { level: 'Mid Level', level_ar: 'متوسط', years_min: 3, years_max: 5 },
  { level: 'Senior', level_ar: 'كبير', years_min: 6, years_max: 10 },
  { level: 'Lead/Manager', level_ar: 'قائد/مدير', years_min: 10, years_max: 15 },
  { level: 'Executive', level_ar: 'تنفيذي', years_min: 15, years_max: 30 },
]

export const companySizes: CompanySize[] = [
  { size: '1-10', size_ar: '1-10', min_employees: 1, max_employees: 10 },
  { size: '11-50', size_ar: '11-50', min_employees: 11, max_employees: 50 },
  { size: '51-200', size_ar: '51-200', min_employees: 51, max_employees: 200 },
  { size: '201-500', size_ar: '201-500', min_employees: 201, max_employees: 500 },
  { size: '501-1000', size_ar: '501-1000', min_employees: 501, max_employees: 1000 },
  { size: '1000+', size_ar: '1000+', min_employees: 1000, max_employees: 10000 },
]

export const jobTypes: string[] = ['full_time', 'part_time', 'contract', 'freelance', 'internship']
export const workModes: string[] = ['on_site', 'remote', 'hybrid']

export const videoConfig = {
  maxDuration: 60, // seconds
  maxFileSize: 100 * 1024 * 1024, // 100MB
  supportedFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  aspectRatio: '9:16', // vertical
}

export const colors = {
  primary: '#0D7377',
  primaryLight: '#14919B',
  primaryDark: '#095759',
  accent: '#C9A227',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  border: '#E5E7EB',
}

export const pageSize = 10
export const maxVideoDuration = 60 // seconds