import React, { useState } from 'react';
import { 
  Calculator, 
  FileText, 
  PlusCircle, 
  BarChart3, 
  BookOpen, 
  DollarSign,
  Receipt,
  CreditCard,
  TrendingUp,
  PieChart
} from 'lucide-react';

// Sub-components imports
import ChartOfAccounts from '../components/accounting/ChartOfAccounts';
import JournalEntry from '../components/accounting/JournalEntry';
import GeneralLedger from '../components/accounting/GeneralLedger';
import TrialBalance from '../components/accounting/TrialBalance';
import FinancialReports from '../components/accounting/FinancialReports';
import VoucherEntry from '../components/accounting/VoucherEntry';

interface AccountingModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  color: string;
  roles: string[];
}

const Accounting: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('overview');

  const accountingModules: AccountingModule[] = [
    {
      id: 'chart-of-accounts',
      title: 'Chart of Accounts',
      description: 'Manage account structure and hierarchy',
      icon: <BookOpen className="w-6 h-6" />,
      component: ChartOfAccounts,
      color: 'bg-blue-500',
      roles: ['admin', 'accountant', 'manager']
    },
    {
      id: 'journal-entry',
      title: 'Journal Entries',
      description: 'Create and manage journal entries',
      icon: <FileText className="w-6 h-6" />,
      component: JournalEntry,
      color: 'bg-green-500',
      roles: ['admin', 'accountant', 'manager']
    },
    {
      id: 'voucher-entry',
      title: 'Voucher Entry',
      description: 'Cash, bank, and payment vouchers',
      icon: <Receipt className="w-6 h-6" />,
      component: VoucherEntry,
      color: 'bg-purple-500',
      roles: ['admin', 'accountant', 'manager']
    },
    {
      id: 'general-ledger',
      title: 'General Ledger',
      description: 'View account transactions and balances',
      icon: <Calculator className="w-6 h-6" />,
      component: GeneralLedger,
      color: 'bg-indigo-500',
      roles: ['admin', 'accountant', 'manager']
    },
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      description: 'Trial balance and account summaries',
      icon: <BarChart3 className="w-6 h-6" />,
      component: TrialBalance,
      color: 'bg-orange-500',
      roles: ['admin', 'accountant', 'manager']
    },
    {
      id: 'financial-reports',
      title: 'Financial Reports',
      description: 'P&L, Balance Sheet, Cash Flow statements',
      icon: <PieChart className="w-6 h-6" />,
      component: FinancialReports,
      color: 'bg-red-500',
      roles: ['admin', 'accountant', 'manager']
    }
  ];

  // Mock financial overview data
  const financialOverview = {
    totalAssets: 2156780.50,
    totalLiabilities: 987654.25,
    totalEquity: 1169126.25,
    monthlyRevenue: 456789.30,
    monthlyExpenses: 321456.78,
    netIncome: 135332.52,
    accountsReceivable: 234567.89,
    accountsPayable: 123456.78,
    cashBalance: 567890.12,
    openJournalEntries: 12,
    pendingApprovals: 5,
    monthlyTransactions: 1247
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderActiveComponent = () => {
    const module = accountingModules.find(m => m.id === activeModule);
    if (module) {
      const Component = module.component;
      return <Component />;
    }
    return null;
  };

  if (activeModule !== 'overview') {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveModule('overview')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              ← Back to Accounting Overview
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {accountingModules.find(m => m.id === activeModule)?.title}
              </h1>
              <p className="text-gray-600">
                {accountingModules.find(m => m.id === activeModule)?.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Render active component */}
        {renderActiveComponent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounting & Finance</h1>
        <p className="text-gray-600 mt-1">
          Complete accounting system with Chart of Accounts, Journal Entries, and Financial Reports
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(financialOverview.totalAssets)}
              </p>
              <p className="text-sm text-green-600 mt-1">+8.5% from last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(financialOverview.netIncome)}
              </p>
              <p className="text-sm text-blue-600 mt-1">+12.3% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cash Balance</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(financialOverview.cashBalance)}
              </p>
              <p className="text-sm text-purple-600 mt-1">+5.7% from last month</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {financialOverview.pendingApprovals}
              </p>
              <p className="text-sm text-orange-600 mt-1">Requires attention</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Financial Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Position Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">Balance Sheet</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Assets:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(financialOverview.totalAssets)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Liabilities:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(financialOverview.totalLiabilities)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Total Equity:</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(financialOverview.totalEquity)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">Accounts Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Accounts Receivable:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(financialOverview.accountsReceivable)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Accounts Payable:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(financialOverview.accountsPayable)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Net Position:</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(financialOverview.accountsReceivable - financialOverview.accountsPayable)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">Activity Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Open Journal Entries:</span>
                <span className="text-sm font-medium text-gray-900">
                  {financialOverview.openJournalEntries}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Transactions:</span>
                <span className="text-sm font-medium text-gray-900">
                  {financialOverview.monthlyTransactions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">Pending Approvals:</span>
                <span className="text-sm font-medium text-orange-600">
                  {financialOverview.pendingApprovals}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountingModules.map((module) => (
          <div key={module.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg text-white ${module.color}`}>
                  {module.icon}
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Accounting
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{module.description}</p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveModule(module.id)}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Open Module
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveModule('journal-entry')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PlusCircle className="w-5 h-5 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">New Journal Entry</div>
              <div className="text-sm text-gray-600">Create journal entry</div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveModule('voucher-entry')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Receipt className="w-5 h-5 text-purple-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">New Voucher</div>
              <div className="text-sm text-gray-600">Cash/Bank voucher</div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveModule('trial-balance')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-orange-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Trial Balance</div>
              <div className="text-sm text-gray-600">View account balances</div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveModule('financial-reports')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-red-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Financial Reports</div>
              <div className="text-sm text-gray-600">Generate reports</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Accounting;