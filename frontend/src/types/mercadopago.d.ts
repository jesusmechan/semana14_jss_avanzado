export interface MpPayer {
  email?: string;
  identification?: { type: string; number: string };
}

export interface MpFormData {
  token?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  installments?: number;
  issuer_id?: string | number;
  transaction_amount?: number;
  payer?: MpPayer;
}

export interface MpBrickController {
  unmount: () => void;
}

export interface MpSubmitData {
  selectedPaymentMethod?: string;
  formData: MpFormData;
}

export interface MercadoPagoInstance {
  bricks: () => {
    create: (
      name: 'payment',
      containerId: string,
      settings: Record<string, unknown>,
    ) => Promise<MpBrickController>;
  };
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

export {};
