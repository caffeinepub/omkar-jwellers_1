import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CustomerDTO,
  GoldRateDTO,
  Invoice,
  InvoiceDTO,
  JobOrderDTO,
  JobOrderUpdateDTO,
  SettingsDTO,
  UserDTO,
} from "../backend";
import { Variant_paid_locked_draft_partial } from "../backend";
import { useActor } from "./useActor";

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
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

export function useInvoices() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInvoices();
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
      return actor.getInvoicesByCustomer(customerId);
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
      return actor.getUdharLedger();
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
      const [totalSales, totalUdhar, counts] = await Promise.all([
        actor.getTotalSales(),
        actor.getTotalUdharPending(),
        actor.getInvoiceCounts(),
      ]);
      return { totalSales, totalUdhar, counts };
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
      return actor.getJobOrders();
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
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: CustomerDTO) => {
      if (!actor) throw new Error("No actor");
      return actor.addCustomer(customer);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: InvoiceDTO) => {
      if (!actor) throw new Error("No actor");
      return actor.createInvoice(invoice);
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
      if (!actor) throw new Error("No actor");
      return actor.lockInvoice(id);
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
      if (!actor) throw new Error("No actor");
      return actor.receivePayment(invoiceId, amount);
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
      if (!actor) throw new Error("No actor");
      return actor.updateGoldRate(rate);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goldRate"] }),
  });
}

export function useCreateJobOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (job: JobOrderDTO) => {
      if (!actor) throw new Error("No actor");
      return actor.createJobOrder(job);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobOrders"] }),
  });
}

export function useUpdateJobOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: JobOrderUpdateDTO) => {
      if (!actor) throw new Error("No actor");
      return actor.updateJobOrder(update);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobOrders"] }),
  });
}

export function useUpdateSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: SettingsDTO) => {
      if (!actor) throw new Error("No actor");
      return actor.updateSettings(settings);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (user: UserDTO) => {
      if (!actor) throw new Error("No actor");
      return actor.createUser(user);
    },
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
