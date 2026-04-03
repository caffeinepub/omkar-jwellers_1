import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CustomerDTO,
  GoldRateDTO,
  GoldRatesDTO,
  Invoice,
  InvoiceDTO,
  JobOrderDTO,
  JobOrderUpdateDTO,
  SettingsDTO,
  UserDTO,
  backendInterface,
} from "../backend";
import { Variant_paid_locked_draft_partial } from "../backend";
import { useActor } from "./useActor";

/**
 * Gets stored credentials from localStorage.
 * Returns null if not found.
 */
function getCredsOrNull(): { phone: string; password: string } | null {
  try {
    const raw = localStorage.getItem("omkar_creds");
    if (!raw) return null;
    const creds = JSON.parse(raw) as { phone: string; password: string };
    if (!creds.phone || !creds.password) return null;
    return creds;
  } catch {
    return null;
  }
}

/**
 * Gets stored credentials and throws if missing (for mutations that MUST have creds).
 */
function requireCreds(): { phone: string; password: string } {
  const creds = getCredsOrNull();
  if (!creds) {
    localStorage.removeItem("omkar_auth");
    window.location.hash = "/login";
    throw new Error("कृपया पुन्हा लॉग इन करा | Please log in again");
  }
  return creds;
}

/**
 * Extracts a human-readable error message from any error type.
 */
export function extractErrorMessage(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) {
    const msg = e.message;
    // Try quoted format: with message: 'Unauthorized: ...'
    const quotedMatch = msg.match(/with message:\s*'([^']+)'/s);
    if (quotedMatch) return quotedMatch[1];
    // Try unquoted trapped format: trapped with message: Unauthorized: ...
    const unquotedMatch = msg.match(/trapped with message:\s*(.+)/s);
    if (unquotedMatch) return unquotedMatch[1].split("\n")[0].trim();
    // Short clean message: return as-is
    if (msg.length < 200) return msg;
    // Long ICP error: extract just the meaningful part
    const rejectMatch = msg.match(/Reject text:\s*(.+?)(?:\n|$)/i);
    if (rejectMatch) return rejectMatch[1].trim();
    return msg;
  }
  return String(e);
}

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      const creds = getCredsOrNull();
      if (creds)
        return actor.getCustomersWithCreds(creds.phone, creds.password);
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGoldRate() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["goldRate"],
    queryFn: async () => {
      if (!actor) return { ratePerGram: 6500 };
      return actor.getGoldRate();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGoldRates() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["goldRates"],
    queryFn: async () => {
      if (!actor) return { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0 };
      return actor.getGoldRatesPublic();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInvoices() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      if (!actor) return [];
      const creds = getCredsOrNull();
      if (creds) return actor.getInvoicesWithCreds(creds.phone, creds.password);
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInvoice(id: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getInvoice(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useInvoicesByCustomer(customerId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["invoicesByCustomer", customerId],
    queryFn: async () => {
      if (!actor || !customerId) return [];
      const creds = getCredsOrNull();
      if (creds)
        return actor.getInvoicesByCustomerWithCreds(
          creds.phone,
          creds.password,
          customerId,
        );
      return [];
    },
    enabled: !!actor && !isFetching && !!customerId,
  });
}

export function useUdharLedger() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["udharLedger"],
    queryFn: async () => {
      if (!actor) return [];
      const creds = getCredsOrNull();
      if (creds)
        return actor.getUdharLedgerWithCreds(creds.phone, creds.password);
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useReports() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      if (!actor)
        return {
          totalSales: 0,
          totalUdhar: 0,
          counts: { total: 0n, paid: 0n, unpaid: 0n },
        };
      const creds = getCredsOrNull();
      if (creds) {
        const [totalSales, totalUdhar, counts] = await Promise.all([
          actor.getTotalSalesWithCreds(creds.phone, creds.password),
          actor.getTotalUdharPendingWithCreds(creds.phone, creds.password),
          actor.getInvoiceCountsWithCreds(creds.phone, creds.password),
        ]);
        return { totalSales, totalUdhar, counts };
      }
      return {
        totalSales: 0,
        totalUdhar: 0,
        counts: { total: 0n, paid: 0n, unpaid: 0n },
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useJobOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["jobOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const creds = getCredsOrNull();
      if (creds)
        return actor.getJobOrdersWithCreds(creds.phone, creds.password);
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSettings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor)
        return {
          shopName: "OMKAR JWELLERS",
          address: "",
          phone: "",
          gstNumber: "",
          defaultLanguage: "en",
        };
      // Use public endpoint -- no auth needed
      return actor.getSettingsPublic();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: CustomerDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.addCustomerWithCreds(creds.phone, creds.password, customer);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: InvoiceDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.createInvoiceWithCreds(creds.phone, creds.password, invoice);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["udharLedger"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useLockInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.lockInvoiceWithCreds(creds.phone, creds.password, id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useReceivePayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invoiceId,
      amount,
    }: { invoiceId: string; amount: number }) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.receivePaymentWithCreds(
        creds.phone,
        creds.password,
        invoiceId,
        amount,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["udharLedger"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useAddManualUdhar() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerPhone,
      amount,
      notes,
    }: { customerPhone: string; amount: number; notes: string }) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.addManualUdharWithCreds(
        creds.phone,
        creds.password,
        customerPhone,
        amount,
        notes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["udharLedger"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateGoldRate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rate: GoldRateDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.updateGoldRatesWithCreds(creds.phone, creds.password, {
        gold24k: 0,
        gold22k: rate.ratePerGram,
        gold18k: 0,
        silver: 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goldRate"] });
      qc.invalidateQueries({ queryKey: ["goldRates"] });
    },
  });
}

export function useUpdateGoldRates() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rates: GoldRatesDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.updateGoldRatesWithCreds(creds.phone, creds.password, rates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goldRates"] });
      qc.invalidateQueries({ queryKey: ["goldRate"] });
    },
  });
}

export function useCreateJobOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (job: JobOrderDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.createJobOrderWithCreds(creds.phone, creds.password, job);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobOrders"] }),
  });
}

export function useUpdateJobOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: JobOrderUpdateDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.updateJobOrderWithCreds(creds.phone, creds.password, update);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobOrders"] }),
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: SettingsDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.updateSettingsWithCreds(
        creds.phone,
        creds.password,
        settings,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (user: UserDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.createUserWithCreds(creds.phone, creds.password, user);
    },
  });
}
export function useUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      const creds = getCredsOrNull();
      if (creds) return actor.getUsersWithCreds(creds.phone, creds.password);
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: UserDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.updateUserWithCreds(creds.phone, creds.password, user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetPhone: string) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.deleteUserWithCreds(
        creds.phone,
        creds.password,
        targetPhone,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useGetUdharByCustomer(
  invoices: Invoice[],
  customerId: string,
): Invoice | null {
  return (
    invoices
      .filter(
        (inv) =>
          inv.customerId === customerId &&
          inv.udhar > 0 &&
          (inv.status === Variant_paid_locked_draft_partial.partial ||
            inv.status === Variant_paid_locked_draft_partial.locked ||
            inv.status === Variant_paid_locked_draft_partial.draft),
      )
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))[0] ?? null
  );
}

// Repair Orders
export function useRepairOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["repairOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const creds = getCredsOrNull();
      if (creds)
        return actor.getRepairOrdersWithCreds(creds.phone, creds.password);
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRepairOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: import("../backend").RepairOrderDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.createRepairOrderWithCreds(
        creds.phone,
        creds.password,
        order,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repairOrders"] }),
  });
}

export function useUpdateRepairOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: import("../backend").RepairOrderUpdateDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.updateRepairOrderWithCreds(
        creds.phone,
        creds.password,
        update,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repairOrders"] }),
  });
}

// Custom Orders
export function useCustomOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const creds = getCredsOrNull();
      if (creds)
        return actor.getCustomOrdersWithCreds(creds.phone, creds.password);
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: import("../backend").CustomOrderDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.createCustomOrderWithCreds(
        creds.phone,
        creds.password,
        order,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customOrders"] }),
  });
}

export function useUpdateCustomOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: import("../backend").CustomOrderUpdateDTO) => {
      if (!actor)
        throw new Error("Backend not ready. Please wait and try again.");
      const creds = requireCreds();
      return actor.updateCustomOrderWithCreds(
        creds.phone,
        creds.password,
        update,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customOrders"] }),
  });
}
