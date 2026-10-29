import type { SampleMessage } from "@/lib/types";

/**
 * Fictional messages for the demo. They are not in the training set.
 * The wording is deliberate so the rule and link checks have something
 * visible to explain. They are not real reports.
 */
export const SAMPLES: readonly SampleMessage[] = [
  {
    id: "en-bank",
    language: "en",
    text: "URGENT: This is Chase security. Your account is suspended. Verify your password within 24 hours: http://secure-chase-login.xyz/verify",
  },
  {
    id: "en-parcel",
    language: "en",
    text: "Final notice: your parcel is waiting. Track it now at http://bit.ly/parcel-hold",
  },
  {
    id: "en-calm",
    language: "en",
    text: "Can we grab tea at the campus garden after the history lecture?",
  },
  {
    id: "ar-bank",
    language: "ar",
    text: "عاجل: هذه خدمة الأمان في بنك الراجحي. تم تعليق حسابك. أكد كلمة المرور خلال 24 ساعة: http://alrajhi-secure.xyz/login",
  },
  {
    id: "ar-calm",
    language: "ar",
    text: "هل نأخذ الشاي في حديقة الجامعة بعد محاضرة التاريخ؟",
  },
  {
    id: "es-bank",
    language: "es",
    text: "URGENTE: servicio de seguridad de BBVA. Su cuenta está suspendida. Verifique su contraseña en las próximas 24 horas: http://bbva-seguro.xyz/acceso",
  },
  {
    id: "es-calm",
    language: "es",
    text: "¿Tomamos un café en el jardín de la facultad después de la clase de historia?",
  },
];

export const SAMPLE_LABEL_KEYS: Record<string, string> = {
  "en-bank": "samples.enBank",
  "en-parcel": "samples.enParcel",
  "en-calm": "samples.enCalm",
  "ar-bank": "samples.arBank",
  "ar-calm": "samples.arCalm",
  "es-bank": "samples.esBank",
  "es-calm": "samples.esCalm",
};
