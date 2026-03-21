import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Role = {
    #owner;
    #manager;
    #staff;
    #karagir;
  };

  module Role {
    public func compare(a : Role, b : Role) : Order.Order {
      switch (a, b) {
        case (#owner, #owner) { #equal };
        case (#manager, #manager) { #equal };
        case (#staff, #staff) { #equal };
        case (#karagir, #karagir) { #equal };
        case (#owner, _) { #less };
        case (_, #owner) { #greater };
        case (#manager, _) { #less };
        case (_, #manager) { #greater };
        case (#staff, #karagir) { #greater };
      };
    };
  };

  type User = {
    phone : Text;
    password : Text;
    role : Role;
    name : Text;
  };

  module User {
    public func compare(a : User, b : User) : Order.Order {
      switch (Text.compare(a.phone, b.phone)) {
        case (#equal) { Text.compare(a.name, b.name) };
        case (order) { order };
      };
    };
  };

  type UserDTO = {
    phone : Text;
    password : Text;
    role : Role;
    name : Text;
  };

  type UserProfile = {
    phone : Text;
    role : Role;
    name : Text;
  };

  type Customer = {
    name : Text;
    phone : Text;
    address : Text;
    createdAt : Time.Time;
  };

  module Customer {
    public func compare(a : Customer, b : Customer) : Order.Order {
      switch (Text.compare(a.phone, b.phone)) {
        case (#equal) { Text.compare(a.name, b.name) };
        case (order) { order };
      };
    };
  };

  type CustomerDTO = {
    name : Text;
    phone : Text;
    address : Text;
  };

  type GoldRate = {
    ratePerGram : Float;
    updatedAt : Time.Time;
  };

  type GoldRateDTO = {
    ratePerGram : Float;
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

  module Invoice {
    public func compare(a : Invoice, b : Invoice) : Order.Order {
      Text.compare(a.id, b.id);
    };
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

  type InvoiceItem = {
    description : Text;
    purity : Float;
    weight : Float;
    rate : Float;
    total : Float;
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

  module JobOrder {
    public func compare(a : JobOrder, b : JobOrder) : Order.Order {
      Text.compare(a.id, b.id);
    };
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

  module Settings {
    public func compare(a : Settings, b : Settings) : Order.Order {
      switch (Text.compare(a.shopName, b.shopName)) {
        case (#equal) { Text.compare(a.phone, b.phone) };
        case (order) { order };
      };
    };
  };

  type SettingsDTO = {
    shopName : Text;
    address : Text;
    phone : Text;
    gstNumber : Text;
    defaultLanguage : Text;
  };

  let usersMap = Map.empty<Text, User>();
  let principalToPhoneMap = Map.empty<Principal, Text>();
  let customersMap = Map.empty<Text, Customer>();
  let invoicesMap = Map.empty<Text, Invoice>();
  let jobOrdersMap = Map.empty<Text, JobOrder>();
  var goldRate : GoldRate = { ratePerGram = 0.0; updatedAt = 0 };
  var settings : Settings = {
    shopName = "OMKAR JWELLERS";
    address = "";
    phone = "";
    gstNumber = "";
    defaultLanguage = "english";
  };
  var invoiceCounter = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Pre-seed demo accounts
  func initDemoAccounts() {
    let owner : User = {
      phone = "9999999999";
      password = "owner123";
      role = #owner;
      name = "Owner";
    };
    let manager : User = {
      phone = "8888888888";
      password = "manager123";
      role = #manager;
      name = "Manager";
    };
    let staff : User = {
      phone = "7777777777";
      password = "staff123";
      role = #staff;
      name = "Staff";
    };
    let karagir : User = {
      phone = "6666666666";
      password = "karagir123";
      role = #karagir;
      name = "Karagir";
    };
    usersMap.add(owner.phone, owner);
    usersMap.add(manager.phone, manager);
    usersMap.add(staff.phone, staff);
    usersMap.add(karagir.phone, karagir);
  };

  initDemoAccounts();

  func toUserDTO(user : User) : UserDTO {
    {
      phone = user.phone;
      password = "";
      role = user.role;
      name = user.name;
    };
  };

  func toUserProfile(user : User) : UserProfile {
    {
      phone = user.phone;
      role = user.role;
      name = user.name;
    };
  };

  func toCustomerDTO(customer : Customer) : CustomerDTO {
    {
      name = customer.name;
      phone = customer.phone;
      address = customer.address;
    };
  };

  func toInvoiceDTO(invoice : Invoice) : InvoiceDTO {
    {
      customerId = invoice.customerId;
      items = invoice.items;
      gst = invoice.gst;
      gstPercent = invoice.gstPercent;
      notes = invoice.notes;
      partialPayment = invoice.partialPayment;
      language = invoice.language;
    };
  };

  func toJobOrderDTO(job : JobOrder) : JobOrderDTO {
    {
      customerName = job.customerName;
      description = job.description;
      assignedKaragir = job.assignedKaragir;
      dueDate = job.dueDate;
    };
  };

  func toSettingsDTO(settings : Settings) : SettingsDTO {
    {
      shopName = settings.shopName;
      address = settings.address;
      phone = settings.phone;
      gstNumber = settings.gstNumber;
      defaultLanguage = settings.defaultLanguage;
    };
  };

  func getNextInvoiceId() : Text {
    invoiceCounter += 1;
    let numStr = invoiceCounter.toText();
    let padding = if (invoiceCounter < 10) {
      "000";
    } else if (invoiceCounter < 100) {
      "00";
    } else if (invoiceCounter < 1000) {
      "0";
    } else {
      "";
    };
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
      case (?user) {
        switch (user.role) {
          case (#owner) { true };
          case (_) { false };
        };
      };
    };
  };

  func isOwnerOrManager(caller : Principal) : Bool {
    switch (getUserByPrincipal(caller)) {
      case (null) { false };
      case (?user) {
        switch (user.role) {
          case (#owner) { true };
          case (#manager) { true };
          case (_) { false };
        };
      };
    };
  };

  func isKaragir(caller : Principal) : Bool {
    switch (getUserByPrincipal(caller)) {
      case (null) { false };
      case (?user) {
        switch (user.role) {
          case (#karagir) { true };
          case (_) { false };
        };
      };
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

  // AUTH FUNCTIONS

  public shared ({ caller }) func login(phone : Text, password : Text) : async UserDTO {
    if (phone == "" or password == "") {
      Runtime.trap("Invalid credentials");
    };
    switch (usersMap.get(phone)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (user.password != password) {
          Runtime.trap("Invalid credentials");
        };
        principalToPhoneMap.add(caller, phone);

        // Map custom roles to AccessControl roles
        switch (user.role) {
          case (#owner) {
            AccessControl.assignRole(accessControlState, caller, caller, #admin);
          };
          case (#manager) {
            AccessControl.assignRole(accessControlState, caller, caller, #user);
          };
          case (#staff) {
            AccessControl.assignRole(accessControlState, caller, caller, #user);
          };
          case (#karagir) {
            AccessControl.assignRole(accessControlState, caller, caller, #user);
          };
        };

        toUserDTO(user);
      };
    };
  };

  public shared ({ caller }) func createUser(userDTO : UserDTO) : async () {
    requireOwner(caller);

    if (userDTO.phone == "" or userDTO.password == "" or userDTO.name == "") {
      Runtime.trap("Invalid user data");
    };
    if (usersMap.get(userDTO.phone) != null) {
      Runtime.trap("User already exists");
    };
    let user = {
      phone = userDTO.phone;
      password = userDTO.password;
      role = userDTO.role;
      name = userDTO.name;
    };
    usersMap.add(userDTO.phone, user);
  };

  // USER PROFILE FUNCTIONS (required by frontend)

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (getUserByPrincipal(caller)) {
      case (null) { null };
      case (?user) { ?toUserProfile(user) };
    };
  };

  public query ({ caller }) func getUserProfile(userPrincipal : Principal) : async ?UserProfile {
    if (caller != userPrincipal and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (getUserByPrincipal(userPrincipal)) {
      case (null) { null };
      case (?user) { ?toUserProfile(user) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    switch (getUserByPrincipal(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?existingUser) {
        let updatedUser = {
          existingUser with
          name = profile.name;
        };
        usersMap.add(existingUser.phone, updatedUser);
      };
    };
  };

  // CUSTOMER FUNCTIONS

  public shared ({ caller }) func addCustomer(customer : CustomerDTO) : async Text {
    requireAuthenticated(caller);

    let newCustomer = {
      customer with
      createdAt = Time.now();
    };
    customersMap.add(customer.phone, newCustomer);
    customer.phone;
  };

  public query ({ caller }) func getCustomers() : async [CustomerDTO] {
    requireAuthenticated(caller);

    customersMap.values().toArray().map(func(customer) { toCustomerDTO(customer) });
  };

  public query ({ caller }) func getCustomer(phone : Text) : async ?Customer {
    requireAuthenticated(caller);

    customersMap.get(phone);
  };

  // GOLD RATE FUNCTIONS

  public shared ({ caller }) func updateGoldRate(newRate : GoldRateDTO) : async () {
    requireOwnerOrManager(caller);

    if (newRate.ratePerGram <= 0.0) {
      Runtime.trap("Invalid gold rate");
    };
    goldRate := {
      ratePerGram = newRate.ratePerGram;
      updatedAt = Time.now();
    };
  };

  public query ({ caller }) func getGoldRate() : async GoldRateDTO {
    requireAuthenticated(caller);

    { ratePerGram = goldRate.ratePerGram };
  };

  // INVOICE FUNCTIONS

  func calculateTotalAmount(items : [InvoiceItem], gst : Bool, gstPercent : Float) : Float {
    let itemsTotal = items.foldLeft(
      0.0,
      func(acc, item) { acc + item.total },
    );
    if (gst) {
      itemsTotal + (itemsTotal * gstPercent / 100.0);
    } else {
      itemsTotal;
    };
  };

  public shared ({ caller }) func createInvoice(invoice : InvoiceDTO) : async Text {
    requireAuthenticated(caller);

    let id = getNextInvoiceId();
    let totalAmount = calculateTotalAmount(invoice.items, invoice.gst, invoice.gstPercent);
    let amountPaid = invoice.partialPayment;
    let udhar = totalAmount - amountPaid;
    let newInvoice = {
      invoice with
      id;
      createdAt = Time.now();
      updatedAt = Time.now();
      status = if (amountPaid >= totalAmount) { #paid } else if (amountPaid > 0.0) {
        #partial;
      } else { #draft };
      totalAmount;
      amountPaid;
      udhar;
    };
    invoicesMap.add(id, newInvoice);
    id;
  };

  public shared ({ caller }) func lockInvoice(id : Text) : async () {
    requireAuthenticated(caller);

    switch (invoicesMap.get(id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) {
        let updatedInvoice = {
          invoice with
          status = #locked;
          updatedAt = Time.now();
        };
        invoicesMap.add(id, updatedInvoice);
      };
    };
  };

  public shared ({ caller }) func updateInvoiceStatus(update : InvoiceUpdateDTO) : async () {
    requireAuthenticated(caller);

    switch (invoicesMap.get(update.id)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) {
        let updatedInvoice = {
          invoice with
          status = update.status;
          updatedAt = Time.now();
        };
        invoicesMap.add(update.id, updatedInvoice);
      };
    };
  };

  // PUBLIC - no auth needed for WhatsApp sharing
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

    invoicesMap.values().toArray().filter(func(inv) {
      switch (inv.status) {
        case (#paid) { true };
        case (_) { false };
      };
    });
  };

  public query ({ caller }) func getUnpaidInvoices() : async [Invoice] {
    requireAuthenticated(caller);

    invoicesMap.values().toArray().filter(func(inv) {
      switch (inv.status) {
        case (#paid) { false };
        case (_) { true };
      };
    });
  };

  // UDHAR (CREDIT) FUNCTIONS

  public shared ({ caller }) func receivePayment(invoiceId : Text, amount : Float) : async () {
    requireAuthenticated(caller);

    if (amount <= 0.0) {
      Runtime.trap("Invalid payment amount");
    };

    switch (invoicesMap.get(invoiceId)) {
      case (null) { Runtime.trap("Invoice not found") };
      case (?invoice) {
        let newAmountPaid = invoice.amountPaid + amount;
        let newUdhar = invoice.totalAmount - newAmountPaid;
        let newStatus = if (newUdhar <= 0.0) {
          #paid;
        } else if (newAmountPaid > 0.0) {
          #partial;
        } else {
          invoice.status;
        };

        let updatedInvoice = {
          invoice with
          amountPaid = newAmountPaid;
          udhar = if (newUdhar < 0.0) { 0.0 } else { newUdhar };
          status = newStatus;
          updatedAt = Time.now();
        };
        invoicesMap.add(invoiceId, updatedInvoice);
      };
    };
  };

  public query ({ caller }) func getUdharLedger() : async [Invoice] {
    requireAuthenticated(caller);

    invoicesMap.values().toArray().filter(func(inv) { inv.udhar > 0.0 });
  };

  public query ({ caller }) func getPaymentHistory(customerId : Text) : async [Invoice] {
    requireAuthenticated(caller);

    invoicesMap.values().toArray().filter(func(inv) {
      inv.customerId == customerId and inv.amountPaid > 0.0;
    });
  };

  // REPORTS

  public query ({ caller }) func getTotalSales() : async Float {
    requireAuthenticated(caller);

    invoicesMap.values().toArray().foldLeft(
      0.0,
      func(acc, inv) { acc + inv.totalAmount },
    );
  };

  public query ({ caller }) func getTotalUdharPending() : async Float {
    requireAuthenticated(caller);

    invoicesMap.values().toArray().foldLeft(
      0.0,
      func(acc, inv) { acc + inv.udhar },
    );
  };

  public query ({ caller }) func getInvoiceCounts() : async { paid : Nat; unpaid : Nat; total : Nat } {
    requireAuthenticated(caller);

    let allInvoices = invoicesMap.values().toArray();
    let paidCount = allInvoices.filter(func(inv) {
      switch (inv.status) {
        case (#paid) { true };
        case (_) { false };
      };
    }).size();

    {
      paid = paidCount;
      unpaid = allInvoices.size() - paidCount;
      total = allInvoices.size();
    };
  };

  // KARAGIR JOB ORDER FUNCTIONS

  public shared ({ caller }) func createJobOrder(job : JobOrderDTO) : async Text {
    requireAuthenticated(caller);

    let id = (Time.now() / 1_000_000_000).toText();
    let newJob = {
      job with
      id;
      status = #pending;
      notes = "";
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    jobOrdersMap.add(id, newJob);
    id;
  };

  public shared ({ caller }) func updateJobOrder(update : JobOrderUpdateDTO) : async () {
    requireAuthenticated(caller);

    switch (jobOrdersMap.get(update.id)) {
      case (null) { Runtime.trap("Job order not found") };
      case (?job) {
        // Karagir can only update their own jobs
        switch (getUserByPrincipal(caller)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            if (isKaragir(caller) and job.assignedKaragir != user.phone) {
              Runtime.trap("Unauthorized: Karagir can only update their own assigned jobs");
            };
          };
        };

        let updatedJob = {
          job with
          status = update.status;
          notes = update.notes;
          updatedAt = Time.now();
        };
        jobOrdersMap.add(update.id, updatedJob);
      };
    };
  };

  public query ({ caller }) func getJobOrders() : async [JobOrder] {
    requireAuthenticated(caller);

    // Karagir can only see their own jobs
    if (isKaragir(caller)) {
      switch (getUserByPrincipal(caller)) {
        case (null) { [] };
        case (?user) {
          jobOrdersMap.values().toArray().filter(func(job) {
            job.assignedKaragir == user.phone;
          });
        };
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
        // Karagir can only view their own jobs
        if (isKaragir(caller)) {
          switch (getUserByPrincipal(caller)) {
            case (null) { null };
            case (?user) {
              if (job.assignedKaragir == user.phone) {
                ?job;
              } else {
                null;
              };
            };
          };
        } else {
          ?job;
        };
      };
    };
  };

  // SETTINGS FUNCTIONS

  public shared ({ caller }) func updateSettings(newSettings : SettingsDTO) : async () {
    requireOwner(caller);

    settings := newSettings;
  };

  public query ({ caller }) func getSettings() : async SettingsDTO {
    requireAuthenticated(caller);

    toSettingsDTO(settings);
  };
};
