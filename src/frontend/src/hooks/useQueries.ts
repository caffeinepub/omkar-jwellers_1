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
 * Throws if credentials are not found — this forces the caller to handle the missing creds case.
 */
function getStoredCreds(): { phone: string; password: string } {
  const raw = localStorage.getItem("omkar_creds");
  if (!raw) throw new Error("NO_CREDS");
  const creds = JSON.parse(raw) as { phone: string; password: string };
  if (!creds.phone || !creds.password) throw new Error("NO_CREDS");
  return creds;
}

/**
 * Re-establishes the backend session by calling actor.login().
 * Throws if login fails for any reason.
 */
async function doLogin(actor: backendInterface): Promise<void> {
  const creds = getStoredCreds();
  await actor.login(creds.phone, creds.password);
}

/**
 * Calls a backend function with automatic session re-establishment.
 * Pattern:
 * 1. Call login() first to ensure session is active (handles post-deployment session loss)
 * 2. Call the actual backend function
 * 3. If backend returns Unauthorized (shouldn't happen after step 1, but just in case),
 *    retry login and call again once more
 *
 * This replaces the old silent `ensureAuth` that was hiding errors.
 */

/**
 * Gets stored credentials for direct credential-based backend calls.
 * Returns null if not available.
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

async function withAuth<T>(
  actor: backendInterface,
  fn: () => Promise<T>,
): Promise<T> {
  // Step 1: Always re-establish session before the call
  try {
    await doLogin(actor);
  } catch (loginErr) {
    const msg = String(loginErr);
    if (msg.includes("NO_CREDS")) {
      // No credentials stored — user needs to log in manually
      // Clear frontend auth so the login screen appears
      localStorage.removeItem("omkar_auth");
      window.location.hash = "/login";
      throw new Error("कृपया पुन्हा लॉग इन करा | Please log in again");
    }
    // Other login failure (wrong password, user not found, network) — propagate
    throw loginErr;
  }

  // Step 2: Call the actual function
  try {
    return await fn();
  } catch (err) {
    const msg = String(err);
    // If still Unauthorized after login (very rare race condition), retry once
    if (
      msg.includes("Unauthorized") ||
      msg.includes("Authentication required")
    ) {
      await doLogin(actor);
      return await fn();
    }
    throw err;
  }
}

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

export function useGoldRates() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["goldRates"],
    queryFn: async () => {
      if (!actor) return { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0 };
      // Use public endpoint (no auth required) so this always works
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
      // Use credential-based auth to bypass unreliable session state
      const creds = getCredsOrNull();
      if (creds) {
        return actor.addCustomerWithCreds(
          creds.phone,
          creds.password,
          customer,
        );
      }
      // Fallback to session auth if no creds stored
      return withAuth(actor, () => actor.addCustomer(customer));
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
      return withAuth(actor, () => actor.createInvoice(invoice));
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
      return withAuth(actor, () => actor.lockInvoice(id));
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
      return withAuth(actor, () => actor.receivePayment(invoiceId, amount));
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
      return withAuth(actor, () => actor.updateGoldRate(rate));
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
      if (!actor) throw new Error("No actor");
      // Use credential-based auth to bypass unreliable session state
      const creds = getCredsOrNull();
      if (creds) {
        return actor.updateGoldRatesWithCreds(
          creds.phone,
          creds.password,
          rates,
        );
      }
      // Fallback to session auth
      return withAuth(actor, () => actor.updateGoldRates(rates));
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
      if (!actor) throw new Error("No actor");
      return withAuth(actor, () => actor.createJobOrder(job));
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
      return withAuth(actor, () => actor.updateJobOrder(update));
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
      return withAuth(actor, () => actor.updateSettings(settings));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (user: UserDTO) => {
      if (!actor) throw new Error("No actor");
      return withAuth(actor, () => actor.createUser(user));
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

// Repair Orders
export function useRepairOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["repairOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepairOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRepairOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: import("../backend").RepairOrderDTO) => {
      if (!actor) throw new Error("No actor");
      return withAuth(actor, () => actor.createRepairOrder(order));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repairOrders"] }),
  });
}

export function useUpdateRepairOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: import("../backend").RepairOrderUpdateDTO) => {
      if (!actor) throw new Error("No actor");
      return withAuth(actor, () => actor.updateRepairOrder(update));
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
      return actor.getCustomOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: import("../backend").CustomOrderDTO) => {
      if (!actor) throw new Error("No actor");
      return withAuth(actor, () => actor.createCustomOrder(order));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customOrders"] }),
  });
}

export function useUpdateCustomOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: import("../backend").CustomOrderUpdateDTO) => {
      if (!actor) throw new Error("No actor");
      return withAuth(actor, () => actor.updateCustomOrder(update));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customOrders"] }),
  });
}
