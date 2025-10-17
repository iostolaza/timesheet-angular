
// src/app/core/models/financial.model.ts

export interface Account {
    id?: number;
    account_number: string;
    name: string;
    details: string;
    balance: number;
    starting_balance: number;
    ending_balance?: number;
    date: string;  // ISO format
    type: string;  // Should be 'Asset', 'Liability', 'Equity', 'Revenue', or 'Expense'
}

export interface Employee {
    id?: number;
    name: string;
}

export interface ChargeCode {
    id?: number;
    account_id: number;
    employee_id: number;
    charge_code: string;
}

export interface Transaction {
    id?: number;
    account_id: number;
    from_account_id?: number;
    from_name?: string;
    amount: number;
    debit: boolean;  // true = debit (increase for assets/expenses)
    date: string;
    description: string;
    running_balance: number;
}

export interface User {
    id?: number;
    name: string;
    role: 'Employee' | 'Manager' | 'Admin';
}

export interface Permission {
    id?: number;
    user_id: number;
    account_id: number;
    can_view: boolean;
}