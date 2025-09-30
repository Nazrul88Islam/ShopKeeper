import { api } from './baseApi';
import type { ApiResponse } from './baseApi';

// Chart of Accounts Types
export interface Account {
  _id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  accountCategory: string;
  accountSubCategory?: string;
  parentAccount?: string;
  level: number;
  normalBalance: 'DEBIT' | 'CREDIT';
  currentBalance: number;
  description?: string;
  isActive: boolean;
  isSystemAccount: boolean;
  allowPosting: boolean;
  bankAccount?: {
    isBank: boolean;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountType?: 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET' | 'CD';
  };
  budgetInfo?: {
    budgetAmount: number;
    budgetPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  };
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  accountCategory: string;
  accountSubCategory?: string;
  parentAccount?: string;
  description?: string;
  bankAccount?: {
    isBank: boolean;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountType?: 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET' | 'CD';
  };
  budgetInfo?: {
    budgetAmount: number;
    budgetPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  };
  tags?: string[];
  notes?: string;
}

export interface JournalEntry {
  _id: string;
  voucherNumber: string;
  voucherType: 'JOURNAL' | 'CASH_RECEIPT' | 'CASH_PAYMENT' | 'BANK_RECEIPT' | 'BANK_PAYMENT' | 'PURCHASE' | 'SALES' | 'ADJUSTMENT' | 'OPENING' | 'CLOSING';
  date: string;
  description: string;
  referenceNumber?: string;
  entries: Array<{
    _id: string;
    account: string | Account;
    description: string;
    debitAmount: number;
    creditAmount: number;
    department?: string;
    project?: string;
    costCenter?: string;
  }>;
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';
  createdBy: string;
  approvedBy?: string;
  postedBy?: string;
  postedDate?: string;
  approvalDate?: string;
  reversalEntry?: string;
  reversedEntry?: string;
  reversalReason?: string;
  reversalDate?: string;
  sourceDocument?: {
    type: 'ORDER' | 'INVOICE' | 'RECEIPT' | 'PAYMENT' | 'MANUAL' | 'SYSTEM';
    id?: string;
    number?: string;
  };
  fiscalYear: number;
  fiscalPeriod: number;
  currency: 'BDT' | 'USD' | 'EUR' | 'CNY';
  exchangeRate: number;
  requiresApproval: boolean;
  approvalWorkflow?: {
    level1?: {
      user?: string;
      approved?: boolean;
      date?: string;
      comments?: string;
    };
    level2?: {
      user?: string;
      approved?: boolean;
      date?: string;
      comments?: string;
    };
  };
  attachments: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadDate: string;
  }>;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  isBalanced?: boolean;
  canBePosted?: boolean;
  isReversible?: boolean;
}

export interface CreateJournalEntryRequest {
  voucherType: 'JOURNAL' | 'CASH_RECEIPT' | 'CASH_PAYMENT' | 'BANK_RECEIPT' | 'BANK_PAYMENT' | 'PURCHASE' | 'SALES' | 'ADJUSTMENT' | 'OPENING' | 'CLOSING';
  date: string;
  description: string;
  referenceNumber?: string;
  entries: Array<{
    account: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    department?: string;
    project?: string;
    costCenter?: string;
  }>;
  currency?: 'BDT' | 'USD' | 'EUR' | 'CNY';
  exchangeRate?: number;
  requiresApproval?: boolean;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }>;
  tags?: string[];
  notes?: string;
  sourceDocument?: {
    type: 'ORDER' | 'INVOICE' | 'RECEIPT' | 'PAYMENT' | 'MANUAL' | 'SYSTEM';
    id?: string;
    number?: string;
  };
}

export interface VoucherType {
  value: 'JOURNAL' | 'CASH_RECEIPT' | 'CASH_PAYMENT' | 'BANK_RECEIPT' | 'BANK_PAYMENT' | 'PURCHASE' | 'SALES' | 'ADJUSTMENT' | 'OPENING' | 'CLOSING';
  label: string;
  prefix: string;
}

export interface VoucherStats {
  summary: {
    totalEntries: number;
    totalDebits: number;
    totalCredits: number;
    averageAmount: number;
  };
  statusBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  voucherTypeBreakdown: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

export interface BalanceValidation {
  totalDebits: number;
  totalCredits: number;
  difference: number;
  isBalanced: boolean;
}

export interface TrialBalance {
  accounts: Array<{
    account: Account;
    debitBalance: number;
    creditBalance: number;
    netBalance: number;
  }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  asOfDate: string;
}

export interface FinancialReport {
  reportType: 'income-statement' | 'balance-sheet' | 'cash-flow';
  data: any;
  period: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

// Accounting API
export const accountingApi = {
  // Chart of Accounts
  getChartOfAccounts: (params?: {
    type?: string;
    category?: string;
    isActive?: boolean;
    includeBalance?: boolean;
  }): Promise<ApiResponse<Account[]>> =>
    api.get('/accounting/chart-of-accounts', params),

  getAccount: (accountId: string): Promise<ApiResponse<Account>> =>
    api.get(`/accounting/chart-of-accounts/${accountId}`),

  createAccount: (data: CreateAccountRequest): Promise<ApiResponse<Account>> =>
    api.post('/accounting/chart-of-accounts', data),

  updateAccount: (accountId: string, data: Partial<CreateAccountRequest>): Promise<ApiResponse<Account>> =>
    api.put(`/accounting/chart-of-accounts/${accountId}`, data),

  deleteAccount: (accountId: string): Promise<ApiResponse<null>> =>
    api.delete(`/accounting/chart-of-accounts/${accountId}`),

  initializeDefaultAccounts: (): Promise<ApiResponse<null>> =>
    api.post('/accounting/initialize-accounts'),

  // Journal Entries
  getJournalEntries: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    voucherType?: string;
    dateFrom?: string;
    dateTo?: string;
    account?: string;
  }): Promise<ApiResponse<JournalEntry[]>> =>
    api.get('/accounting/journal-entries', params),

  getJournalEntry: (entryId: string): Promise<ApiResponse<JournalEntry>> =>
    api.get(`/accounting/journal-entries/${entryId}`),

  createJournalEntry: (data: CreateJournalEntryRequest): Promise<ApiResponse<JournalEntry>> =>
    api.post('/accounting/journal-entries', data),

  updateJournalEntry: (entryId: string, data: Partial<CreateJournalEntryRequest>): Promise<ApiResponse<JournalEntry>> =>
    api.put(`/accounting/journal-entries/${entryId}`, data),

  deleteJournalEntry: (entryId: string): Promise<ApiResponse<null>> =>
    api.delete(`/accounting/journal-entries/${entryId}`),

  // Voucher Entry Operations
  getTrialBalance: (params?: {
    asOfDate?: string;
    fiscalYear?: number;
    fiscalPeriod?: number;
  }): Promise<ApiResponse<TrialBalance>> =>
    api.get('/accounting/trial-balance', params),

  getGeneralLedger: (accountId: string, params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    account: Account;
    entries: Array<{
      date: string;
      voucherNumber: string;
      voucherType: string;
      description: string;
      debitAmount: number;
      creditAmount: number;
      balance: number;
    }>;
  }>> =>
    api.get(`/accounting/general-ledger/${accountId}`, params),

  getFinancialReport: (reportType: 'income-statement' | 'balance-sheet' | 'cash-flow', params?: {
    dateFrom?: string;
    dateTo?: string;
    fiscalYear?: number;
    format?: 'summary' | 'detailed';
  }): Promise<ApiResponse<FinancialReport>> =>
    api.get(`/accounting/financial-reports/${reportType}`, params),

  // Account Balance Operations
  updateAccountBalance: (accountId: string, data: {
    amount: number;
    isDebit: boolean;
    description: string;
  }): Promise<ApiResponse<Account>> =>
    api.patch(`/accounting/chart-of-accounts/${accountId}/balance`, data),

  getAccountBalance: (accountId: string, params?: {
    asOfDate?: string;
  }): Promise<ApiResponse<{
    account: Account;
    balance: number;
    asOfDate: string;
  }>> =>
    api.get(`/accounting/chart-of-accounts/${accountId}/balance`, params),

  // Account Hierarchy
  getAccountHierarchy: (accountId?: string): Promise<ApiResponse<{
    account: Account;
    children: any[];
  }>> =>
    api.get('/accounting/chart-of-accounts/hierarchy', accountId ? { parentId: accountId } : {}),

  getAccountsByType: (accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'): Promise<ApiResponse<Account[]>> =>
    api.get('/accounting/chart-of-accounts/by-type', { type: accountType }),

  // Financial Analysis
  getFinancialSummary: (params?: {
    period?: 'monthly' | 'quarterly' | 'yearly';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    grossMargin: number;
    operatingMargin: number;
  }>> =>
    api.get('/accounting/financial-summary', params),

  getCashFlow: (params?: {
    dateFrom?: string;
    dateTo?: string;
    format?: 'direct' | 'indirect';
  }): Promise<ApiResponse<{
    operatingActivities: {
      netIncome: number;
      adjustments: Array<{
        item: string;
        amount: number;
      }>;
      workingCapitalChanges: Array<{
        item: string;
        amount: number;
      }>;
      netOperatingCashFlow: number;
    };
    investingActivities: {
      activities: Array<{
        item: string;
        amount: number;
      }>;
      netInvestingCashFlow: number;
    };
    financingActivities: {
      activities: Array<{
        item: string;
        amount: number;
      }>;
      netFinancingCashFlow: number;
    };
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  }>> =>
    api.get('/accounting/cash-flow', params),

  // Budget and Forecasting
  getBudgetComparison: (params?: {
    fiscalYear?: number;
    period?: number;
    accountType?: string;
  }): Promise<ApiResponse<Array<{
    account: Account;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
  }>>> =>
    api.get('/accounting/budget-comparison', params),

  // Export and Backup
  exportChartOfAccounts: (params?: {
    format: 'csv' | 'excel' | 'pdf';
    includeBalances?: boolean;
    accountType?: string;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/accounting/export/chart-of-accounts', params),

  exportJournalEntries: (params?: {
    format: 'csv' | 'excel' | 'pdf';
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/accounting/export/journal-entries', params),

  exportFinancialReports: (params: {
    reportType: 'income-statement' | 'balance-sheet' | 'cash-flow' | 'trial-balance';
    format: 'csv' | 'excel' | 'pdf';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{ downloadUrl: string }>> =>
    api.post('/accounting/export/financial-reports', params),

  // Voucher Entry Operations
  getNextVoucherNumber: (voucherType: string, date?: string): Promise<ApiResponse<{
    nextVoucherNumber: string;
    voucherType: string;
    date: string;
  }>> =>
    api.get('/accounting/next-voucher-number', { voucherType, date }),

  getVoucherTypes: (): Promise<ApiResponse<VoucherType[]>> =>
    api.get('/accounting/voucher-types'),

  validateBalance: (entries: Array<{
    account: string;
    debitAmount: number;
    creditAmount: number;
  }>): Promise<ApiResponse<BalanceValidation>> =>
    api.post('/accounting/journal-entries/validate-balance', { entries }),

  postJournalEntry: (entryId: string): Promise<ApiResponse<JournalEntry>> =>
    api.post(`/accounting/journal-entries/${entryId}/post`),

  reverseJournalEntry: (entryId: string, reason: string): Promise<ApiResponse<{
    originalEntry: JournalEntry;
    reversalEntry: JournalEntry;
  }>> =>
    api.post(`/accounting/journal-entries/${entryId}/reverse`, { reason }),

  cancelJournalEntry: (entryId: string, reason: string): Promise<ApiResponse<JournalEntry>> =>
    api.post(`/accounting/journal-entries/${entryId}/cancel`, { reason }),

  duplicateJournalEntry: (entryId: string, data?: {
    referenceNumber?: string;
    notes?: string;
  }): Promise<ApiResponse<JournalEntry>> =>
    api.post(`/accounting/journal-entries/${entryId}/duplicate`, data),

  getJournalEntryStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
    voucherType?: string;
  }): Promise<ApiResponse<VoucherStats>> =>
    api.get('/accounting/journal-entries/stats', params),

  // Real-time voucher operations
  getJournalEntriesRealTime: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    voucherType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<ApiResponse<JournalEntry[]>> =>
    api.get('/accounting/journal-entries', params),

  // Advanced journal entry operations
  bulkPostEntries: (entryIds: string[]): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }>> =>
    api.post('/accounting/journal-entries/bulk-post', { entryIds }),

  bulkDeleteEntries: (entryIds: string[]): Promise<ApiResponse<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }>> =>
    api.post('/accounting/journal-entries/bulk-delete', { entryIds }),

  // Audit Trail
  getAuditTrail: (params?: {
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    id: string;
    action: string;
    account?: Account;
    journalEntry?: JournalEntry;
    user: any;
    timestamp: string;
    details: any;
  }>>> =>
    api.get('/accounting/audit-trail', params),
};

export default accountingApi;