
// src/app/core/services/financial.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Account, Transaction, ChargeCode, Employee, User, Permission } from '../models/financial.model';
import financialDb from '../temp-database/financial-db.json';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private accounts: Account[] = financialDb.accounts;
  private employees: Employee[] = financialDb.employees;
  private chargeCodes: ChargeCode[] = financialDb.charge_codes;
  private transactions: Transaction[] = []; // In-memory for now, extend JSON if needed
  private users: User[] = [
    { id: 1, name: 'Employee1', role: 'Employee' },
    { id: 2, name: 'Employee2', role: 'Employee' },
    { id: 3, name: 'Employee3', role: 'Employee' },
    { id: 4, name: 'Manager1', role: 'Manager' },
    { id: 5, name: 'Admin1', role: 'Admin' }
  ];
  private permissions: Permission[] = [
    { id: 1, user_id: 1, account_id: 1, can_view: true },
    { id: 2, user_id: 1, account_id: 2, can_view: true },
    { id: 3, user_id: 2, account_id: 3, can_view: true },
    { id: 4, user_id: 2, account_id: 4, can_view: true },
    { id: 5, user_id: 3, account_id: 5, can_view: true },
    { id: 6, user_id: 3, account_id: 6, can_view: true },
    { id: 7, user_id: 4, account_id: 1, can_view: true },
    { id: 8, user_id: 4, account_id: 2, can_view: true },
    { id: 9, user_id: 4, account_id: 3, can_view: true },
    { id: 10, user_id: 4, account_id: 4, can_view: true },
    { id: 11, user_id: 4, account_id: 5, can_view: true },
    { id: 12, user_id: 4, account_id: 6, can_view: true },
    { id: 13, user_id: 4, account_id: 7, can_view: true },
    { id: 14, user_id: 4, account_id: 8, can_view: true },
    { id: 15, user_id: 4, account_id: 9, can_view: true },
    { id: 16, user_id: 4, account_id: 10, can_view: true },
    { id: 17, user_id: 5, account_id: 1, can_view: true },
    { id: 18, user_id: 5, account_id: 2, can_view: true },
    { id: 19, user_id: 5, account_id: 3, can_view: true },
    { id: 20, user_id: 5, account_id: 4, can_view: true },
    { id: 21, user_id: 5, account_id: 5, can_view: true },
    { id: 22, user_id: 5, account_id: 6, can_view: true },
    { id: 23, user_id: 5, account_id: 7, can_view: true },
    { id: 24, user_id: 5, account_id: 8, can_view: true },
    { id: 25, user_id: 5, account_id: 9, can_view: true },
    { id: 26, user_id: 5, account_id: 10, can_view: true }
  ];

  constructor() {
    // Validate account types
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    this.accounts.forEach(account => {
      if (!validTypes.includes(account.type)) {
        throw new Error(`Invalid account type '${account.type}' for account ${account.account_number}`);
      }
    });
  }

  getAccounts(userId: number): Observable<Account[]> {
    const accessibleAccountIds = this.permissions
      .filter(p => p.user_id === userId && p.can_view)
      .map(p => p.account_id);
    const accounts = this.accounts.filter(a => accessibleAccountIds.includes(a.id!));
    return of(accounts);
  }

  getAccount(accountId: number): Observable<Account> {
    const account = this.accounts.find(a => a.id === accountId);
    return of(account!);
  }

  getTransactions(accountId?: number, page = 0, pageSize = 100): Observable<{ entries: Transaction[], total: number }> {
    let entries = this.transactions;
    if (accountId) {
      entries = entries.filter(t => t.account_id === accountId);
    }
    const total = entries.length;
    entries = entries.slice(page * pageSize, (page + 1) * pageSize);
    return of({ entries, total });
  }

  addTransaction(tx: Transaction): Observable<Transaction> {
    const account = this.accounts.find(a => a.id === tx.account_id);
    if (!account) throw new Error('Account not found');
    
    const isAssetOrExpense = account.type === 'Asset' || account.type === 'Expense';
    const balanceChange = (isAssetOrExpense ? 1 : -1) * (tx.debit ? 1 : -1) * tx.amount;
    account.balance += balanceChange;
    
    if (tx.from_account_id) {
      const fromAccount = this.accounts.find(a => a.id === tx.from_account_id);
      if (!fromAccount) throw new Error('From account not found');
      const fromIsAssetOrExpense = fromAccount.type === 'Asset' || fromAccount.type === 'Expense';
      fromAccount.balance += (fromIsAssetOrExpense ? -1 : 1) * (tx.debit ? -1 : 1) * tx.amount;
    }

    const accountTransactions = this.transactions
      .filter(t => t.account_id === tx.account_id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastTx = accountTransactions[accountTransactions.length - 1];
    tx.id = this.transactions.length + 1;
    tx.running_balance = (lastTx ? lastTx.running_balance : account.starting_balance) + balanceChange;
    
    this.transactions.push(tx);
    return of(tx);
  }

  verifyChargeCode(code: string, accountId: number, employeeId: number, amount: number): Observable<boolean> {
    const chargeCode = this.chargeCodes.find(
      cc => cc.charge_code === code && cc.account_id === accountId && cc.employee_id === employeeId
    );
    if (!chargeCode) return of(false);

    const user = this.users.find(u => u.id === employeeId);
    if (user?.role === 'Manager' || user?.role === 'Admin') {
      const tx: Transaction = {
        account_id: accountId,
        amount,
        debit: false,
        date: new Date().toISOString(),
        description: `Charge by ${this.employees.find(e => e.id === employeeId)?.name} using code ${code}`,
        running_balance: 0
      };
      return this.addTransaction(tx).pipe(map(() => true));
    }
    return of(true); // Placeholder for pending approval
  }

  getAccountName(accountId: number): string {
    return this.accounts.find(a => a.id === accountId)?.name || 'Unknown';
  }

  canPost(account: Account, userId: number): boolean {
    const hasChargeCode = this.chargeCodes.some(
      cc => cc.account_id === account.id && this.employees.some(e => e.id === cc.employee_id && e.id === userId)
    );
    const hasPermission = this.permissions.some(
      p => p.user_id === userId && p.account_id === account.id && p.can_view
    );
    return hasChargeCode && hasPermission;
  }
}