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
export interface InvoiceItem {
    weight: number;
    total: number;
    rate: number;
    description: string;
    purity: number;
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
export type Time = bigint;
export interface JobOrderUpdateDTO {
    id: string;
    status: Variant_pending_completed_inProgress;
    notes: string;
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
export interface UserDTO {
    password: string;
    name: string;
    role: Role;
    phone: string;
}
export interface GoldRateDTO {
    ratePerGram: number;
}
export interface CustomerDTO {
    name: string;
    address: string;
    phone: string;
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
    addCustomer(customer: CustomerDTO): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createInvoice(invoice: InvoiceDTO): Promise<string>;
    createJobOrder(job: JobOrderDTO): Promise<string>;
    createUser(userDTO: UserDTO): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(phone: string): Promise<Customer | null>;
    getCustomers(): Promise<Array<CustomerDTO>>;
    getGoldRate(): Promise<GoldRateDTO>;
    getInvoice(id: string): Promise<Invoice | null>;
    getInvoiceCounts(): Promise<{
        total: bigint;
        paid: bigint;
        unpaid: bigint;
    }>;
    getInvoices(): Promise<Array<Invoice>>;
    getInvoicesByCustomer(customerId: string): Promise<Array<Invoice>>;
    getJobOrder(id: string): Promise<JobOrder | null>;
    getJobOrders(): Promise<Array<JobOrder>>;
    getPaidInvoices(): Promise<Array<Invoice>>;
    getPaymentHistory(customerId: string): Promise<Array<Invoice>>;
    getSettings(): Promise<SettingsDTO>;
    getTotalSales(): Promise<number>;
    getTotalUdharPending(): Promise<number>;
    getUdharLedger(): Promise<Array<Invoice>>;
    getUnpaidInvoices(): Promise<Array<Invoice>>;
    getUserProfile(userPrincipal: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    lockInvoice(id: string): Promise<void>;
    login(phone: string, password: string): Promise<UserDTO>;
    receivePayment(invoiceId: string, amount: number): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateGoldRate(newRate: GoldRateDTO): Promise<void>;
    updateInvoiceStatus(update: InvoiceUpdateDTO): Promise<void>;
    updateJobOrder(update: JobOrderUpdateDTO): Promise<void>;
    updateSettings(newSettings: SettingsDTO): Promise<void>;
}
