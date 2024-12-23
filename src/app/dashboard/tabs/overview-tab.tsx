"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Overview } from "./overview"
import { Transaction } from "../../components/lib/interfaces"
import { formatCurrency } from "../../components/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../../components/ui/table"

interface OverviewTabProps {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  selectedMonthName: string;
  filteredTransactions: Transaction[];
}

export function OverviewTab({ 
  transactions, 
  selectedMonthName
}: OverviewTabProps) {
  const currentYear = new Date().getFullYear();

  // Filter transactions for the current year
  const currentYearTransactions = transactions.filter(transaction => 
    transaction.anoReferencia === currentYear
  );

  // Calculate totals for the current year
  const totalIncomeFiltered = currentYearTransactions.reduce((acc, transaction) => 
    acc + (transaction.valor > 0 ? transaction.valor : 0), 0);
  const totalExpensesFiltered = currentYearTransactions.reduce((acc, transaction) => 
    acc + (transaction.valor < 0 && transaction.categoria !== "Reserva" ? Math.abs(transaction.valor) : 0), 0);
  
  // Calculate total invested amount
  const totalInvestedFiltered = currentYearTransactions.reduce((acc, transaction) => 
    acc + (transaction.categoria === "Reserva" && transaction.subcategoria === "Investimento" ? Math.abs(transaction.valor) : 0), 0);

  // Find the last available month and year
  const lastAvailableMonth = currentYearTransactions.length > 0 
  ? Math.max(...currentYearTransactions.map(t => t.mesReferencia))
  : new Date().getMonth() + 1; // Default to current month if no transactions

  const lastAvailableYear = Math.max(...transactions.map(t => t.anoReferencia))

  // Safe parsing of parcela string
  const safeParseInstallment = (parcela: string | null | undefined) => {
    if (!parcela) return { current: 0, total: 0 };
    
    // Remove any whitespace and convert to lowercase for consistent parsing
    const cleaned = parcela.trim().toLowerCase();
    
    // Remove "parcela" prefix if present
    const parcelaRemoved = cleaned.replace(/^parcela\s*/, '');
    
    // Split by "/" or possible variations
    const parts = parcelaRemoved.split(/[/\s]+/);
    
    // Try to parse current and total installments
    const current = parts.length > 0 ? parseInt(parts[0], 10) : 0;
    const total = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    
    return { 
      current: isNaN(current) ? 0 : current, 
      total: isNaN(total) ? 0 : total 
    };
  };

  // Find installment transactions from the last available month
  const lastMonthInstallmentTransactions = transactions.filter(transaction => {
    // Check if transaction is from the last available month and year
    const isLastMonth = transaction.mesReferencia === lastAvailableMonth && 
                        transaction.anoReferencia === lastAvailableYear;

    // Check if transaction has parcela information and is not fully paid
    if (!isLastMonth || !transaction.parcela) return false;

    // Safe parsing of installment
    const { current, total } = safeParseInstallment(transaction.parcela);
    
    // Keep only transactions that are not fully paid
    return current > 0 && total > 0 && current <= total;
  }).sort((a, b) => {
    const aInstallment = safeParseInstallment(a.parcela);
    const bInstallment = safeParseInstallment(b.parcela);

    // Prioritize last installments
    if (aInstallment.current === aInstallment.total && bInstallment.current !== bInstallment.total) return -1;
    if (bInstallment.current === bInstallment.total && aInstallment.current !== aInstallment.total) return 1;

    // Then prioritize penultimate installments
    if (aInstallment.current === aInstallment.total - 1 && bInstallment.current !== bInstallment.total - 1) return -1;
    if (bInstallment.current === bInstallment.total - 1 && aInstallment.current !== bInstallment.total - 1) return 1;

    // If both are the same type of installment, maintain original order
    return 0;
  });

  // Calculate total value of installment transactions
  const totalInstallmentValue = lastMonthInstallmentTransactions.reduce((acc, transaction) => 
    acc + Math.abs(transaction.valor), 0);

  // Find penultimate installment transactions
  const penultimateInstallmentTransactions = lastMonthInstallmentTransactions.filter(transaction => {
    const { current, total } = safeParseInstallment(transaction.parcela);
    return current === total - 1;
  });

  // Find last installment transactions
  const lastInstallmentTransactions = lastMonthInstallmentTransactions.filter(transaction => {
    const { current, total } = safeParseInstallment(transaction.parcela);
    return current === total;
  });

  const totalPenultimateInstallmentValue = penultimateInstallmentTransactions.reduce((acc, transaction) => 
    acc + Math.abs(transaction.valor), 0);

  const totalLastInstallmentValue = lastInstallmentTransactions.reduce((acc, transaction) => 
    acc + Math.abs(transaction.valor), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Total
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpensesFiltered - totalIncomeFiltered)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas ({selectedMonthName})
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpensesFiltered)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas ({selectedMonthName})</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncomeFiltered)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestedFiltered)}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview transactions={currentYearTransactions} />
          </CardContent>
        </Card>
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Transações Parceladas  ({lastAvailableMonth}/{lastAvailableYear})</CardTitle>
          </CardHeader>
          <CardContent>
            {lastMonthInstallmentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Parcelas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastMonthInstallmentTransactions.map((transaction: Transaction, index: number) => {
                    // Safe parsing of installment
                    const { current, total } = safeParseInstallment(transaction.parcela);
                    const isPenultimateParcela = current === total - 1;
                    const isUltimaParcela = current === total;

                    return (
                      <TableRow 
                        key={index} 
                        className={isPenultimateParcela ? 'bg-green-100 hover:bg-green-200' : isUltimaParcela ? 'bg-orange-100 hover:bg-orange-200' : ''}
                      >
                        <TableCell>{transaction.descricao}</TableCell>
                        <TableCell>{formatCurrency(Math.abs(transaction.valor))}</TableCell>
                        <TableCell>{transaction.parcela || 'N/A'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  {penultimateInstallmentTransactions.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={1} className="font-bold">Total Penúltimas Parcelas</TableCell>
                      <TableCell className="font-bold">{formatCurrency(totalPenultimateInstallmentValue)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  {lastInstallmentTransactions.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={1} className="font-bold">Total Últimas Parcelas</TableCell>
                      <TableCell className="font-bold">{formatCurrency(totalLastInstallmentValue)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={1} className="font-bold">Total</TableCell>
                    <TableCell className="font-bold">{formatCurrency(totalInstallmentValue)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhuma transação parcelada encontrada.</p>
            )}
          </CardContent>
        </Card>       
      </div>
    </div>
  )
}
