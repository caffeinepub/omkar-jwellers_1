import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SettingsDTO {
    gstNumber: string;
    address: string;
    defaultLanguage: string;
    shopName: string;
    phone: string;
}
export interface RepairOrder {
    id: string;
    customerName: string;
    status: Variant_delivered_inProgress_received_ready;
    itemDescription: string;
    createdAt: Time;
    updatedAt: Time;
    notes: string;
    phone: string;
    estimatedCost: number;
    referenceImageHash?: string;
}
export interface InvoiceItem {
    weight: number;
    total: number;
    rate: number;
    description: string;
    purity: number;
}
export type Time = bigint;
export interface JobOrderUpdateDTO {
    id: string;
    status: Variant_pending_completed_inProgress;
    notes: string;
}
export interface InvoiceDTO {
    gst: boolean;
    gstPercent: number;
    language: string;
    notes: string;
    customerId: string;
    items: Array<InvoiceItem>;
    partialPayment: number;
}
export interface CustomOrderDTO {
    customerName: string;
    itemDescription: string;
    designNotes: string;
    dueDate: Time;
    advancePaid: number;
    phone: string;
    estimatedCost: number;
    referenceImageHash?: string;
}
export interface Invoice {
    id: string;
    gst: boolean;
    status: Variant_paid_locked_draft_partial;
    createdAt: Time;
    gstPercent: number;
    amountPaid: number;
    language: string;
    updatedAt: Time;
    totalAmount: number;
    notes: string;
    udhar: number;
    customerId: string;
    items: Array<InvoiceItem>;
    partialPayment: number;
}
export interface JobOrder {
    id: string;
    customerName: string;
    status: Variant_pending_completed_inProgress;
    assignedKaragir: string;
    createdAt: Time;
    dueDate: Time;
    description: string;
    updatedAt: Time;
    notes: string;
}
export interface Customer {
    name: string;
    createdAt: Time;
    address: string;
    phone: string;
}
export interface InvoiceUpdateDTO {
    id: string;
    status: Variant_paid_locked_draft_partial;
}
export interface JobOrderDTO {
    customerName: string;
    assignedKaragir: string;
    dueDate: Time;
    description: string;
}
export interface CustomOrderUpdateDTO {
    id: string;
    status: Variant_delivered_inProgress_received_ready;
    designNotes: string;
}
export interface RepairOrderDTO {
    customerName: string;
    itemDescription: string;
    notes: string;
    phone: string;
    estimatedCost: number;
    referenceImageHash?: string;
}
export interface UserDTO {
    password: string;
    name: string;
    role: Role;
    phone: string;
}
export interface GoldRateDTO {
    ratePerGram: number;
}
export interface GoldRatesDTO {
    gold24k: number;
    gold22k: number;
    gold18k: number;
    silver: number;
}
export interface RepairOrderUpdateDTO {
    id: string;
    status: Variant_delivered_inProgress_received_ready;
    notes: string;
}
export interface CustomerDTO {
    name: string;
    address: string;
    phone: string;
}
export interface CustomOrder {
    id: string;
    customerName: string;
    status: Variant_delivered_inProgress_received_ready;
    itemDescription: string;
    createdAt: Time;
    designNotes: string;
    dueDate: Time;
    updatedAt: Time;
    advancePaid: number;
    phone: string;
    estimatedCost: number;
    referenceImageHash?: string;
}
export interface UserProfile {
    name: string;
    role: Role;
    phone: string;
}
export enum Role {
    karagir = "karagir",
    manager = "manager",
    owner = "owner",
    staff = "staff"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_delivered_inProgress_received_ready {
    delivered = "delivered",
    inProgress = "inProgress",
    received = "received",
    ready = "ready"
}
export enum Variant_paid_locked_draft_partial {
    paid = "paid",
    locked = "locked",
    draft = "draft",
    partial = "partial"
}
export enum Variant_pending_completed_inProgress {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress"
}
export interface backendInterface {
    // Session-based (kept for compatibility)
    addCustomer(customer: CustomerDTO): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomOrder(customOrder: CustomOrderDTO): Promise<string>;
    createInvoice(invoice: InvoiceDTO): Promise<string>;
    createJobOrder(job: JobOrderDTO): Promise<string>;
    createRepairOrder(repairOrder: RepairOrderDTO): Promise<string>;
    createUser(userDTO: UserDTO): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomOrder(id: string): Promise<CustomOrder | null>;
    getCustomOrders(): Promise<Array<CustomOrder>>;
    getCustomer(phone: string): Promise<Customer | null>;
    getCustomers(): Promise<Array<CustomerDTO>>;
    getGoldRate(): Promise<GoldRateDTO>;
    getGoldRates(): Promise<GoldRatesDTO>;
    getInvoice(id: string): Promise<Invoice | null>;
    getInvoiceCounts(): Promise<{ total: bigint; paid: bigint; unpaid: bigint }>;
    getInvoices(): Promise<Array<Invoice>>;
    getInvoicesByCustomer(customerId: string): Promise<Array<Invoice>>;
    getJobOrder(id: string): Promise<JobOrder | null>;
    getJobOrders(): Promise<Array<JobOrder>>;
    getPaidInvoices(): Promise<Array<Invoice>>;
    getPaymentHistory(customerId: string): Promise<Array<Invoice>>;
    getRepairOrder(id: string): Promise<RepairOrder | null>;
    getRepairOrders(): Promise<Array<RepairOrder>>;
    getSettings(): Promise<SettingsDTO>;
    getTotalSales(): Promise<number>;
    getTotalUdharPending(): Promise<number>;
    getUdharLedger(): Promise<Array<Invoice>>;
    getUnpaidInvoices(): Promise<Array<Invoice>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    lockInvoice(id: string): Promise<void>;
    login(phone: string, password: string): Promise<UserDTO>;
    receivePayment(invoiceId: string, amount: number): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCustomOrder(update: CustomOrderUpdateDTO): Promise<void>;
    updateGoldRate(newRate: GoldRateDTO): Promise<void>;
    updateGoldRates(newRates: GoldRatesDTO): Promise<void>;
    updateInvoiceStatus(update: InvoiceUpdateDTO): Promise<void>;
    updateJobOrder(update: JobOrderUpdateDTO): Promise<void>;
    updateRepairOrder(update: RepairOrderUpdateDTO): Promise<void>;
    updateSettings(newSettings: SettingsDTO): Promise<void>;
    // Public (no auth)
    getGoldRatesPublic(): Promise<GoldRatesDTO>;
    getSettingsPublic(): Promise<SettingsDTO>;
    // Credential-based (bypasses session state -- use these for all mutations)
    loginWithCreds(phone: string, password: string): Promise<UserDTO>;
    addCustomerWithCreds(phone: string, password: string, customer: CustomerDTO): Promise<string>;
    getCustomersWithCreds(phone: string, password: string): Promise<Array<CustomerDTO>>;
    getCustomerWithCreds(callerPhone: string, password: string, customerPhone: string): Promise<Customer | null>;
    getUserProfileWithCreds(phone: string, password: string): Promise<UserProfile>;
    createUserWithCreds(callerPhone: string, callerPassword: string, userDTO: UserDTO): Promise<void>;
    updateGoldRatesWithCreds(phone: string, password: string, newRates: GoldRatesDTO): Promise<void>;
    createInvoiceWithCreds(phone: string, password: string, invoice: InvoiceDTO): Promise<string>;
    lockInvoiceWithCreds(phone: string, password: string, id: string): Promise<void>;
    updateInvoiceStatusWithCreds(phone: string, password: string, update: InvoiceUpdateDTO): Promise<void>;
    getInvoicesWithCreds(phone: string, password: string): Promise<Array<Invoice>>;
    getInvoicesByCustomerWithCreds(phone: string, password: string, customerId: string): Promise<Array<Invoice>>;
    receivePaymentWithCreds(phone: string, password: string, invoiceId: string, amount: number): Promise<void>;
    addManualUdharWithCreds(callerPhone: string, password: string, customerPhone: string, amount: number, notes: string): Promise<string>;
    getUdharLedgerWithCreds(phone: string, password: string): Promise<Array<Invoice>>;
    getPaymentHistoryWithCreds(callerPhone: string, password: string, customerId: string): Promise<Array<Invoice>>;
    getTotalSalesWithCreds(phone: string, password: string): Promise<number>;
    getTotalUdharPendingWithCreds(phone: string, password: string): Promise<number>;
    getInvoiceCountsWithCreds(phone: string, password: string): Promise<{ total: bigint; paid: bigint; unpaid: bigint }>;
    createJobOrderWithCreds(phone: string, password: string, job: JobOrderDTO): Promise<string>;
    updateJobOrderWithCreds(phone: string, password: string, update: JobOrderUpdateDTO): Promise<void>;
    getJobOrdersWithCreds(phone: string, password: string): Promise<Array<JobOrder>>;
    createRepairOrderWithCreds(phone: string, password: string, repairOrder: RepairOrderDTO): Promise<string>;
    updateRepairOrderWithCreds(phone: string, password: string, update: RepairOrderUpdateDTO): Promise<void>;
    getRepairOrdersWithCreds(phone: string, password: string): Promise<Array<RepairOrder>>;
    createCustomOrderWithCreds(phone: string, password: string, customOrder: CustomOrderDTO): Promise<string>;
    updateCustomOrderWithCreds(phone: string, password: string, update: CustomOrderUpdateDTO): Promise<void>;
    getCustomOrdersWithCreds(phone: string, password: string): Promise<Array<CustomOrder>>;
    updateSettingsWithCreds(phone: string, password: string, newSettings: SettingsDTO): Promise<void>;
    getUsersWithCreds(phone: string, password: string): Promise<Array<UserDTO>>;
    updateUserWithCreds(callerPhone: string, callerPassword: string, userDTO: UserDTO): Promise<void>;
    deleteUserWithCreds(callerPhone: string, callerPassword: string, targetPhone: string): Promise<void>;
}
