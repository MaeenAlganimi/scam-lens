import type { RuleCategory } from "@/lib/types";

export interface PhrasePattern {
  category: RuleCategory;
  /** Written in normal spelling. The engine folds case and diacritics. */
  phrase: string;
}

/**
 * Each category scores once, no matter how many of its phrases match.
 * Phrases are specific on purpose: bare words like "bank" or "apple"
 * would light up ordinary conversations.
 */
export const PHRASE_PATTERNS: readonly PhrasePattern[] = [
  // English — urgency
  { category: "urgency", phrase: "urgent" },
  { category: "urgency", phrase: "act now" },
  { category: "urgency", phrase: "immediately" },
  { category: "urgency", phrase: "right away" },
  { category: "urgency", phrase: "within 24 hours" },
  { category: "urgency", phrase: "within 48 hours" },
  { category: "urgency", phrase: "last chance" },
  { category: "urgency", phrase: "expires today" },
  { category: "urgency", phrase: "limited time" },
  { category: "urgency", phrase: "final notice" },
  { category: "urgency", phrase: "action required" },
  { category: "urgency", phrase: "do not delay" },
  { category: "urgency", phrase: "account is suspended" },
  { category: "urgency", phrase: "account suspended" },
  { category: "urgency", phrase: "account will be closed" },
  { category: "urgency", phrase: "respond immediately" },

  // English — payment
  { category: "payment", phrase: "gift card" },
  { category: "payment", phrase: "wire transfer" },
  { category: "payment", phrase: "western union" },
  { category: "payment", phrase: "moneygram" },
  { category: "payment", phrase: "bank transfer" },
  { category: "payment", phrase: "processing fee" },
  { category: "payment", phrase: "tax payment" },
  { category: "payment", phrase: "credit card number" },
  { category: "payment", phrase: "prepaid card" },
  { category: "payment", phrase: "send bitcoin" },
  { category: "payment", phrase: "pay with bitcoin" },
  { category: "payment", phrase: "bitcoin wallet" },
  { category: "payment", phrase: "routing number" },
  { category: "payment", phrase: "payment details" },
  { category: "payment", phrase: "customs fee" },

  // English — prize
  { category: "prize", phrase: "you have won" },
  { category: "prize", phrase: "you've won" },
  { category: "prize", phrase: "you won" },
  { category: "prize", phrase: "cash prize" },
  { category: "prize", phrase: "claim your reward" },
  { category: "prize", phrase: "claim your prize" },
  { category: "prize", phrase: "lottery winner" },
  { category: "prize", phrase: "lottery" },
  { category: "prize", phrase: "jackpot" },
  { category: "prize", phrase: "selected winner" },

  // English — credentials
  { category: "credentials", phrase: "password" },
  { category: "credentials", phrase: "passwords" },
  { category: "credentials", phrase: "one-time password" },
  { category: "credentials", phrase: "one time password" },
  { category: "credentials", phrase: "verification code" },
  { category: "credentials", phrase: "verify your password" },
  { category: "credentials", phrase: "verify your account" },
  { category: "credentials", phrase: "social security number" },
  { category: "credentials", phrase: "confirm your identity" },
  { category: "credentials", phrase: "login details" },
  { category: "credentials", phrase: "recovery phrase" },
  { category: "credentials", phrase: "seed phrase" },
  { category: "credentials", phrase: "one-time code" },
  { category: "credentials", phrase: "otp" },

  // English — impersonation
  { category: "impersonation", phrase: "apple support" },
  { category: "impersonation", phrase: "chase security" },
  { category: "impersonation", phrase: "bank of america" },
  { category: "impersonation", phrase: "bank security" },
  { category: "impersonation", phrase: "wells fargo" },
  { category: "impersonation", phrase: "paypal security" },
  { category: "impersonation", phrase: "microsoft security" },
  { category: "impersonation", phrase: "irs" },
  { category: "impersonation", phrase: "hmrc" },
  { category: "impersonation", phrase: "customs agency" },
  { category: "impersonation", phrase: "fedex delivery" },
  { category: "impersonation", phrase: "netflix billing" },
  { category: "impersonation", phrase: "instagram support" },
  { category: "impersonation", phrase: "coinbase security" },
  { category: "impersonation", phrase: "fraud alert" },

  // Spanish — urgency
  { category: "urgency", phrase: "urgente" },
  { category: "urgency", phrase: "inmediatamente" },
  { category: "urgency", phrase: "de inmediato" },
  { category: "urgency", phrase: "últimas 24 horas" },
  { category: "urgency", phrase: "en las próximas 24 horas" },
  { category: "urgency", phrase: "última oportunidad" },
  { category: "urgency", phrase: "aviso final" },
  { category: "urgency", phrase: "acción requerida" },
  { category: "urgency", phrase: "cuenta suspendida" },
  { category: "urgency", phrase: "cuenta está suspendida" },
  { category: "urgency", phrase: "su cuenta será cerrada" },

  // Spanish — payment
  { category: "payment", phrase: "tarjeta de regalo" },
  { category: "payment", phrase: "transferencia bancaria" },
  { category: "payment", phrase: "tarifa de procesamiento" },
  { category: "payment", phrase: "datos de pago" },
  { category: "payment", phrase: "número de cuenta" },
  { category: "payment", phrase: "paga con bitcoin" },
  { category: "payment", phrase: "pago con bitcoin" },
  { category: "payment", phrase: "bizum" },

  // Spanish — prize
  { category: "prize", phrase: "ha ganado" },
  { category: "prize", phrase: "has ganado" },
  { category: "prize", phrase: "ganaste" },
  { category: "prize", phrase: "premio en efectivo" },
  { category: "prize", phrase: "reclama tu premio" },
  { category: "prize", phrase: "reclama su premio" },
  { category: "prize", phrase: "ganador de la lotería" },
  { category: "prize", phrase: "lotería" },

  // Spanish — credentials
  { category: "credentials", phrase: "contraseña" },
  { category: "credentials", phrase: "contrasena" },
  { category: "credentials", phrase: "código de verificación" },
  { category: "credentials", phrase: "codigo de verificacion" },
  { category: "credentials", phrase: "verifica tu cuenta" },
  { category: "credentials", phrase: "verifique su contraseña" },
  { category: "credentials", phrase: "verifique su cuenta" },
  { category: "credentials", phrase: "datos de acceso" },
  { category: "credentials", phrase: "clave de un solo uso" },

  // Spanish — impersonation
  { category: "impersonation", phrase: "servicio de seguridad" },
  { category: "impersonation", phrase: "soporte de apple" },
  { category: "impersonation", phrase: "agencia tributaria" },
  { category: "impersonation", phrase: "hacienda" },
  { category: "impersonation", phrase: "correos de españa" },
  { category: "impersonation", phrase: "banco santander" },
  { category: "impersonation", phrase: "seguridad del banco" },

  // Arabic — urgency
  { category: "urgency", phrase: "عاجل" },
  { category: "urgency", phrase: "فورا" },
  { category: "urgency", phrase: "خلال 24 ساعة" },
  { category: "urgency", phrase: "آخر فرصة" },
  { category: "urgency", phrase: "تم تعليق حسابك" },
  { category: "urgency", phrase: "سيتم إيقاف" },
  { category: "urgency", phrase: "إجراء فوري" },
  { category: "urgency", phrase: "لا تتجاهل" },

  // Arabic — payment
  { category: "payment", phrase: "بطاقة هدايا" },
  { category: "payment", phrase: "تحويل بنكي" },
  { category: "payment", phrase: "رسوم المعالجة" },
  { category: "payment", phrase: "رقم الحساب" },
  { category: "payment", phrase: "ادفع ببيتكوين" },
  { category: "payment", phrase: "ببيتكوين" },
  { category: "payment", phrase: "بالبيتكوين" },
  { category: "payment", phrase: "حوالة" },

  // Arabic — prize
  { category: "prize", phrase: "لقد ربحت" },
  { category: "prize", phrase: "جائزة نقدية" },
  { category: "prize", phrase: "المطالبة بالجائزة" },
  { category: "prize", phrase: "يانصيب" },

  // Arabic — credentials
  { category: "credentials", phrase: "كلمة المرور" },
  { category: "credentials", phrase: "كلمة السر" },
  { category: "credentials", phrase: "رمز التحقق" },
  { category: "credentials", phrase: "بيانات الدخول" },
  { category: "credentials", phrase: "أكد كلمة المرور" },

  // Arabic — impersonation
  { category: "impersonation", phrase: "بنك الراجحي" },
  { category: "impersonation", phrase: "البنك الأهلي" },
  { category: "impersonation", phrase: "خدمة الأمان" },
  { category: "impersonation", phrase: "دعم أبل" },
  { category: "impersonation", phrase: "هيئة الزكاة" },
  { category: "impersonation", phrase: "الجمارك" },
];
