import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  type Role = {
    #owner;
    #manager;
    #staff;
    #karagir;
  };

  type User = {
    phone : Text;
    password : Text;
    role : Role;
    name : Text;
  };

  type UserDTO = {
    phone : Text;
    password : Text;
    role : Role;
    name : Text;
  };

  type UserProfile = {
    name : Text;
    phone : Text;
    role : Role;
  };

  type Customer = {
    name : Text;
    phone : Text;
    address : Text;
    createdAt : Time.Time;
  };

  type CustomerDTO = {
    name : Text;
    phone : Text;
    address : Text;
  };

  // Legacy type kept for stable variable compatibility
  type GoldRate = {
    ratePerGram : Float;
    updatedAt : Time.Time;
  };

  type GoldRates = {
    gold24k : Float;
    gold22k : Float;
    gold18k : Float;
    silver : Float;
    updatedAt : Time.Time;
  };

  type GoldRatesDTO = {
    gold24k : Float;
    gold22k : Float;
    gold18k : Float;
    silver : Float;
  };

  type InvoiceItem = {
    description : Text;
    purity : Float;
    weight : Float;
    rate : Float;
    total : Float;
  };

  type Invoice = {
    id : Text;
    customerId : Text;
    items : [InvoiceItem];
    gst : Bool;
    gstPercent : Float;
    notes : Text;
    partialPayment : Float;
    language : Text;
    status : { #draft; #locked; #paid; #partial };
    createdAt : Time.Time;
    updatedAt : Time.Time;
    totalAmount : Float;
    amountPaid : Float;
    udhar : Float;
  };

  type InvoiceDTO = {
    customerId : Text;
    items : [InvoiceItem];
    gst : Bool;
    gstPercent : Float;
    notes : Text;
    partialPayment : Float;
    language : Text;
  };

  type InvoiceUpdateDTO = {
    id : Text;
    status : { #draft; #locked; #paid; #partial };
  };

  type JobOrder = {
    id : Text;
    customerName : Text;
    description : Text;
    assignedKaragir : Text;
    dueDate : Time.Time;
    status : { #pending; #inProgress; #completed };
    notes : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type JobOrderDTO = {
    customerName : Text;
    description : Text;
    assignedKaragir : Text;
    dueDate : Time.Time;
  };

  type JobOrderUpdateDTO = {
    id : Text;
    status : { #pending; #inProgress; #completed };
    notes : Text;
  };

  type Settings = {
    shopName : Text;
    address : Text;
    phone : Text;
    gstNumber : Text;
    defaultLanguage : Text;
  };

  type SettingsDTO = {
    shopName : Text;
    address : Text;
    phone : Text;
    gstNumber : Text;
    defaultLanguage : Text;
  };

  type RepairOrder = {
    id : Text;
    customerName : Text;
    phone : Text;
    itemDescription : Text;
    estimatedCost : Float;
    status : { #received; #inProgress; #ready; #delivered };
    notes : Text;
    referenceImageHash : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type RepairOrderDTO = {
    customerName : Text;
    phone : Text;
    itemDescription : Text;
    estimatedCost : Float;
    referenceImageHash : ?Text;
    notes : Text;
  };

  type RepairOrderUpdateDTO = {
    id : Text;
    status : { #received; #inProgress; #ready; #delivered };
    notes : Text;
  };

  type CustomOrder = {
    id : Text;
    customerName : Text;
    phone : Text;
    itemDescription : Text;
    designNotes : Text;
    estimatedCost : Float;
    advancePaid : Float;
    dueDate : Time.Time;
    status : { #received; #inProgress; #ready; #delivered };
    referenceImageHash : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type CustomOrderDTO = {
    customerName : Text;
    phone : Text;
    itemDescription : Text;
    designNotes : Text;
    estimatedCost : Float;
    advancePaid : Float;
    dueDate : Time.Time;
    referenceImageHash : ?Text;
  };

  type CustomOrderUpdateDTO = {
    id : Text;
    status : { #received; #inProgress; #ready; #delivered };
    designNotes : Text;
  };

  // --- Legacy stable vars retained for upgrade compatibility ---
  // These existed in the previously deployed version and must not be dropped.
  stable var goldRate : GoldRate = { ratePerGram = 0.0; updatedAt = 0 };
  let userProfiles = Map.empty<Principal, UserProfile>();

  // --- Stable storage arrays for persistence across upgrades ---
  stable var stableUsers : [(Text, User)] = [];
  stable var stablePrincipalToPhone : [(Principal, Text)] = [];
  stable var stableCustomers : [(Text, Customer)] = [];
  stable var stableInvoices : [(Text, Invoice)] = [];
  stable var stableJobOrders : [(Text, JobOrder)] = [];
  stable var stableRepairOrders : [(Text, RepairOrder)] = [];
  stable var stableCustomOrders : [(Text, CustomOrder)] = [];
  stable var stableInvoiceCounter : Nat = 0;
  stable var stableGoldRates : GoldRates = { gold24k = 0.0; gold22k = 0.0; gold18k = 0.0; silver = 0.0; updatedAt = 0 };
  stable var stableSettings : Settings = {
    shopName = "ओₘकार ज्वेलर्स";
    address = "";
    phone = "";
    gstNumber = "";
    defaultLanguage = "marathi";
  };

  // --- In-memory Maps (populated from stable arrays on init) ---
  let usersMap = Map.empty<Text, User>();
  let principalToPhoneMap = Map.empty<Principal, Text>();
  let customersMap = Map.empty<Text, Customer>();
  let invoicesMap = Map.empty<Text, Invoice>();
  let jobOrdersMap = Map.empty<Text, JobOrder>();
  let repairOrdersMap = Map.empty<Text, RepairOrder>();
  let customOrdersMap = Map.empty<Text, CustomOrder>();
  var goldRates : GoldRates = stableGoldRates;
  var settings : Settings = stableSettings;
  var invoiceCounter : Nat = stableInvoiceCounter;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // --- Restore state from stable storage ---
  func restoreState() {
    for ((k, v) in stableUsers.vals()) { usersMap.remove(k); usersMap.add(k, v) };
    for ((k, v) in stablePrincipalToPhone.vals()) { principalToPhoneMap.remove(k); principalToPhoneMap.add(k, v) };
    for ((k, v) in stableCustomers.vals()) { customersMap.remove(k); customersMap.add(k, v) };
    for ((k, v) in stableInvoices.vals()) { invoicesMap.remove(k); invoicesMap.add(k, v) };
    for ((k, v) in stableJobOrders.vals()) { jobOrdersMap.remove(k); jobOrdersMap.add(k, v) };
    for ((k, v) in stableRepairOrders.vals()) { repairOrdersMap.remove(k); repairOrdersMap.add(k, v) };
    for ((k, v) in stableCustomOrders.vals()) { customOrdersMap.remove(k); customOrdersMap.add(k, v) };
  };
  restoreState();

  // Always force-write the owner account to guarantee login always works.
  // Using remove+add prevents duplicate key traps and overrides stale stable entries.
  func initOwnerAccount() {
    let owner : User = {
      phone = "8263062604";
      password = "Prasad@6aug";
      role = #owner;
      name = "Prasad";
    };
    usersMap.remove(owner.phone);
    usersMap.add(owner.phone, owner);
  };
  initOwnerAccount();

  // --- Preupgrade: serialize Maps to stable arrays ---
  system func preupgrade() {
    stableUsers := usersMap.entries().toArray();
    stablePrincipalToPhone := principalToPhoneMap.entries().toArray();
    stableCustomers := customersMap.entries().toArray();
    stableInvoices := invoicesMap.entries().toArray();
    stableJobOrders := jobOrdersMap.entries().toArray();
    stableRepairOrders := repairOrdersMap.entries().toArray();
    stableCustomOrders := customOrdersMap.entries().toArray();
    stableInvoiceCounter := invoiceCounter;
    stableGoldRates := goldRates;
    stableSettings := settings;
    // Migrate legacy goldRate from previous deployment if 22k rate not yet set
    if (stableGoldRates.gold22k == 0.0 and goldRate.ratePerGram > 0.0) {
      stableGoldRates := { stableGoldRates with gold22k = goldRate.ratePerGram };
    };
  };

  // --- Postupgrade: restore from stable arrays ---
  system func postupgrade() {
    restoreState();
    goldRates := stableGoldRates;
    settings := stableSettings;
    invoiceCounter := stableInvoiceCounter;
    initOwnerAccount();
  };

  func toUserDTO(user : User) : UserDTO {
    { phone = user.phone; password = ""; role = user.role; name = user.name };
  };

  func toUserProfile(user : User) : UserProfile {
    { phone = user.phone; role = user.role; name = user.name };
  };

  func toCustomerDTO(customer : Customer) : CustomerDTO {
    { name = customer.name; phone = customer.phone; address = customer.address };
  };

  func toSettingsDTO(s : Settings) : SettingsDTO {
    { shopName = s.shopName; address = s.address; phone = s.phone; gstNumber = s.gstNumber; defaultLanguage = s.defaultLanguage };
  };

  func getNextInvoiceId() : Text {
    invoiceCounter += 1;
    let numStr = invoiceCounter.toText();
    let padding = if (invoiceCounter < 10) { "000" } else if (invoiceCounter < 100) { "00" } else if (invoiceCounter < 1000) { "0" } else { "" };
    "INV-" # padding # numStr;
  };

  func getUserByPrincipal(caller : Principal) : ?User {
    switch (principalToPhoneMap.get(caller)) {
      case (null) { null };
      case (?phone) { usersMap.get(phone) };
    };
  };

  func isOwner(caller : Principal) : Bool {
    switch (getUserByPrincipal(caller)) {
      case (null) { false };
      case (?user) { switch (user.role) { case (#owner) { true }; case (_) { false } } };
    };
  };

  func isOwnerOrManager(caller : Principal) : Bool {
    switch (getUserByPrincipal(caller)) {
      case (null) { false };
      case (?user) { switch (user.role) { case (#owner) { true }; case (#manager) { true }; case (_) { false } } };
    };
  };

  func isKaragir(caller : Principal) : Bool {
    switch (getUserByPrincipal(caller)) {
      case (null) { false };
      case (?user) { switch (user.role) { case (#karagir) { true }; case (_) { false } } };
    };
  };

  func requireAuthenticated(caller : Principal) {
    if (getUserByPrincipal(caller) == null) {
      Runtime.trap("Unauthorized: Authentication required");
    };
  };

  func requireOwner(caller : Principal) {
    if (not isOwner(caller)) {
      Runtime.trap("Unauthorized: Only owners can perform this action");
    };
  };

  func requireOwnerOrManager(caller : Principal) {
    if (not isOwnerOrManager(caller)) {
      Runtime.trap("Unauthorized: Only owners or managers can perform this action");
    };
  };

  // AUTH

  public shared ({ caller }) func login(phone : Text, password : Text) : async UserDTO {
    if (phone == "" or password == "") { Runtime.trap("Invalid credentials") };
    switch (usersMap.get(phone)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (user.password != password) { Runtime.trap("Invalid credentials") };
        principalToPhoneMap.remove(caller);
        principalToPhoneMap.add(caller, phone);
        toUserDTO(user);
      };
    };
  };

  public shared ({ caller }) func createUser(userDTO : UserDTO) : async () {
    requireOwner(caller);
    if (userDTO.phone == "" or userDTO.password == "" or userDTO.name == "") { Runtime.trap("Invalid user data") };
    if (usersMap.get(userDTO.phone) != null) { Runtime.trap("User already exists") };
    usersMap.add(userDTO.phone, { phone = userDTO.phone; password = userDTO.password; role = userDTO.role; name = userDTO.name });
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuthenticated(caller);
    switch (getUserByPrincipal(caller)) {
      case (null) { null };
      case (?user) { ?toUserProfile(user) };
    };
  };

  public query ({ caller }) func getUserProfile(userPrincipal : Principal) : async ?UserProfile {
    requireAuthenticated(caller);
    switch (getUserByPrincipal(userPrincipal)) {
      case (null) { null };
      case (?user) { ?toUserProfile(user) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuthenticated(caller);
    switch (getUserByPrincipal(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?existingUser) {
        usersMap.remove(existingUser.phone);
        usersMap.add(existingUser.phone, { existingUser with name = profile.name });
      };
    };
  };

  // CUSTOMERS

  public shared ({ caller }) func addCustomer(customer : CustomerDTO) : async Text {
    requireAuthenticated(caller);
    customersMap.remove(customer.phone);
    customersMap.add(customer.phone, { customer with createdAt = Time.now() });
    customer.phone;
  };

  public query ({ caller }) func getCustomers() : async [CustomerDTO] {
    requireAuthenticated(caller);
    customersMap.values().toArray().map(func(c) { toCustomerDTO(c) });
  };

  public query ({ caller }) func getCustomer(phone : Text) : async ?Customer {
    requireAuthenticated(caller);
    customersMap.get(phone);
  };

  // GOLD RATES (multi-rate)

  public shared ({ caller }) func updateGoldRates(newRates : GoldRatesDTO) : async () {
    requireOwnerOrManager(caller);
    goldRates := { gold24k = newRates.gold24k; gold22k = newRates.gold22k; gold18k = newRates.gold18k; silver = newRates.silver; updatedAt = Time.now() };
  };

  public query ({ caller }) func getGoldRates() : async GoldRatesDTO {
    requireAuthenticated(caller);
    { gold24k = goldRates.gold24k; gold22k = goldRates.gold22k; gold18k = goldRates.gold18k; silver = goldRates.silver };
  };

  // Keep old single-rate endpoints for backward compatibility
  public shared ({ caller }) func updateGoldRate(newRate : { ratePerGram : Float }) : async () {
    requireOwnerOrManager(caller);
    goldRates := { goldRates with gold22k = newRate.ratePerGram; updatedAt = Time.now() };
  };

  public query ({ caller }) func getGoldRate() : async { ratePerGram : Float } {
    requireAuthenticated(caller);
    { ratePerGram = goldRates.gold22k };
  };

  // INVOICES

  func calculateTotalAmount(items : [InvoiceItem], gst : Bool, gstPercent : Float) : Float {
    let itemsTotal = items.foldLeft(0.0, func(acc, item) { acc + item.total });
    if (gst) { itemsTotal + (itemsTotal * gstPercent / 100.0) } else { itemsTotal };
  };

  public shared ({ caller }) func createInvoice(invoice : InvoiceDTO) : async Text {
    requireAuthenticated(caller);
    let id = getNextInvoiceId();
    let totalAmount = calculateTotalAmount(invoice.items, invoice.gst, invoice.gstPercent);
    let amountPaid = invoice.partialPayment;
    let udhar = totalAmount - amountPaid;
    invoicesMap.add(id, { invoice with id; createdAt = Time.now(); updatedAt = Time.now(); status = if (amountPaid >= totalAmount) { #paid } else if (amountPaid > 0.0) { #partial } else { #draft }; totalAmount; amountPaid; udhar });
    id;
  };

  public shared ({ caller }) func lockInvoice(id : Text) : async () {
    requireAuthenticated(caller);
    switch (invoicesMap.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) {
        invoicesMap.remove(id);
        invoicesMap.add(id, { invoice with status = #locked; updatedAt = Time.now() });
      };
    };
  };

  public shared ({ caller }) func updateInvoiceStatus(update : InvoiceUpdateDTO) : async () {
    requireAuthenticated(caller);
    switch (invoicesMap.get(update.id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) {
        invoicesMap.remove(update.id);
        invoicesMap.add(update.id, { invoice with status = update.status; updatedAt = Time.now() });
      };
    };
  };

  public query func getInvoice(id : Text) : async ?Invoice {
    invoicesMap.get(id);
  };

  public query ({ caller }) func getInvoices() : async [Invoice] {
    requireAuthenticated(caller);
    invoicesMap.values().toArray();
  };

  public query ({ caller }) func getInvoicesByCustomer(customerId : Text) : async [Invoice] {
    requireAuthenticated(caller);
    invoicesMap.values().toArray().filter(func(inv) { inv.customerId == customerId });
  };

  public query ({ caller }) func getPaidInvoices() : async [Invoice] {
    requireAuthenticated(caller);
    invoicesMap.values().toArray().filter(func(inv) { switch (inv.status) { case (#paid) { true }; case (_) { false } } });
  };

  public query ({ caller }) func getUnpaidInvoices() : async [Invoice] {
    requireAuthenticated(caller);
    invoicesMap.values().toArray().filter(func(inv) { switch (inv.status) { case (#paid) { false }; case (_) { true } } });
  };

  // UDHAR

  public shared ({ caller }) func receivePayment(invoiceId : Text, amount : Float) : async () {
    requireAuthenticated(caller);
    if (amount <= 0.0) { Runtime.trap("Invalid payment amount") };
    switch (invoicesMap.get(invoiceId)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) {
        let newAmountPaid = invoice.amountPaid + amount;
        let newUdhar = invoice.totalAmount - newAmountPaid;
        let newStatus = if (newUdhar <= 0.0) { #paid } else if (newAmountPaid > 0.0) { #partial } else { invoice.status };
        invoicesMap.remove(invoiceId);
        invoicesMap.add(invoiceId, { invoice with amountPaid = newAmountPaid; udhar = if (newUdhar < 0.0) { 0.0 } else { newUdhar }; status = newStatus; updatedAt = Time.now() });
      };
    };
  };

  public query ({ caller }) func getUdharLedger() : async [Invoice] {
    requireAuthenticated(caller);
    invoicesMap.values().toArray().filter(func(inv) { inv.udhar > 0.0 });
  };

  public query ({ caller }) func getPaymentHistory(customerId : Text) : async [Invoice] {
    requireAuthenticated(caller);
    invoicesMap.values().toArray().filter(func(inv) { inv.customerId == customerId and inv.amountPaid > 0.0 });
  };

  // REPORTS

  public query ({ caller }) func getTotalSales() : async Float {
    requireAuthenticated(caller);
    invoicesMap.values().toArray().foldLeft(0.0, func(acc, inv) { acc + inv.totalAmount });
  };

  public query ({ caller }) func getTotalUdharPending() : async Float {
    requireAuthenticated(caller);
    invoicesMap.values().toArray().foldLeft(0.0, func(acc, inv) { acc + inv.udhar });
  };

  public query ({ caller }) func getInvoiceCounts() : async { paid : Nat; unpaid : Nat; total : Nat } {
    requireAuthenticated(caller);
    let all = invoicesMap.values().toArray();
    let paidCount = all.filter(func(inv) { switch (inv.status) { case (#paid) { true }; case (_) { false } } }).size();
    { paid = paidCount; unpaid = all.size() - paidCount; total = all.size() };
  };

  // KARAGIR JOB ORDERS

  public shared ({ caller }) func createJobOrder(job : JobOrderDTO) : async Text {
    requireAuthenticated(caller);
    let id = (Time.now() / 1_000_000_000).toText();
    jobOrdersMap.add(id, { job with id; status = #pending; notes = ""; createdAt = Time.now(); updatedAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateJobOrder(update : JobOrderUpdateDTO) : async () {
    requireAuthenticated(caller);
    switch (jobOrdersMap.get(update.id)) {
      case (null) { Runtime.trap("Job order not found") };
      case (?job) {
        switch (getUserByPrincipal(caller)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            if (isKaragir(caller) and job.assignedKaragir != user.phone) {
              Runtime.trap("Unauthorized: Karagir can only update their own assigned jobs");
            };
          };
        };
        jobOrdersMap.remove(update.id);
        jobOrdersMap.add(update.id, { job with status = update.status; notes = update.notes; updatedAt = Time.now() });
      };
    };
  };

  public query ({ caller }) func getJobOrders() : async [JobOrder] {
    requireAuthenticated(caller);
    if (isKaragir(caller)) {
      switch (getUserByPrincipal(caller)) {
        case (null) { [] };
        case (?user) { jobOrdersMap.values().toArray().filter(func(job) { job.assignedKaragir == user.phone }) };
      };
    } else {
      jobOrdersMap.values().toArray();
    };
  };

  public query ({ caller }) func getJobOrder(id : Text) : async ?JobOrder {
    requireAuthenticated(caller);
    switch (jobOrdersMap.get(id)) {
      case (null) { null };
      case (?job) {
        if (isKaragir(caller)) {
          switch (getUserByPrincipal(caller)) {
            case (null) { null };
            case (?user) { if (job.assignedKaragir == user.phone) { ?job } else { null } };
          };
        } else { ?job };
      };
    };
  };

  // SETTINGS

  public shared ({ caller }) func updateSettings(newSettings : SettingsDTO) : async () {
    requireOwner(caller);
    settings := newSettings;
  };

  public query ({ caller }) func getSettings() : async SettingsDTO {
    requireAuthenticated(caller);
    toSettingsDTO(settings);
  };

  // REPAIR ORDERS

  public shared ({ caller }) func createRepairOrder(repairOrder : RepairOrderDTO) : async Text {
    requireAuthenticated(caller);
    let id = "RO-" # (Time.now() / 1_000_000_000).toText();
    repairOrdersMap.add(id, { repairOrder with id; status = #received; createdAt = Time.now(); updatedAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateRepairOrder(update : RepairOrderUpdateDTO) : async () {
    requireAuthenticated(caller);
    switch (repairOrdersMap.get(update.id)) {
      case (null) { Runtime.trap("Repair order not found") };
      case (?order) {
        repairOrdersMap.remove(update.id);
        repairOrdersMap.add(update.id, { order with status = update.status; notes = update.notes; updatedAt = Time.now() });
      };
    };
  };

  public query ({ caller }) func getRepairOrders() : async [RepairOrder] {
    requireAuthenticated(caller);
    repairOrdersMap.values().toArray();
  };

  public query ({ caller }) func getRepairOrder(id : Text) : async ?RepairOrder {
    requireAuthenticated(caller);
    repairOrdersMap.get(id);
  };

  // CUSTOM ORDERS

  public shared ({ caller }) func createCustomOrder(customOrder : CustomOrderDTO) : async Text {
    requireAuthenticated(caller);
    let id = "CO-" # (Time.now() / 1_000_000_000).toText();
    customOrdersMap.add(id, { customOrder with id; status = #received; createdAt = Time.now(); updatedAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateCustomOrder(update : CustomOrderUpdateDTO) : async () {
    requireAuthenticated(caller);
    switch (customOrdersMap.get(update.id)) {
      case (null) { Runtime.trap("Custom order not found") };
      case (?order) {
        customOrdersMap.remove(update.id);
        customOrdersMap.add(update.id, { order with status = update.status; designNotes = update.designNotes; updatedAt = Time.now() });
      };
    };
  };

  public query ({ caller }) func getCustomOrders() : async [CustomOrder] {
    requireAuthenticated(caller);
    customOrdersMap.values().toArray();
  };

  public query ({ caller }) func getCustomOrder(id : Text) : async ?CustomOrder {
    requireAuthenticated(caller);
    customOrdersMap.get(id);
  };

  // CREDENTIAL-BASED AUTH HELPERS (bypass session state - fixes post-deployment auth issues)

  func validateUserCreds(phone : Text, password : Text) : User {
    switch (usersMap.get(phone)) {
      case (null) { Runtime.trap("Unauthorized: User not found") };
      case (?user) {
        if (user.password != password) { Runtime.trap("Unauthorized: Invalid credentials") };
        user;
      };
    };
  };

  public shared func addCustomerWithCreds(phone : Text, password : Text, customer : CustomerDTO) : async Text {
    ignore validateUserCreds(phone, password);
    customersMap.remove(customer.phone);
    customersMap.add(customer.phone, { customer with createdAt = Time.now() });
    customer.phone;
  };

  public shared func updateGoldRatesWithCreds(phone : Text, password : Text, newRates : GoldRatesDTO) : async () {
    let user = validateUserCreds(phone, password);
    switch (user.role) {
      case (#owner) {};
      case (#manager) {};
      case (_) { Runtime.trap("Unauthorized: Only owners or managers can update rates") };
    };
    goldRates := { gold24k = newRates.gold24k; gold22k = newRates.gold22k; gold18k = newRates.gold18k; silver = newRates.silver; updatedAt = Time.now() };
  };

  public query func getGoldRatesPublic() : async GoldRatesDTO {
    { gold24k = goldRates.gold24k; gold22k = goldRates.gold22k; gold18k = goldRates.gold18k; silver = goldRates.silver };
  };

};
