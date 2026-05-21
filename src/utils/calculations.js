export const CONTRACTOR_RATE = 0.07;

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateTransactionTotal(quantity, unitPrice) {
  return toNumber(quantity) * toNumber(unitPrice);
}

export function sumTransactions(transactions) {
  return transactions.reduce((sum, transaction) => sum + toNumber(transaction.total), 0);
}

export function sumAllocations(allocations, status = null) {
  return allocations
    .filter((allocation) => !status || allocation.status === status)
    .reduce((sum, allocation) => sum + toNumber(allocation.amount), 0);
}

export function calculateCustodyBalance(allocations, transactions) {
  const assignedTotal = sumAllocations(allocations);
  const receivedTotal = sumAllocations(allocations, 'received');
  const pendingTotal = sumAllocations(allocations, 'pending');
  const spentTotal = sumTransactions(transactions);
  return {
    assignedTotal,
    receivedTotal,
    pendingTotal,
    spentTotal,
    remainingTotal: receivedTotal - spentTotal
  };
}

export function filterCustodyScope(items, projectId, userId) {
  return items.filter((item) => item.projectId === projectId && item.userId === userId);
}

export function calculateContractorAmount(total) {
  return toNumber(total) * CONTRACTOR_RATE;
}

export function calculateProjectReport(transactions) {
  const custodyTotal = sumTransactions(transactions);
  const contractorAmount = calculateContractorAmount(custodyTotal);
  return {
    custodyTotal,
    contractorRate: CONTRACTOR_RATE,
    contractorAmount,
    finalTotal: custodyTotal + contractorAmount
  };
}

export function formatCurrency(value) {
  return `${toNumber(value).toLocaleString('ar-LY', { maximumFractionDigits: 2 })} د.ل`;
}

export function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ar-LY');
}
